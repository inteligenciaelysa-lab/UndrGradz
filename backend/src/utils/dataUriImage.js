const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Base64 dataURLs inflate ~33% over the raw binary; cap the decoded payload at 5MB.
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const DATA_URI_RE = /^data:([a-zA-Z0-9.+/-]+);base64,([A-Za-z0-9+/=\s]+)$/;

/**
 * Validates a base64 `data:` image URI: correct format, allowed mime, size under MAX_IMAGE_BYTES.
 * @param {string} value
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateImageDataUri(value) {
  if (typeof value !== 'string') {
    return { valid: false, reason: 'La imagen debe ser un data: URI en base64' };
  }

  const match = DATA_URI_RE.exec(value);
  if (!match) {
    return { valid: false, reason: 'La imagen debe ser un data: URI en base64' };
  }

  const [, mime, base64] = match;
  if (!ALLOWED_IMAGE_MIMES.includes(mime.toLowerCase())) {
    return { valid: false, reason: 'Formato no permitido. Solo se aceptan JPG, JPEG, PNG o WEBP' };
  }

  const clean = base64.replace(/\s/g, '');
  const padding = (clean.match(/=+$/) || [''])[0].length;
  const bytes = Math.floor((clean.length * 3) / 4) - padding;
  if (bytes > MAX_IMAGE_BYTES) {
    return { valid: false, reason: `La imagen (${(bytes / (1024 * 1024)).toFixed(2)}MB) supera el tamaño máximo de 5MB` };
  }

  return { valid: true };
}

module.exports = {
  ALLOWED_IMAGE_MIMES,
  MAX_IMAGE_BYTES,
  validateImageDataUri,
};
