const { z } = require('zod');

const swipeSchema = z.object({
  receiverId: z.string().min(1, 'Receiver ID is required'),
  type: z.enum(['PASS', 'LIKE', 'SUPERLIKE', 'ROSE']),
});

module.exports = {
  swipeSchema,
};
