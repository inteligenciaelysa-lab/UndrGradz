const fs = require('fs');
const path = require('path');
const { Storage } = require('@google-cloud/storage');
const { isProductionGCP } = require('../integrations/gcs');

/**
 * Robustly parses container headers (WebM, MP4/AAC, OGG, WAV) to extract real audio duration in seconds.
 * Fallback to bitrate estimation if header tags are missing.
 * @param {Buffer} buffer 
 * @returns {number} duration in seconds
 */
function parseAudioDurationFromBuffer(buffer) {
  if (!buffer || buffer.length < 16) return 0;

  try {
    // 1. WAV Container Parsing
    if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WAVE') {
      const byteRate = buffer.readUInt32LE(28);
      const subchunk2Size = buffer.readUInt32LE(40);
      if (byteRate > 0 && subchunk2Size > 0) {
        return Math.round(subchunk2Size / byteRate);
      }
    }

    // 2. MP4 / M4A / AAC Container Parsing (search for 'mvhd' atom)
    const mvhdIdx = buffer.indexOf(Buffer.from('mvhd'));
    if (mvhdIdx !== -1 && mvhdIdx + 24 < buffer.length) {
      const version = buffer[mvhdIdx + 4];
      let timeScale, duration;
      if (version === 1 && mvhdIdx + 36 < buffer.length) {
        timeScale = buffer.readUInt32BE(mvhdIdx + 20);
        duration = Number(buffer.readBigUInt64BE(mvhdIdx + 24));
      } else {
        timeScale = buffer.readUInt32BE(mvhdIdx + 12);
        duration = buffer.readUInt32BE(mvhdIdx + 16);
      }
      if (timeScale > 0 && duration > 0) {
        return Math.round(duration / timeScale);
      }
    }

    // 3. WebM / EBML Container Parsing (Search for Duration tag 0x4489)
    const durIdx = buffer.indexOf(Buffer.from([0x44, 0x89]));
    if (durIdx !== -1 && durIdx + 10 < buffer.length) {
      // TimecodeScale default is 1,000,000 ns (1ms)
      let timeScaleMs = 1;
      const tsIdx = buffer.indexOf(Buffer.from([0x2B, 0x59, 0xC0]));
      if (tsIdx !== -1 && tsIdx + 7 < buffer.length) {
        const tsLen = buffer[tsIdx + 3] & 0x07;
        if (tsLen === 4) timeScaleMs = buffer.readUInt32BE(tsIdx + 4) / 1000000;
      }

      // Read IEEE 754 float32 or float64 duration
      const tagLen = buffer[durIdx + 2];
      if (tagLen === 4) {
        const rawDur = buffer.readFloatBE(durIdx + 3);
        return Math.round((rawDur * timeScaleMs) / 1000);
      } else if (tagLen === 8) {
        const rawDur = buffer.readDoubleBE(durIdx + 3);
        return Math.round((rawDur * timeScaleMs) / 1000);
      }
    }

    // 4. Ogg Container Parsing (Granule position in last page)
    const oggIdx = buffer.lastIndexOf(Buffer.from('OggS'));
    if (oggIdx !== -1 && oggIdx + 14 < buffer.length) {
      const granulePos = Number(buffer.readBigInt64LE(oggIdx + 6));
      if (granulePos > 0) {
        // Opus sample rate is 48000Hz
        return Math.round(granulePos / 48000);
      }
    }
  } catch (err) {
    console.warn('[AUDIO VALIDATOR] Header parse error, falling back to bitrate estimation:', err);
  }

  // Fallback bitrate calculation for voice audio (~32kbps = ~4000 bytes/sec)
  const estimatedSecs = Math.round(buffer.length / 4000);
  return estimatedSecs;
}

/**
 * Validates audio file existence, size (<= 5MB), and real audio duration (<= 60s).
 * @param {string} mediaUrl - Public URL or GCS URL
 * @param {number} reportedDuration - Duration sent by client
 * @returns {Promise<{ valid: boolean, reason?: string, duration: number }>}
 */
async function validateAudioFile(mediaUrl, reportedDuration) {
  if (!mediaUrl || typeof mediaUrl !== 'string') {
    return { valid: false, reason: 'URL de audio no proporcionada' };
  }

  try {
    let fileBuffer = null;
    let fileSize = 0;

    // Check local mock file or GCS production object
    if (mediaUrl.includes('mock-uploads')) {
      const urlParts = mediaUrl.split('mock-uploads/');
      if (urlParts.length < 2) {
        return { valid: false, reason: 'Formato de URL mock inválido' };
      }
      let relativePath = decodeURIComponent(urlParts[1]);
      if (relativePath.includes('?')) {
        relativePath = relativePath.split('?')[0];
      }
      const localFilePath = path.join(__dirname, '../../public/mock-uploads', relativePath);

      if (!fs.existsSync(localFilePath)) {
        return { valid: false, reason: 'El archivo de audio no existe en el almacenamiento.' };
      }

      const stat = fs.statSync(localFilePath);
      fileSize = stat.size;
      if (fileSize === 0) {
        return { valid: false, reason: 'El archivo de audio está vacío (0 bytes).' };
      }

      fileBuffer = fs.readFileSync(localFilePath);
    } else if (isProductionGCP && mediaUrl.includes('storage.googleapis.com')) {
      const storage = new Storage();
      const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);
      const fileName = mediaUrl.split(`${process.env.GCS_BUCKET_NAME}/`)[1];

      if (!fileName) {
        return { valid: false, reason: 'Ruta de objeto GCS no válida' };
      }

      const file = bucket.file(fileName);
      const [exists] = await file.exists();
      if (!exists) {
        return { valid: false, reason: 'El archivo de audio no existe en Google Cloud Storage.' };
      }

      const [metadata] = await file.getMetadata();
      fileSize = Number(metadata.size || 0);

      // Download first 1MB for duration header parsing
      const [downloadedBuffer] = await file.download({ start: 0, end: 1024 * 1024 });
      fileBuffer = downloadedBuffer;
    } else {
      // Fallback for external URLs: validate duration reported & size if reachable
      const parsedDur = Math.round(Number(reportedDuration) || 0);
      if (parsedDur <= 0 || parsedDur > 60) {
        return { valid: false, reason: 'La duración del audio debe ser entre 1 y 60 segundos.' };
      }
      return { valid: true, duration: parsedDur };
    }

    // 1. File size ceiling check (5MB max for 60s voice audio)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
    if (fileSize > MAX_SIZE_BYTES) {
      return {
        valid: false,
        reason: `El tamaño del archivo de audio (${(fileSize / (1024 * 1024)).toFixed(2)}MB) excede el máximo permitido de 5MB.`
      };
    }

    // 2. Real audio duration validation from binary header
    const calculatedDuration = parseAudioDurationFromBuffer(fileBuffer);
    const finalDuration = calculatedDuration > 0 ? calculatedDuration : Math.round(Number(reportedDuration) || 1);

    // Reject if real duration exceeds 60 seconds (with 1 second grace tolerance for header rounding)
    if (finalDuration > 61) {
      return {
        valid: false,
        reason: `La duración real del audio (${finalDuration}s) excede el límite máximo permitido de 60 segundos.`
      };
    }

    return {
      valid: true,
      duration: Math.min(60, Math.max(1, finalDuration))
    };

  } catch (err) {
    console.error('❌ Audio validation exception:', err);
    return { valid: false, reason: 'Error al verificar el archivo de audio' };
  }
}

module.exports = {
  validateAudioFile,
  parseAudioDurationFromBuffer,
};
