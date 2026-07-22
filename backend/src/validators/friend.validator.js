const { z } = require('zod');

const friendRequestSchema = z.object({
  receiverId: z.string().min(1, 'Receiver ID is required'),
});

const respondRequestSchema = z.object({
  senderId: z.string().min(1, 'Sender ID is required'),
  accept: z.boolean('accept must be a boolean value'),
});

module.exports = {
  friendRequestSchema,
  respondRequestSchema,
};
