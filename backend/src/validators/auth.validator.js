const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().nullable(),
  handle: z.string().regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9]|(?:\.|_)(?![._])){2,13}[a-zA-Z0-9]$/, 'Invalid username format').optional().nullable(),
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

module.exports = {
  registerSchema,
  loginSchema,
};
