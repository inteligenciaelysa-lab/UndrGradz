const { verifyAccessToken } = require('../utils/jwt');
const AppError = require('../errors/appError');

const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('You are not logged in! Please log in to get access.', 401);
    }

    // Verify token
    try {
      const decoded = verifyAccessToken(token);
      req.user = decoded; // Attach user payload { userId, email } to request
      console.log(`🔑 AUTH MIDDLEWARE: [${req.method} ${req.originalUrl}] User ID: ${decoded.userId}, Email: ${decoded.email}`);
      next();
    } catch (err) {
      throw new AppError('Invalid or expired token', 401);
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect,
};
