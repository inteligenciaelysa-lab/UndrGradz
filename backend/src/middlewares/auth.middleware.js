const { verifyAccessToken } = require('../utils/jwt');
const prisma = require('../database/prisma');
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
      },
    });

    if (!user || user.isDeleted) {
      throw new AppError('User account no longer exists', 401);
    }

    if (user.status === 'BANNED') {
      throw new AppError('Your account has been permanently banned.', 403);
    }

    if (user.status === 'SUSPENDED') {
      if (user.suspendedUntil && new Date() > new Date(user.suspendedUntil)) {
        // Auto-reactivate expired suspension
        await prisma.user.update({
          where: { id: user.id },
          data: { status: 'ACTIVE', suspensionReason: null, suspendedUntil: null },
        });
      } else {
        const untilText = user.suspendedUntil ? ` until ${new Date(user.suspendedUntil).toLocaleDateString()}` : '';
        throw new AppError(`Your account is suspended${untilText}. Reason: ${user.suspensionReason || 'Violation of terms'}`, 403);
      }
    }

    req.user = decoded; // Attach user payload { userId, email } to request
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect,
};
