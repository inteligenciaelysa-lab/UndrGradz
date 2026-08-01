const prisma = require('../database/prisma');

/**
 * Resolves a user the same way login() always has: by full email, or by
 * @handle/handle if the identifier isn't an email. Shared so every place that
 * needs to identify an account from user-typed input (login, appeals) stays
 * in sync — an appeal screen auto-filled with whatever the user typed at
 * login (which may be a handle, not an email) must resolve the same way.
 */
const findUserByIdentifier = async (identifier) => {
  const trimmed = (identifier || '').trim();

  if (trimmed.includes('@') && !trimmed.startsWith('@')) {
    return prisma.user.findUnique({ where: { email: trimmed.toLowerCase() } });
  }

  const cleanHandle = trimmed.replace(/^@/, '');
  return prisma.user.findFirst({
    where: {
      OR: [{ handle: cleanHandle }, { handle: `@${cleanHandle}` }],
    },
  });
};

module.exports = { findUserByIdentifier };
