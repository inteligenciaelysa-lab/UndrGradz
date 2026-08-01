const prisma = require('../database/prisma');
const AppError = require('../errors/appError');
const { findUserByIdentifier } = require('../utils/userLookup');

class AppealService {
  /**
   * Resolves the account an appeal is about. There is no password check here
   * on purpose: a rejected login never issues a token, so nothing short of
   * asking the user to re-type their password would let us verify it — and
   * the whole point of this screen is to never ask for it again. Filing or
   * checking on an appeal is a low-stakes, additive action (it can't change
   * or reveal anything about the account beyond what the rejected-login
   * screen already showed), so identifying by email alone is an acceptable
   * trade-off; the routes are still rate-limited (see auth.routes.js).
   */
  async _findUser(email) {
    const user = await findUserByIdentifier(email);
    if (!user || user.isDeleted) {
      throw new AppError('No account found for that email', 404);
    }
    return user;
  }

  /**
   * Lets the appeal screen check for an already-pending appeal up front (so
   * it can show that status instead of the form) without creating a new one.
   */
  async getAppealStatus({ email }) {
    const user = await this._findUser(email);

    const pendingAppeal = await prisma.appeal.findFirst({
      where: { userId: user.id, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    return { pendingAppeal };
  }

  async submitAppeal({ email, message }) {
    const user = await this._findUser(email);

    if (user.status !== 'SUSPENDED' && user.status !== 'BANNED') {
      throw new AppError('Your account does not currently have an active suspension or ban to appeal.', 400);
    }

    const existingAppeal = await prisma.appeal.findFirst({
      where: { userId: user.id, status: 'PENDING' },
    });
    if (existingAppeal) {
      throw new AppError('Ya tienes una apelación en revisión para esta sanción. Espera la resolución antes de enviar otra.', 409);
    }

    const appeal = await prisma.appeal.create({
      data: {
        userId: user.id,
        moderationStatus: user.status,
        originalReason: user.status === 'BANNED' ? user.banReason : user.suspensionReason,
        message,
      },
    });

    return appeal;
  }

  async getAppeals({ status, page = 1, limit = 20 }) {
    const skip = (page - 1) * limit;
    const where = {};
    if (status) where.status = status;

    const [total, appeals] = await Promise.all([
      prisma.appeal.count({ where }),
      prisma.appeal.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              handle: true,
              email: true,
              status: true,
              profile: { select: { university: true } },
            },
          },
          resolvedBy: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    return {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
      appeals,
    };
  }

  async resolveAppeal(adminId, appealId, { status, resolutionNotes }, ipAddress) {
    const appeal = await prisma.appeal.findUnique({ where: { id: appealId } });
    if (!appeal) throw new AppError('Appeal not found', 404);
    if (appeal.status !== 'PENDING') {
      throw new AppError('This appeal has already been resolved', 400);
    }

    const updatedAppeal = await prisma.appeal.update({
      where: { id: appealId },
      data: {
        status,
        resolutionNotes: resolutionNotes || null,
        resolvedById: adminId,
        resolvedAt: new Date(),
      },
    });

    const adminService = require('./admin.service');

    if (status === 'APPROVED') {
      await adminService.updateUserStatus(adminId, appeal.userId, { status: 'ACTIVE' }, ipAddress);
    }

    await adminService.createAuditLog({
      adminId,
      action: `APPEAL_${status}`,
      targetType: 'APPEAL',
      targetId: appealId,
      details: { userId: appeal.userId, moderationStatus: appeal.moderationStatus, resolutionNotes },
      ipAddress,
    });

    const title = status === 'APPROVED' ? 'Tu apelación fue aprobada' : 'Tu apelación fue rechazada';
    const message = status === 'APPROVED'
      ? 'Tu cuenta ha sido reactivada. Ya puedes iniciar sesión.'
      : (resolutionNotes || 'Tu sanción se mantiene vigente.');

    await this.notifyAppealResolution(appeal.userId, adminId, { status, title, message });

    return updatedAppeal;
  }

  /**
   * Writes the resolution to the Notification inbox and, if the user is
   * currently online, pushes it live over the same `user_${userId}` room
   * forceLogoutUser already uses. If delivered live, marks the notification
   * read immediately; otherwise it stays unread so login() can surface it.
   */
  async notifyAppealResolution(userId, adminId, { status, title, message }) {
    const notification = await prisma.notification.create({
      data: {
        recipientId: userId,
        senderId: adminId,
        title,
        message,
        type: 'MODERATION',
        isRead: false,
      },
    });

    const { forceNotify } = require('../socket');
    const delivered = forceNotify(userId, 'appealResolved', { status, title, message });
    if (delivered) {
      await prisma.notification.update({ where: { id: notification.id }, data: { isRead: true } });
    }
  }
}

module.exports = new AppealService();
