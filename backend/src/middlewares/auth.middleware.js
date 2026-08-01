const { verifyAccessToken } = require('../utils/jwt');
const prisma = require('../database/prisma');
const AppError = require('../errors/appError');
const { enforceModerationStatus } = require('../utils/moderationStatus');

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

    // Verify token signature
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      throw new AppError('Invalid or expired token', 401);
    }

    // Check user active status in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        status: true,
        isDeleted: true,
        suspensionReason: true,
        suspendedUntil: true,
        banReason: true,
      },
    });

    if (!user || user.isDeleted) {
      throw new AppError('User account no longer exists', 401);
    }

    await enforceModerationStatus(prisma, user);

    req.user = decoded; // Attach user payload { userId, email } to request
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect,
};
