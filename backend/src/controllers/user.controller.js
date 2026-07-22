const userService = require('../services/user.service');
const { updateProfileSchema, updateLocationSchema, addPhotoSchema, updateGhostModeSchema } = require('../validators/user.validator');
const AppError = require('../errors/appError');

class UserController {
  async getMe(req, res, next) {
    try {
      const userId = req.user.userId;
      const user = await userService.getProfile(userId);

      res.status(200).json({
        status: 'success',
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMe(req, res, next) {
    try {
      const userId = req.user.userId;

      // Validate inputs
      const parseResult = updateProfileSchema.safeParse(req.body);
      if (!parseResult.success) {
        const messages = parseResult.error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new AppError(messages, 400);
      }

      const profile = await userService.updateProfile(userId, parseResult.data);

      res.status(200).json({
        status: 'success',
        data: {
          profile,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateLocation(req, res, next) {
    try {
      const userId = req.user.userId;

      // Validate inputs
      const parseResult = updateLocationSchema.safeParse(req.body);
      if (!parseResult.success) {
        const messages = parseResult.error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new AppError(messages, 400);
      }

      const { latitude, longitude } = parseResult.data;
      const profile = await userService.updateLocation(userId, latitude, longitude);

      res.status(200).json({
        status: 'success',
        data: {
          profile,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async addPhoto(req, res, next) {
    try {
      const userId = req.user.userId;

      // Validate inputs
      const parseResult = addPhotoSchema.safeParse(req.body);
      if (!parseResult.success) {
        const messages = parseResult.error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new AppError(messages, 400);
      }

      const { uploadUrl, publicUrl, photo } = await userService.addPhoto(userId, parseResult.data.contentType);

      res.status(201).json({
        status: 'success',
        data: {
          uploadUrl,
          publicUrl,
          photo,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async deletePhoto(req, res, next) {
    try {
      const userId = req.user.userId;
      const { photoId } = req.params;

      await userService.deletePhoto(userId, photoId);

      res.status(200).json({
        status: 'success',
        message: 'Photo deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Mock handler to simulate GCS PUT upload locally
  async mockUploadReceiver(req, res, next) {
    try {
      const { fileName } = req.query;
      console.log(`[GCS MOCK] File upload received for path: ${fileName}`);
      
      const path = require('path');
      const fs = require('fs');
      
      const targetPath = path.join(__dirname, '../../public/mock-uploads', fileName);
      const targetDir = path.dirname(targetPath);
      
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      const writeStream = fs.createWriteStream(targetPath);
      req.pipe(writeStream);
      
      writeStream.on('finish', () => {
        res.status(200).json({
          status: 'success',
          message: 'Mock GCS file uploaded successfully!',
        });
      });
      
      writeStream.on('error', (err) => {
        next(err);
      });
    } catch (error) {
      next(error);
    }
  }

  async updateGhostMode(req, res, next) {
    try {
      const userId = req.user.userId;

      // Validate inputs
      const parseResult = updateGhostModeSchema.safeParse(req.body);
      if (!parseResult.success) {
        const messages = parseResult.error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new AppError(messages, 400);
      }

      const { isGhostMode } = parseResult.data;
      const profile = await userService.updateGhostMode(userId, isGhostMode);

      // Broadcast changes to active friends
      const { notifyGhostModeChanged } = require('../socket');
      await notifyGhostModeChanged(userId, isGhostMode);

      res.status(200).json({
        status: 'success',
        data: {
          profile,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async searchUsers(req, res, next) {
    try {
      const { q } = req.query;
      const currentUserId = req.user.userId;
      if (!q || !q.trim()) {
        return res.status(200).json({ status: 'success', data: { users: [] } });
      }
      const users = await userService.searchUsers(currentUserId, q.trim());
      res.status(200).json({
        status: 'success',
        data: {
          users,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
