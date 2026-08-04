const AppError = require('../errors/appError');
const { getSignedReadUrlByFileName } = require('../integrations/gcs');

// Public — redirects to a short-lived signed GCS read URL for a private bucket object.
class MediaController {
  async getMedia(req, res, next) {
    try {
      const { path } = req.query;
      if (!path || typeof path !== 'string') {
        throw new AppError('Missing or invalid "path" query parameter', 400);
      }
      const signedUrl = await getSignedReadUrlByFileName(path);
      res.redirect(302, signedUrl);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MediaController();
