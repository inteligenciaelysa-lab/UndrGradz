const adminService = require('../services/admin.service');
const geoService = require('../services/geo.service');

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

  /* ==========================================================================
     CAMPUS MANAGEMENT (locations under a University — see admin.service.js)
     ========================================================================== */

  async getCampuses(req, res, next) {
    try {
      const { universityId } = req.params;
      const { includeDeleted } = req.query;
      const campuses = await adminService.getCampuses(universityId, { includeDeleted: includeDeleted === 'true' });
      res.status(200).json({
        status: 'success',
        data: { campuses },
      });
    } catch (error) {
      next(error);
    }
  }

  async createCampus(req, res, next) {
    try {
      const { universityId } = req.params;
      const ipAddress = req.ip || req.headers['x-forwarded-for'];
      const campus = await adminService.createCampus(req.user.id, universityId, req.body, ipAddress);
      res.status(201).json({
        status: 'success',
        data: { campus },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCampus(req, res, next) {
    try {
      const { id } = req.params;
      const ipAddress = req.ip || req.headers['x-forwarded-for'];
      const campus = await adminService.updateCampus(req.user.id, id, req.body, ipAddress);
      res.status(200).json({
        status: 'success',
        data: { campus },
      });
    } catch (error) {
      next(error);
    }
  }

  async softDeleteCampus(req, res, next) {
    try {
      const { id } = req.params;
      const ipAddress = req.ip || req.headers['x-forwarded-for'];
      const campus = await adminService.softDeleteCampus(req.user.id, id, ipAddress);
      res.status(200).json({
        status: 'success',
        message: 'Campus soft-deleted successfully',
        data: { campus },
      });
    } catch (error) {
      next(error);
    }
  }

  async restoreCampus(req, res, next) {
    try {
      const { id } = req.params;
      const ipAddress = req.ip || req.headers['x-forwarded-for'];
      const campus = await adminService.restoreCampus(req.user.id, id, ipAddress);
      res.status(200).json({
        status: 'success',
        message: 'Campus restored successfully',
        data: { campus },
      });
    } catch (error) {
      next(error);
    }
  }

  /* ==========================================================================
     GEO REFERENCE DATA (country / state / city cascading selects)
     ========================================================================== */

  async getGeoCountries(req, res, next) {
    try {
      res.status(200).json({ status: 'success', data: { countries: geoService.getCountries() } });
    } catch (error) {
      next(error);
    }
  }

  async getGeoStates(req, res, next) {
    try {
      const { countryCode } = req.query;
      res.status(200).json({ status: 'success', data: { states: geoService.getStates(countryCode) } });
    } catch (error) {
      next(error);
    }
  }

  async getGeoCities(req, res, next) {
    try {
      const { countryCode, stateCode } = req.query;
      res.status(200).json({ status: 'success', data: { cities: geoService.getCities(countryCode, stateCode) } });
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

  async getAnalytics(req, res, next) {
    try {
      const { timeRange } = req.query;
      const data = await adminService.getAnalyticsData({ timeRange });
      res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async exportAnalyticsXlsx(req, res, next) {
    try {
      const data = await adminService.getAnalyticsData();
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="UndrGradz_Analytics_Report.csv"');

      let csv = '\uFEFF';
      csv += 'METRICAS GENERALES PLATAFORMA UNDRGRADZ\n';
      csv += `Total Usuarios,${data.kpis.totalUsers}\n`;
      csv += `Estudiantes Verificados,${data.kpis.verifiedUsers}\n`;
      csv += `Creadores Verificados,${data.kpis.creatorUsers}\n`;
      csv += `Tasa de Verificación,${data.kpis.verificationRate}%\n`;
      csv += `Total Eventos,${data.kpis.totalEvents}\n`;
      csv += `Total Matches,${data.kpis.totalMatches}\n\n`;

      csv += 'DISTRIBUCION POR UNIVERSIDAD\n';
      csv += 'Acrónimo,Universidad,Estudiantes\n';
      data.uniBreakdown.forEach(u => {
        csv += `"${u.acronym}","${u.fullName}",${u.students}\n`;
      });

      csv += '\nDESGLOSE DE EVENTOS Y HANGOUTS POR CATEGORIA\n';
      csv += 'Categoría,Cantidad\n';
      data.eventCategories.forEach(e => {
        csv += `"${e.category}",${e.count}\n`;
      });

      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }

  async exportAnalyticsPdf(req, res, next) {
    try {
      const data = await adminService.getAnalyticsData();
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Reporte Ejecutivo - UndrGradz Analytics</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 30px; color: #1e293b; background: #fff; }
            .header { border-bottom: 3px solid #3d7bff; padding-bottom: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
            .title { font-size: 24px; font-weight: bold; color: #0f172a; }
            .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
            .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 28px; }
            .kpi-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; background: #f8fafc; text-align: center; }
            .kpi-num { font-size: 22px; font-weight: 800; color: #2563eb; }
            .kpi-label { font-size: 11px; text-transform: uppercase; color: #64748b; margin-top: 4px; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 13px; }
            th { background: #f1f5f9; font-weight: 700; color: #334155; }
            .footer { border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 11px; color: #94a3b8; text-align: center; margin-top: 40px; }
            @media print {
              body { margin: 0; }
            }
          </style>
          <script>
            window.onload = () => {
              setTimeout(() => { window.print(); }, 400);
            };
          </script>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">Reporte Ejecutivo de Analítica — UndrGradz</div>
              <div class="subtitle">Generado el ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
          </div>

          <div class="kpi-grid">
            <div class="kpi-card"><div class="kpi-num">${data.kpis.totalUsers}</div><div class="kpi-label">Total Usuarios</div></div>
            <div class="kpi-card"><div class="kpi-num">${data.kpis.verifiedUsers}</div><div class="kpi-label">Estudiantes Verificados 🎓</div></div>
            <div class="kpi-card"><div class="kpi-num">${data.kpis.creatorUsers}</div><div class="kpi-label">Creadores Verificados ✨</div></div>
            <div class="kpi-card"><div class="kpi-num">${data.kpis.totalEvents}</div><div class="kpi-label">Eventos Registrados</div></div>
          </div>

          <h3>Distribución por Universidad Top</h3>
          <table>
            <thead><tr><th>Acrónimo</th><th>Universidad</th><th>Estudiantes Activos</th></tr></thead>
            <tbody>
              ${data.uniBreakdown.map(u => `<tr><td><strong>${u.acronym}</strong></td><td>${u.fullName}</td><td>${u.students} estudiantes</td></tr>`).join('')}
            </tbody>
          </table>

          <h3>Categorías de Eventos</h3>
          <table>
            <thead><tr><th>Categoría</th><th>Eventos Publicados</th></tr></thead>
            <tbody>
              ${data.eventCategories.map(c => `<tr><td>${c.category}</td><td>${c.count} eventos</td></tr>`).join('')}
            </tbody>
          </table>

          <div class="footer">Confidencial — Documento de uso exclusivo para administración de UndrGradz Inc.</div>
        </body>
        </html>
      `;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(200).send(html);
    } catch (error) {
      next(error);
    }
  }

  async getVerifications(req, res, next) {
    try {
      const { type, status, search, page, limit } = req.query;
      const data = await adminService.getVerificationRequests({ type, status, search, page, limit });
      res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getVerificationDocument(req, res, next) {
    try {
      const { id } = req.params;
      const data = await adminService.getVerificationDocument(id);
      res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async approveVerification(req, res, next) {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body;
      const ipAddress = req.ip || req.headers['x-forwarded-for'];

      const result = await adminService.approveVerification(req.user.id, id, adminNotes, ipAddress);
      res.status(200).json({
        status: 'success',
        message: 'Verificación aprobada con éxito',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectVerification(req, res, next) {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;
      const ipAddress = req.ip || req.headers['x-forwarded-for'];

      const result = await adminService.rejectVerification(req.user.id, id, rejectionReason, ipAddress);
      res.status(200).json({
        status: 'success',
        message: 'Verificación rechazada',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserVerifications(req, res, next) {
    try {
      const { userId } = req.params;
      const { isVerified, isCreatorVerified, creatorCategory } = req.body;
      const ipAddress = req.ip || req.headers['x-forwarded-for'];

      const user = await adminService.updateUserVerifications(req.user.id, userId, { isVerified, isCreatorVerified, creatorCategory }, ipAddress);
      res.status(200).json({
        status: 'success',
        message: 'Insignias de verificación actualizadas',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
