const crypto = require('crypto');
const { verifyAccessToken } = require('../utils/jwt');
const prisma = require('../database/prisma');
const AppError = require('../errors/appError');

/**
 * Middleware to authenticate administrative requests.
 * Enforces JWT token validation, active account check, admin session validity via SHA-256 token hash,
 * and ensures the user possesses administrative privileges.
 */
const protectAdmin = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      throw new AppError('Administrative authentication required. Please log in to the Admin Panel.', 401);
    }

    // 1. Verify token signature
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      throw new AppError('Invalid or expired admin token.', 401);
    }

    // 2. Fetch user from DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        handle: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        isDeleted: true,
        twoFactorEnabled: true,
      },
    });

    if (!user || user.isDeleted) {
      throw new AppError('Admin account no longer exists.', 401);
    }

    if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
      throw new AppError(`Admin account is currently ${user.status.toLowerCase()}. Access denied.`, 403);
    }

    // 3. Verify user has an administrative role (Not a standard STUDENT user)
    const validRoles = ['SUPPORT', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'];
    if (!validRoles.includes(user.role)) {
      throw new AppError('Access denied: Administrative privileges required.', 403);
    }

    // 4. Compute SHA-256 token hash to check session status securely (Never store raw JWT in DB)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const session = await prisma.adminSession.findUnique({
      where: { tokenHash },
    });

    if (!session || session.isRevoked || session.userId !== user.id) {
      throw new AppError('Admin session has been revoked or is invalid. Please log in again.', 401);
    }

    // Update session last active timestamp asynchronously
    prisma.adminSession.update({
      where: { id: session.id },
      data: { lastActive: new Date() },
    }).catch(() => {});

    // Attach verified admin user object to request
    req.user = user;
    req.adminToken = token;
    req.adminSessionId = session.id;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Fine-grained Role-Based Access Control (RBAC) middleware.
 * Ensures the logged-in admin has one of the specified allowed roles.
 * @param  {...string} allowedRoles - e.g. 'SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT'
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Permission denied. Required role: [${allowedRoles.join(', ')}]. Your role: ${req.user ? req.user.role : 'None'}`,
          403
        )
      );
    }
    next();
  };
};

module.exports = {
  protectAdmin,
  requireRole,
};
