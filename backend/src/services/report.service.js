const prisma = require('../database/prisma');
const AppError = require('../errors/appError');

const EVIDENCE_MESSAGE_COUNT = 20;

class ReportService {
  /**
   * The single place that writes a Report row. Both the student-facing flow
   * (createUserReport, below) and the admin-facing flow
   * (admin.service.js createReport) go through this, so the insert itself is
   * never duplicated between the two callers.
   */
  async insertReport(data) {
    return prisma.report.create({ data });
  }

  /**
   * Files a report from the app (e.g. the chat "Report User" flow). Unlike
   * the admin-facing createReport, this always targets a USER and, when a
   * match is given, snapshots the last messages as evidence and verifies the
   * reporter actually belongs to that match — reusing chatService.resolveMatch
   * rather than re-implementing that membership check.
   */
  async createUserReport({ reporterId, targetUserId, matchId, reason, details }) {
    if (!targetUserId || targetUserId === reporterId) {
      throw new AppError('Invalid report target.', 400);
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser || targetUser.isDeleted) {
      throw new AppError('User not found', 404);
    }

    // Duplicate-report guard: no second report from the same person, about
    // the same person, for the same reason, while one is still open.
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId,
        targetUserId,
        reason,
        status: { in: ['PENDING', 'UNDER_REVIEW'] },
      },
    });
    if (existingReport) {
      throw new AppError('Ya existe un reporte pendiente para este usuario por este motivo.', 409);
    }

    let resolvedMatchId = null;
    let evidenceSnapshot = null;

    if (matchId) {
      // Lazy require: chat.service.js has no dependency on report.service.js,
      // this just avoids a static require cycle risk between service modules.
      const chatService = require('./chat.service');
      const match = await chatService.resolveMatch(reporterId, matchId);
      resolvedMatchId = match.id;

      const recentMessages = await prisma.message.findMany({
        where: { matchId: resolvedMatchId },
        orderBy: { createdAt: 'desc' },
        take: EVIDENCE_MESSAGE_COUNT,
        select: { id: true, senderId: true, content: true, type: true, createdAt: true },
      });
      // Read-only snapshot for admin review — the real Message rows are
      // never touched, edited, or deleted by this.
      evidenceSnapshot = recentMessages;
    }

    const report = await this.insertReport({
      reporterId,
      targetType: 'USER',
      targetId: targetUserId,
      targetUserId,
      matchId: resolvedMatchId,
      reason,
      details,
      evidenceSnapshot,
      status: 'PENDING',
    });

    const adminService = require('./admin.service');
    await adminService.createAuditLog({
      adminId: null,
      action: 'REPORT_CREATED',
      targetType: 'REPORT',
      targetId: report.id,
      details: { reporterId, targetUserId, reason, matchId: resolvedMatchId },
      ipAddress: null,
    });

    return report;
  }
}

module.exports = new ReportService();
