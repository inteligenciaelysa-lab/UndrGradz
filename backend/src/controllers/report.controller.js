const reportService = require('../services/report.service');
const { createReportSchema } = require('../validators/report.validator');
const AppError = require('../errors/appError');

class ReportController {
  async createReport(req, res, next) {
    try {
      const parseResult = createReportSchema.safeParse(req.body);
      if (!parseResult.success) {
        const messages = parseResult.error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new AppError(messages, 400);
      }

      const reporterId = req.user.userId;
      const report = await reportService.createUserReport({
        reporterId,
        ...parseResult.data,
      });

      res.status(201).json({
        status: 'success',
        data: { report },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportController();
