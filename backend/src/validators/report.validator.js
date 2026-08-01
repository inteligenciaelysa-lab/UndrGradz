const { z } = require('zod');

const createReportSchema = z.object({
  targetUserId: z.string().min(1, 'targetUserId is required'),
  matchId: z.string().optional().nullable(),
  reason: z.enum(['SPAM', 'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'IMPERSONATION', 'THREATS'], {
    errorMap: () => ({ message: 'Invalid report reason' }),
  }),
  details: z.string().trim().min(20, 'Please explain what happened in at least 20 characters').max(1000, 'Your explanation cannot exceed 1000 characters'),
});

module.exports = { createReportSchema };
