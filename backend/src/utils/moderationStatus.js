const AppError = require('../errors/appError');

const formatDate = (date) => {
  return new Date(date).toLocaleString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatBanMessage = (user) => {
  const reason = user.banReason || 'Incumplimiento de las normas de la comunidad.';
  return `Tu cuenta ha sido baneada permanentemente.\n\nMotivo:\n${reason}`;
};

const formatSuspensionMessage = (user) => {
  const reason = user.suspensionReason || 'Incumplimiento de las normas de la comunidad.';
  const untilText = user.suspendedUntil
    ? `\n\nLa suspensión termina el:\n${formatDate(user.suspendedUntil)}.`
    : '';
  return `Tu cuenta ha sido suspendida.\n\nMotivo:\n${reason}${untilText}`;
};

/**
 * Throws for BANNED or still-suspended users. For a SUSPENDED user whose
 * suspendedUntil has already passed, reactivates the account in place and
 * returns normally, so callers can treat the request as coming from an
 * ACTIVE user. Shared by login() and the protect() middleware so both stay
 * in sync on wording and reactivation behavior.
 */
const enforceModerationStatus = async (prisma, user) => {
  if (user.status === 'BANNED') {
    // Carries the resolved institutional email so a rejected login can offer
    // an appeal screen auto-filled correctly even if the user typed their
    // @handle to log in — no token exists yet to look this up any other way.
    throw new AppError(formatBanMessage(user), 403, { email: user.email });
  }

  if (user.status === 'SUSPENDED') {
    if (user.suspendedUntil && new Date() > new Date(user.suspendedUntil)) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          status: 'ACTIVE',
          suspensionReason: null,
          suspendedUntil: null,
          suspendedAt: null,
          suspendedById: null,
        },
      });
      return;
    }
    throw new AppError(formatSuspensionMessage(user), 403, { email: user.email });
  }
};

module.exports = {
  enforceModerationStatus,
  formatBanMessage,
  formatSuspensionMessage,
};
