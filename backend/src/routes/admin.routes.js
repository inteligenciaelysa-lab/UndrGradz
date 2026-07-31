const express = require('express');
const rateLimit = require('express-rate-limit');
const adminController = require('../controllers/admin.controller');
const { protectAdmin, requireRole } = require('../middlewares/adminAuth.middleware');

const router = express.Router();

// Dedicated Brute-force rate limiter for Admin Login (5 attempts per 15 minutes)
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    status: 'error',
    message: 'Too many admin login attempts from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// -------------------------------------------------------------
// PUBLIC ADMIN AUTH ROUTE
// -------------------------------------------------------------
router.post('/auth/login', adminLoginLimiter, adminController.login);

// -------------------------------------------------------------
// PROTECTED ADMIN ROUTES (Requires valid admin JWT & active account)
// -------------------------------------------------------------
router.use(protectAdmin);

// Dashboard Metrics & System Health (SUPPORT, MODERATOR, ADMIN, SUPER_ADMIN)
router.get('/dashboard', requireRole('SUPPORT', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'), adminController.getDashboard);

// Global Search (SUPPORT, MODERATOR, ADMIN, SUPER_ADMIN)
router.get('/search', requireRole('SUPPORT', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'), adminController.globalSearch);

// User Management
router.get('/users', requireRole('SUPPORT', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'), adminController.getUsers);
router.get('/users/:id', requireRole('SUPPORT', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'), adminController.getUserDetails);

// Actions against users (MODERATOR, ADMIN, SUPER_ADMIN)
router.patch('/users/:id/status', requireRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN'), adminController.updateUserStatus);
router.delete('/users/:id', requireRole('ADMIN', 'SUPER_ADMIN'), adminController.softDeleteUser);
router.patch('/users/:id/role', requireRole('SUPER_ADMIN'), adminController.updateUserRole);

// Moderation System
router.get('/moderation/reports', requireRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN'), adminController.getReports);
router.post('/moderation/reports', requireRole('SUPPORT', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'), adminController.createReport);
router.patch('/moderation/reports/:id', requireRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN'), adminController.resolveReport);

// University Management
router.get('/universities', requireRole('SUPPORT', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'), adminController.getUniversities);
router.get('/universities/:id', requireRole('SUPPORT', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'), adminController.getUniversityById);
router.post('/universities', requireRole('ADMIN', 'SUPER_ADMIN'), adminController.createUniversity);
router.patch('/universities/:id', requireRole('ADMIN', 'SUPER_ADMIN'), adminController.updateUniversity);
router.delete('/universities/:id', requireRole('ADMIN', 'SUPER_ADMIN'), adminController.softDeleteUniversity);
router.post('/universities/:id/restore', requireRole('ADMIN', 'SUPER_ADMIN'), adminController.restoreUniversity);

// Events / Hangouts Management
router.get('/events', requireRole('SUPPORT', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'), adminController.getEvents);
router.patch('/events/:id/status', requireRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN'), adminController.updateEventStatus);
router.delete('/events/:id', requireRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN'), adminController.softDeleteEvent);

// Content Moderation (User Photos)
router.delete('/content/photo/:id', requireRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN'), adminController.deleteUserPhoto);

// Administrative Sessions Management
router.get('/sessions', requireRole('SUPPORT', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'), adminController.getAdminSessions);
router.post('/sessions/:id/revoke', requireRole('SUPPORT', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'), adminController.revokeSession);

// Administrator Management (Super Admin only)
router.get('/administrators', requireRole('SUPER_ADMIN'), adminController.getAdministrators);
router.post('/administrators', requireRole('SUPER_ADMIN'), adminController.createAdministrator);

// Audit Logs (ADMIN, SUPER_ADMIN)
router.get('/audit-logs', requireRole('ADMIN', 'SUPER_ADMIN'), adminController.getAuditLogs);

// Administrative Notifications (ADMIN, SUPER_ADMIN)
router.post('/notifications', requireRole('ADMIN', 'SUPER_ADMIN'), adminController.sendNotification);

// Analytics & Charts System
router.get('/analytics', requireRole('SUPPORT', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'), adminController.getAnalytics);
router.get('/analytics/export/xlsx', requireRole('SUPPORT', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'), adminController.exportAnalyticsXlsx);
router.get('/analytics/export/pdf', requireRole('SUPPORT', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'), adminController.exportAnalyticsPdf);

// Verifications & Creator Badges Portal
router.get('/verifications', requireRole('SUPPORT', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'), adminController.getVerifications);
// Documents are served one at a time, admin-authenticated only — never as a public URL.
router.get('/verifications/:id/document', requireRole('SUPPORT', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'), adminController.getVerificationDocument);
router.post('/verifications/:id/approve', requireRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN'), adminController.approveVerification);
router.post('/verifications/:id/reject', requireRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN'), adminController.rejectVerification);
router.patch('/users/:userId/verifications', requireRole('ADMIN', 'SUPER_ADMIN'), adminController.updateUserVerifications);

// Platform Settings (ADMIN, SUPER_ADMIN)
router.get('/settings', requireRole('ADMIN', 'SUPER_ADMIN'), adminController.getSettings);
router.patch('/settings', requireRole('SUPER_ADMIN'), adminController.updateSetting);

module.exports = router;
