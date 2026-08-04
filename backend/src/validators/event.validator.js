const { z } = require('zod');
const { validateImageDataUri } = require('../utils/dataUriImage');

const createEventSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(100, 'Event name must be less than 100 characters'),
  emoji: z.string().min(1, 'Emoji is required'),
  section: z.enum(['nightlife', 'study', 'sports', 'dorm', 'greek', 'abroad', 'exclusive', 'networking', 'campus'], {
    errorMap: () => ({ message: "Section must be one of: 'nightlife', 'study', 'sports', 'dorm', 'greek', 'abroad', 'exclusive', 'networking', 'campus'" })
  }),
  address: z.string().min(1, 'Address is required'),
  time: z.string().min(1, 'Time is required'),
  hostHandle: z.string().optional(),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  description: z.string().optional().nullable(),
  filters: z.record(z.any()).optional().nullable(),
}).superRefine((data, ctx) => {
  const cover = data.filters && data.filters.cover;
  if (typeof cover === 'string' && cover.length > 0) {
    const result = validateImageDataUri(cover);
    if (!result.valid) {
      ctx.addIssue({ code: 'custom', path: ['filters', 'cover'], message: result.reason });
    }
  }
});

module.exports = {
  createEventSchema,
};
