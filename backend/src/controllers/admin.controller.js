const adminService = require('../services/admin.service');

class AdminController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip || req.headers['x-forwarded-for'];
      const userAgent = req.headers['user-agent'];

      const result = await adminService.adminLogin({ email, password, ipAddress, userAgent });

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDashboard(req, res, next) {
    try {
      const data = await adminService.getDashboardData();
      res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req, res, next) {
    try {
      const { search, status, role, university, page, limit } = req.query;
      const data = await adminService.getUsers({ search, status, role, university, page, limit });
      res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserDetails(req, res, next) {
    try {
      const { id } = req.params;
      const user = await adminService.getUserDetails(id);
      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, reason, durationDays } = req.body;
      const ipAddress = req.ip || req.headers['x-forwarded-for'];

      const user = await adminService.updateUserStatus(req.user.id, id, { status, reason, durationDays }, ipAddress);
      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  async softDeleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const ipAddress = req.ip || req.headers['x-forwarded-for'];

      const user = await adminService.softDeleteUser(req.user.id, id, ipAddress);
      res.status(200).json({
        status: 'success',
        message: 'User soft-deleted successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const ipAddress = req.ip || req.headers['x-forwarded-for'];

      const user = await adminService.updateUserRole(req.user.id, id, role, ipAddress);
      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  async getReports(req, res, next) {
    try {
      const { status, targetType, page, limit } = req.query;
      const data = await adminService.getReports({ status, targetType, page, limit });
      res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async createReport(req, res, next) {
    try {
      const { targetType, targetId, reason, details } = req.body;
      const reporterId = req.user.id || req.user.userId;
      const report = await adminService.createReport({ reporterId, targetType, targetId, reason, details });
      res.status(201).json({
        status: 'success',
        data: { report },
      });
    } catch (error) {
      next(error);
    }
  }

  async resolveReport(req, res, next) {
    try {
      const { id } = req.params;
      const { action, status, resolutionNotes, userAction, durationDays } = req.body;
      const ipAddress = req.ip || req.headers['x-forwarded-for'];
      const report = await adminService.resolveReport(req.user.id, id, { action, status, resolutionNotes, userAction, durationDays }, ipAddress);
      res.status(200).json({
        status: 'success',
        data: { report },
      });
    } catch (error) {
      next(error);
    }
  }

  async getUniversities(req, res, next) {
    try {
      const { search, status, type, country, state, city, isOfficial, isDeleted, page, limit } = req.query;
      const data = await adminService.getUniversities({ search, status, type, country, state, city, isOfficial, isDeleted, page, limit });
      res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUniversityById(req, res, next) {
    try {
      const { id } = req.params;
      const university = await adminService.getUniversityById(id);
      res.status(200).json({
        status: 'success',
        data: { university },
      });
    } catch (error) {
      next(error);
    }
  }

  async createUniversity(req, res, next) {
    try {
      const ipAddress = req.ip || req.headers['x-forwarded-for'];
      const university = await adminService.createUniversity(req.user.id, req.body, ipAddress);
      res.status(201).json({
        status: 'success',
        data: { university },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUniversity(req, res, next) {
    try {
      const { id } = req.params;
      const ipAddress = req.ip || req.headers['x-forwarded-for'];
      const university = await adminService.updateUniversity(req.user.id, id, req.body, ipAddress);
      res.status(200).json({
        status: 'success',
        data: { university },
      });
    } catch (error) {
      next(error);
    }
  }

  async softDeleteUniversity(req, res, next) {
    try {
      const { id } = req.params;
      const ipAddress = req.ip || req.headers['x-forwarded-for'];
      const university = await adminService.softDeleteUniversity(req.user.id, id, ipAddress);
      res.status(200).json({
        status: 'success',
        message: 'University soft-deleted successfully',
        data: { university },
      });
    } catch (error) {
      next(error);
    }
  }

  async restoreUniversity(req, res, next) {
    try {
      const { id } = req.params;
      const ipAddress = req.ip || req.headers['x-forwarded-for'];
      const university = await adminService.restoreUniversity(req.user.id, id, ipAddress);
      res.status(200).json({
        status: 'success',
        message: 'University restored successfully',
        data: { university },
      });
    } catch (error) {
      next(error);
    }
  }

  async getEvents(req, res, next) {
    try {
      const { search, section, status, page, limit } = req.query;
      const data = await adminService.getEvents({ search, section, status, page, limit });
      res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateEventStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const ipAddress = req.ip || req.headers['x-forwarded-for'];

      const event = await adminService.updateEventStatus(req.user.id, id, status, ipAddress);
      res.status(200).json({
        status: 'success',
        data: { event },
      });
    } catch (error) {
      next(error);
    }
  }

  async softDeleteEvent(req, res, next) {
    try {
      const { id } = req.params;
      const ipAddress = req.ip || req.headers['x-forwarded-for'];

      const event = await adminService.softDeleteEvent(req.user.id, id, ipAddress);
      res.status(200).json({
        status: 'success',
        message: 'Event soft-deleted successfully',
        data: { event },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUserPhoto(req, res, next) {
    try {
      const { id } = req.params;
      const ipAddress = req.ip || req.headers['x-forwarded-for'];

      await adminService.deleteUserPhoto(req.user.id, id, ipAddress);
      res.status(200).json({
        status: 'success',
        message: 'Photo deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getAdministrators(req, res, next) {
    try {
      const administrators = await adminService.getAdministrators();
      res.status(200).json({
        status: 'success',
        data: { administrators },
      });
    } catch (error) {
      next(error);
    }
  }

  async createAdministrator(req, res, next) {
    try {
      const ipAddress = req.ip || req.headers['x-forwarded-for'];
      const administrator = await adminService.createAdministrator(req.user.id, req.body, ipAddress);
      res.status(201).json({
        status: 'success',
        data: { administrator },
      });
    } catch (error) {
      next(error);
    }
  }

  async getAdminSessions(req, res, next) {
    try {
      const sessions = await adminService.getAdminSessions(req.user.id);
      res.status(200).json({
        status: 'success',
        data: { sessions },
      });
    } catch (error) {
      next(error);
    }
  }

  async revokeSession(req, res, next) {
    try {
      const { id } = req.params;
      const ipAddress = req.ip || req.headers['x-forwarded-for'];

      const session = await adminService.revokeSession(req.user.id, id, ipAddress);
      res.status(200).json({
        status: 'success',
        data: { session },
      });
    } catch (error) {
      next(error);
    }
  }

  async getAuditLogs(req, res, next) {
    try {
      const { adminId, action, page, limit } = req.query;
      const data = await adminService.getAuditLogs({ adminId, action, page, limit });
      res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async globalSearch(req, res, next) {
    try {
      const { q } = req.query;
      const results = await adminService.globalSearch(q);
      res.status(200).json({
        status: 'success',
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }

  async sendNotification(req, res, next) {
    try {
      const { targetType, targetId, university, title, message, type, criteria } = req.body;
      const ipAddress = req.ip || req.headers['x-forwarded-for'];

      const result = await adminService.sendNotification(req.user.id, { targetType, targetId, university, title, message, type, criteria }, ipAddress);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSettings(req, res, next) {
    try {
      const settings = await adminService.getSettings();
      res.status(200).json({
        status: 'success',
        data: { settings },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSetting(req, res, next) {
    try {
      const { key, value, description } = req.body;
      const ipAddress = req.ip || req.headers['x-forwarded-for'];

      const setting = await adminService.updateSetting(req.user.id, key, value, description, ipAddress);
      res.status(200).json({
        status: 'success',
        data: { setting },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
