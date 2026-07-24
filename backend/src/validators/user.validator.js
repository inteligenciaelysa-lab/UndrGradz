const { z } = require('zod');

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  handle: z.string().min(2).max(30).optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional().nullable(),
  gender: z.enum(['MAN', 'WOMAN', 'NON_BINARY']).optional(),
  interestedIn: z.enum(['MAN', 'WOMAN', 'EVERYONE']).optional(),
  minAge: z.number().int().min(18).max(100).optional(),
  maxAge: z.number().int().min(18).max(100).optional(),
  maxDistanceKm: z.number().int().min(1).max(500).optional(),
  fcmToken: z.string().optional().nullable(),
  
  // Queryable fields
  university: z.string().optional().nullable(),
  major: z.string().optional().nullable(),
  grad: z.string().optional().nullable(),
  crossover: z.boolean().optional(),

  // Rich metadata JSON fields
  interests: z.array(z.string()).optional().nullable(),
  prompts: z.array(z.object({
    q: z.string(),
    a: z.string(),
  })).optional().nullable(),
  bucketList: z.array(z.string()).optional().nullable(),
  identityTags: z.array(z.string()).optional().nullable(),
  lookingForTags: z.array(z.string()).optional().nullable(),
  lifestyle: z.record(z.any()).optional().nullable(),
  academic: z.record(z.any()).optional().nullable(),
  background: z.record(z.any()).optional().nullable(),
  customization: z.record(z.any()).optional().nullable(),
  socials: z.record(z.any()).optional().nullable(),
});

const updateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  longitude: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
});

const addPhotoSchema = z.object({
  contentType: z.string().regex(/^image\/(jpeg|png|webp|jpg)$/, 'Only JPEG, PNG, or WEBP images are allowed').default('image/jpeg'),
});

const updateGhostModeSchema = z.object({
  isGhostMode: z.boolean('isGhostMode must be a boolean value'),
});

module.exports = {
  updateProfileSchema,
  updateLocationSchema,
  addPhotoSchema,
  updateGhostModeSchema,
};
