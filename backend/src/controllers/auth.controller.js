const authService = require('../services/auth.service');
const { registerSchema, loginSchema } = require('../validators/auth.validator');
const AppError = require('../errors/appError');

class AuthController {
  async register(req, res, next) {
    try {
      // Validate request payload
      const parseResult = registerSchema.safeParse(req.body);
      if (!parseResult.success) {
        const messages = parseResult.error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new AppError(messages, 400);
      }

      const user = await authService.register(parseResult.data);

      res.status(201).json({
        status: 'success',
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      // Validate request payload
      const parseResult = loginSchema.safeParse(req.body);
      if (!parseResult.success) {
        const messages = parseResult.error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new AppError(messages, 400);
      }

      const { user, accessToken, refreshToken } = await authService.login(parseResult.data);

      // Store refresh token in HTTP-only cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 365 * 24 * 60 * 60 * 1000, // 365 days
      });

      res.status(200).json({
        status: 'success',
        data: {
          user,
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const refreshToken = (req.cookies && req.cookies.refreshToken) || (req.body && req.body.refreshToken) || req.headers['x-refresh-token'];
      if (!refreshToken) {
        throw new AppError('Refresh token is required', 401);
      }

      const { accessToken, refreshToken: newRefreshToken } = await authService.refresh(refreshToken);

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 365 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        status: 'success',
        data: {
          accessToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
