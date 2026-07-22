const { Storage } = require('@google-cloud/storage');
const crypto = require('crypto');

// Initialize Google Cloud Storage
const isProductionGCP = process.env.GCS_BUCKET_NAME && process.env.GOOGLE_APPLICATION_CREDENTIALS;

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
const generateUploadSignedUrl = async (userId, contentType = 'image/jpeg') => {
  const fileExtension = contentType.split('/')[1] || 'jpg';
  const fileName = `users/${userId}/${crypto.randomUUID()}.${fileExtension}`;

  if (!isProductionGCP) {
    // Local / development mock mode
    console.log(`[GCS MOCK] Generating fake upload signed URL for user ${userId}`);
    const mockUploadUrl = `http://localhost:3000/api/v1/users/me/photos/mock-upload-receiver?fileName=${encodeURIComponent(fileName)}`;
    const mockPublicUrl = `http://localhost:3000/public/mock-uploads/${fileName}`;

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

module.exports = {
  generateUploadSignedUrl,
};
