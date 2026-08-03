const { Storage } = require('@google-cloud/storage');
const crypto = require('crypto');

// Initialize Google Cloud Storage
// On Cloud Run, real auth comes from the attached service account (Application Default
// Credentials), not a credentials file. NODE_ENV=production or K_SERVICE (injected
// automatically by Cloud Run) are the real environment signals for "production mode".
const isProductionGCP = process.env.NODE_ENV === 'production' || !!process.env.K_SERVICE;

let storage;
let bucket;

if (isProductionGCP) {
  storage = new Storage();
  bucket = storage.bucket(process.env.GCS_BUCKET_NAME);
}

/**
 * Generates a signed URL for uploading a profile photo directly to Google Cloud Storage.
 * If credentials are not configured, it runs in local/development mock mode.
 * @param {string} userId - The ID of the authenticated user
 * @param {string} contentType - The MIME type of the file (e.g. image/jpeg)
 * @returns {Promise<{ uploadUrl: string, publicUrl: string, fileName: string }>}
 */
const generateUploadSignedUrl = async (userId, contentType = 'image/jpeg', req = null) => {
  const fileExtension = contentType.split('/')[1] || 'jpg';
  const fileName = `users/${userId}/${crypto.randomUUID()}.${fileExtension}`;

  if (!isProductionGCP) {
    const protocol = (req && req.headers && req.headers['x-forwarded-proto']) || (req ? req.protocol : 'http');
    const host = (req && req.headers && req.headers['x-forwarded-host']) || (req ? req.get('host') : 'localhost:3000');
    const baseUrl = `${protocol}://${host}`;

    console.log(`[GCS MOCK] Generating fake upload signed URL for user ${userId} on ${baseUrl}`);
    const mockUploadUrl = `${baseUrl}/api/v1/users/me/photos/mock-upload-receiver?fileName=${encodeURIComponent(fileName)}`;
    const mockPublicUrl = `${baseUrl}/public/mock-uploads/${fileName}`;

    return {
      uploadUrl: mockUploadUrl,
      publicUrl: mockPublicUrl,
      fileName,
    };
  }

  // Real GCP Mode
  const file = bucket.file(fileName);
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType,
  });

  const publicUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${fileName}`;

  return {
    uploadUrl: url,
    publicUrl,
    fileName,
  };
};

/**
 * Generates a signed URL for uploading a chat audio message to Google Cloud Storage.
 * Supports both production GCP and local mock mode.
 * @param {string} userId - Auth user ID
 * @param {string} matchId - Match room ID
 * @param {string} contentType - MIME type of the audio (e.g., audio/webm, audio/mp4, audio/aac)
 * @param {object} req - Express request object for dynamic host resolution
 * @returns {Promise<{ uploadUrl: string, publicUrl: string, fileName: string }>}
 */
const generateChatAudioSignedUrl = async (userId, matchId, contentType = 'audio/webm', req = null) => {
  const rawSubtype = (contentType.split('/')[1] || 'webm').split(';')[0].trim();
  let ext = 'webm';
  if (rawSubtype.includes('mp4') || rawSubtype.includes('aac') || rawSubtype.includes('m4a')) ext = 'm4a';
  else if (rawSubtype.includes('ogg')) ext = 'ogg';
  else if (rawSubtype.includes('wav')) ext = 'wav';
  else if (rawSubtype.includes('3gpp')) ext = '3gp';

  const fileName = `chats/${matchId}/audios/${crypto.randomUUID()}.${ext}`;

  if (!isProductionGCP) {
    const protocol = (req && req.headers && req.headers['x-forwarded-proto']) || (req ? req.protocol : 'http');
    const host = (req && req.headers && req.headers['x-forwarded-host']) || (req ? req.get('host') : 'localhost:3000');
    const baseUrl = `${protocol}://${host}`;

    console.log(`[GCS MOCK] Generating fake chat audio upload signed URL for match ${matchId} on ${baseUrl}`);
    const mockUploadUrl = `${baseUrl}/api/v1/users/me/photos/mock-upload-receiver?fileName=${encodeURIComponent(fileName)}`;
    const mockPublicUrl = `${baseUrl}/public/mock-uploads/${fileName}`;

    return {
      uploadUrl: mockUploadUrl,
      publicUrl: mockPublicUrl,
      fileName,
    };
  }

  const file = bucket.file(fileName);
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000,
    contentType,
  });

  const publicUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${fileName}`;

  return {
    uploadUrl: url,
    publicUrl,
    fileName,
  };
};

module.exports = {
  generateUploadSignedUrl,
  generateChatAudioSignedUrl,
  isProductionGCP,
};

