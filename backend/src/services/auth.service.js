const bcrypt = require('bcrypt');
const prisma = require('../database/prisma');
const AppError = require('../errors/appError');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');

class AuthService {
  async register(data) {
    const { email, phone, handle, password, firstName, lastName, birthDate, referralCode } = data;

    // Check if user already exists
    const conditions = [{ email }];
    if (phone) {
      conditions.push({ phone });
    }
    if (handle) {
      conditions.push({ handle });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: conditions,
      },
    });

    if (existingUser) {
      if (existingUser.email === email) throw new AppError('Email already registered', 400);
      if (phone && existingUser.phone === phone) throw new AppError('Phone number already registered', 400);
      if (handle && existingUser.handle === handle) throw new AppError('Username already taken', 400);
      throw new AppError('Email, phone or username already registered', 400);
    }

    // Verify referral code if passed
    let referredById = null;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode }
      });
      if (!referrer) {
        throw new AppError('Invalid referral code', 400);
      }
      referredById = referrer.id;
    }

    // Generate unique referral code for the new user
    const crypto = require('crypto');
    const userReferralCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        handle,
        passwordHash,
        firstName,
        lastName,
        birthDate,
        referralCode: userReferralCode,
        referredById,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        handle: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        referralCode: true,
        referredById: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(data) {
    const { email, password } = data;
    const identifier = email.trim();
    let user;

    if (identifier.includes('@') && !identifier.startsWith('@')) {
      // Query by email
      user = await prisma.user.findUnique({
        where: { email: identifier.toLowerCase() }
      });
    } else {
      // Query by handle
      const cleanHandle = identifier.replace(/^@/, '');
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { handle: cleanHandle },
            { handle: `@${cleanHandle}` }
          ]
        }
      });
    }

    if (!user) {
      throw new AppError('Invalid email or username or password', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or username or password', 401);
    }

    // Sign tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    // Return user details and tokens
    const userResponse = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      handle: user.handle,
      firstName: user.firstName,
      lastName: user.lastName,
      birthDate: user.birthDate,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      createdAt: user.createdAt,
    };

    return {
      user: userResponse,
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken);

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        throw new AppError('User no longer exists', 401);
      }

      // Generate new tokens
      const tokenPayload = {
        userId: user.id,
        email: user.email,
      };

      const newAccessToken = signAccessToken(tokenPayload);
      const newRefreshToken = signRefreshToken(tokenPayload);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }
}

module.exports = new AuthService();
