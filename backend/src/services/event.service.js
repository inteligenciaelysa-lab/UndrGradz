const prisma = require('../database/prisma');
const AppError = require('../errors/appError');

class EventService {
  async createEvent(creatorId, data) {
    const { name, emoji, section, address, time, hostHandle, capacity, description, filters } = data;

    // Create event and automatically add the creator as the first attendee
    const event = await prisma.event.create({
      data: {
        name,
        emoji,
        section,
        address,
        time,
        hostHandle,
        capacity,
        description,
        filters: filters || {},
        creatorId,
        attendees: {
          connect: { id: creatorId }
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            handle: true,
            profile: {
              select: {
                university: true
              }
            },
            photos: { orderBy: { order: 'asc' }, take: 1 }
          }
        },
        attendees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: {
              select: {
                gender: true
              }
            },
            photos: { orderBy: { order: 'asc' }, take: 1 }
          }
        }
      }
    });

    return event;
  }

  async getAllEvents(userId) {
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    const isFree = !userProfile || userProfile.subscriptionTier === 'FREE';
    const userUni = userProfile?.university;

    const events = await prisma.event.findMany({
      where: isFree && userUni ? {
        creator: {
          profile: {
            university: userUni
          }
        }
      } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            handle: true,
            profile: {
              select: {
                university: true
              }
            },
            photos: { orderBy: { order: 'asc' }, take: 1 }
          }
        },
        attendees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: {
              select: {
                gender: true
              }
            },
            photos: { orderBy: { order: 'asc' }, take: 1 }
          }
        }
      }
    });

    // Compute remaining spots dynamically
    return events.map(e => ({
      ...e,
      spotsLeft: Math.max(0, e.capacity - e.attendees.length)
    }));
  }

  async joinEvent(userId, eventId) {
    // 1. Fetch event with current attendees
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        attendees: { select: { id: true } }
      }
    });

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    // 2. Check if already joined
    const alreadyJoined = event.attendees.some(att => att.id === userId);
    if (alreadyJoined) {
      throw new AppError('You have already joined this event', 400);
    }

    // 3. Check capacity limits
    if (event.attendees.length >= event.capacity) {
      throw new AppError('This event is full', 400);
    }

    // 4. Validate Event Filters (Major / Graduation Year)
    if (event.filters && typeof event.filters === 'object') {
      const userProfile = await prisma.userProfile.findUnique({
        where: { userId }
      });

      // Validate Majors Filter
      if (Array.isArray(event.filters.majors) && event.filters.majors.length > 0) {
        if (!userProfile || !userProfile.major || !event.filters.majors.includes(userProfile.major)) {
          throw new AppError('This event is restricted to other majors', 403);
        }
      }

      // Validate Graduation Year Filter
      if (Array.isArray(event.filters.years) && event.filters.years.length > 0) {
        if (!userProfile || !userProfile.grad || !event.filters.years.includes(userProfile.grad)) {
          throw new AppError('This event is restricted to other class years', 403);
        }
      }
    }

    // 5. Connect user to event attendees list
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        attendees: {
          connect: { id: userId }
        }
      },
      include: {
        attendees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: {
              select: {
                gender: true
              }
            },
            photos: { orderBy: { order: 'asc' }, take: 1 }
          }
        }
      }
    });

    return {
      message: 'Joined event successfully',
      spotsLeft: Math.max(0, updatedEvent.capacity - updatedEvent.attendees.length),
      attendees: updatedEvent.attendees
    };
  }

  async leaveEvent(userId, eventId) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        attendees: { select: { id: true } }
      }
    });

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    const hasJoined = event.attendees.some(att => att.id === userId);
    if (!hasJoined) {
      throw new AppError('You are not registered for this event', 400);
    }

    // Cannot leave if you are the creator of the event (you must delete it or let others lead)
    if (event.creatorId === userId) {
      throw new AppError('You cannot leave an event you hosted. You can delete it instead.', 400);
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        attendees: {
          disconnect: { id: userId }
        }
      },
      include: {
        attendees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: {
              select: {
                gender: true
              }
            },
            photos: { orderBy: { order: 'asc' }, take: 1 }
          }
        }
      }
    });

    return {
      message: 'Left event successfully',
      spotsLeft: Math.max(0, updatedEvent.capacity - updatedEvent.attendees.length),
      attendees: updatedEvent.attendees
    };
  }

  async deleteEvent(userId, eventId) {
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (event.creatorId !== userId) {
      throw new AppError('Only the creator can delete this event', 403);
    }

    await prisma.event.delete({
      where: { id: eventId }
    });

    return { message: 'Event deleted successfully' };
  }

  async updateEvent(userId, eventId, data) {
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (event.creatorId !== userId) {
      throw new AppError('Only the creator can update this event', 403);
    }

    const { name, emoji, section, address, time, capacity, description, filters } = data;

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...(name && { name }),
        ...(emoji && { emoji }),
        ...(section && { section }),
        ...(address && { address }),
        ...(time && { time }),
        ...(capacity && { capacity: Number(capacity) }),
        ...(description !== undefined && { description }),
        ...(filters && { filters })
      }
    });

    return updated;
  }
}

module.exports = new EventService();
