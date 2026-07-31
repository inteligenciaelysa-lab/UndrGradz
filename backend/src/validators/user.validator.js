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

/* ---------------------------------------------------------------------------
   Verification requests
   --------------------------------------------------------------------------- */

const VERIFICATION_TYPES = ['STUDENT_ID', 'CREATOR_BADGE', 'ATHLETE', 'STUDENT_GOVT'];
const ALLOWED_DOC_MIMES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

// Documents travel as base64 `data:` URIs inside the JSON body (same as the
// existing Blue Badge flow). Express is configured with a 25 MB JSON limit and
// base64 inflates by ~33%, so cap the decoded payload at 8 MB per document.
const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;

const DATA_URI_RE = /^data:([a-zA-Z0-9.+/-]+);base64,([A-Za-z0-9+/=\s]+)$/;

/**
 * Validates a document reference. Accepts either a base64 `data:` URI (what the
 * app sends) or a plain http(s) URL (kept so previously stored records and any
 * future storage backend keep working).
 */
function checkDocument(value, ctx) {
  if (/^https?:\/\//i.test(value)) return;

  const match = DATA_URI_RE.exec(value);
  if (!match) {
    ctx.addIssue({
      code: 'custom',
      message: 'El documento debe ser un data: URI en base64 o una URL http(s)',
    });
    return;
  }

  const [, mime, base64] = match;
  if (!ALLOWED_DOC_MIMES.includes(mime.toLowerCase())) {
    ctx.addIssue({
      code: 'custom',
      message: 'Formato no permitido. Solo se aceptan PDF, JPG, JPEG o PNG',
    });
    return;
  }

  // 4 base64 chars encode 3 bytes; discount the trailing padding.
  const clean = base64.replace(/\s/g, '');
  const padding = (clean.match(/=+$/) || [''])[0].length;
  const bytes = Math.floor((clean.length * 3) / 4) - padding;
  if (bytes > MAX_DOCUMENT_BYTES) {
    ctx.addIssue({
      code: 'custom',
      message: 'El documento supera el tamaño máximo de 8 MB',
    });
  }
}

const submitVerificationSchema = z
  .object({
    // Defaults to STUDENT_ID so the existing Blue Badge payload keeps working.
    type: z.enum(VERIFICATION_TYPES).default('STUDENT_ID'),

    // The controller accepts `documentUrl` as an alias of `credentialUrl`;
    // both are optional here and the refinement below requires exactly one.
    credentialUrl: z.string().min(1).superRefine(checkDocument).optional(),
    documentUrl: z.string().min(1).superRefine(checkDocument).optional(),

    notes: z.string().max(1000).optional().nullable(),

    // ATHLETE only: one request per sport.
    sport: z.string().min(1).max(60).optional().nullable(),

    // CREATOR_BADGE: { instagram, tiktok, youtube, ... }
    socialLinks: z.record(z.any()).optional().nullable(),
    creatorCategory: z.string().max(80).optional().nullable(),

    // Extensible per-type payload, e.g. STUDENT_GOVT -> { roles: [...] }
    metadata: z.record(z.any()).optional().nullable(),

    documentName: z.string().max(255).optional().nullable(),
    documentMime: z.enum(ALLOWED_DOC_MIMES).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (!data.credentialUrl && !data.documentUrl) {
      ctx.addIssue({
        code: 'custom',
        path: ['credentialUrl'],
        message: 'Se requiere la foto o archivo de la credencial',
      });
    }
    if (data.type === 'ATHLETE' && !data.sport) {
      ctx.addIssue({
        code: 'custom',
        path: ['sport'],
        message: 'Las verificaciones de atleta requieren especificar el deporte',
      });
    }
  });

module.exports = {
  updateProfileSchema,
  updateLocationSchema,
  addPhotoSchema,
  updateGhostModeSchema,
  submitVerificationSchema,
  VERIFICATION_TYPES,
  ALLOWED_DOC_MIMES,
  MAX_DOCUMENT_BYTES,
};
