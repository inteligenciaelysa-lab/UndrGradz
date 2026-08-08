const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().nullable(),
  // 4-15 chars. Separators are `.` `_` `-`: never doubled, never first or last.
  // Must stay in step with the three copies in frontend/app.js (checkHandle,
  // _ob4Next1, _ob4ValidateAll) — a mismatch means the form accepts a handle
  // that /auth/register then rejects with a 400.
  handle: z.string().regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9]|(?:\.|_|-)(?![._-])){2,13}[a-zA-Z0-9]$/, 'Invalid username format').optional().nullable(),
  password: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{8,}$/, 'Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  birthDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format for birthDate',
  }).transform((val) => new Date(val)),
  referralCode: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

// Identifier only, same as login's "email" field — can be a full email or an
// @handle, since the appeal screen is auto-filled with whatever the user
// originally typed into the login form.
const appealStatusSchema = z.object({
  email: z.string().min(1, 'Email or username is required'),
});

const appealSchema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  message: z.string().trim().min(20, 'Your appeal message must be at least 20 characters long').max(1000, 'Your appeal message cannot exceed 1000 characters'),
});

module.exports = {
  registerSchema,
  loginSchema,
  appealSchema,
  appealStatusSchema,
};
