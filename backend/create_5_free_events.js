const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding 5 FREE tier events created by @joelinjr, @mariago, @anagar, @sofi, @reginamtz...");

  const joel = await prisma.user.findFirst({ where: { OR: [{ handle: 'joelinjr' }, { handle: '@joelinjr' }] } });
  const maria = await prisma.user.findFirst({ where: { OR: [{ handle: 'mariago' }, { handle: '@mariago' }] } });
  const ana = await prisma.user.findFirst({ where: { OR: [{ handle: 'anagar' }, { handle: '@anagar' }] } });
  const sofia = await prisma.user.findFirst({ where: { OR: [{ handle: 'sofi' }, { handle: '@sofi' }] } });
  const regina = await prisma.user.findFirst({ where: { OR: [{ handle: 'reginamtz' }, { handle: '@reginamtz' }] } });

  if (!joel || !maria || !ana || !sofia || !regina) {
    console.error("Error: Could not find all 5 user profiles!", {
      joel: !!joel, maria: !!maria, ana: !!ana, sofia: !!sofia, regina: !!regina
    });
    process.exit(1);
  }

  const eventsData = [
    {
      creator: joel,
      name: "Diseño & Branding Workshop 🎨",
      emoji: "🎨",
      section: "study",
      address: "Biblioteca UTNC · Sala de Juntas A",
      time: "Jue 23 Jul · 4:30 PM",
      hostHandle: "@joelinjr",
      capacity: 8, // Strictly respects FREE plan limit <= 10
      description: "Taller de diseño gráfico y marca personal. Practicaremos tipografía, paletas de color y creación de portafolios en Illustrator. ¡Traigan su laptop!",
      filters: {
        restriction: "all",
        cover: "https://images.unsplash.com/photo-1542744094-3a31b272c490?auto=format&fit=crop&w=1200&q=80",
        autoJoin: true
      },
      additionalAttendees: [maria.id, ana.id]
    },
    {
      creator: maria,
      name: "Acoustic Session & Jam 🎸",
      emoji: "🎸",
      section: "nightlife",
      address: "Café & Trova · Centro Piedras Negras",
      time: "Vie 24 Jul · 8:30 PM",
      hostHandle: "@mariago",
      capacity: 10, // Strictly respects FREE plan limit <= 10
      description: "Noche acústica relajada. Trae tu guitarra, ukelele o voz para compartir canciones y pasar un buen rato entre música y café.",
      filters: {
        restriction: "all",
        cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
        autoJoin: true
      },
      additionalAttendees: [joel.id, sofia.id]
    },
    {
      creator: ana,
      name: "Huerto Urbano & Eco Picnic 🌱",
      emoji: "🌱",
      section: "campus",
      address: "Jardines Botánicos UTNC",
      time: "Mié 22 Jul · 1:00 PM",
      hostHandle: "@anagar",
      capacity: 10, // Strictly respects FREE plan limit <= 10
      description: "Iniciativa verde para plantar suculentas y plantas aromáticas en el campus, seguido de un picnic ecológico. ¡Traigan sus snacks recargables!",
      filters: {
        restriction: "all",
        cover: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=1200&q=80",
        autoJoin: true
      },
      additionalAttendees: [regina.id, maria.id]
    },
    {
      creator: sofia,
      name: "Cozy Movie & Popcorn Night 🍿",
      emoji: "🍿",
      section: "dorm",
      address: "Salón Social Residencias A · UTNC",
      time: "Jue 23 Jul · 7:30 PM",
      hostHandle: "@sofi",
      capacity: 9, // Strictly respects FREE plan limit <= 10
      description: "Noche de películas icónicas, mantas y palomitas recién hechas. Ideal para relajarse a mitad de semana con amigos.",
      filters: {
        restriction: "all",
        cover: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
        autoJoin: true
      },
      additionalAttendees: [ana.id, regina.id]
    },
    {
      creator: regina,
      name: "Yoga en el Pasto & Stretches 🧘‍♀️",
      emoji: "🧘‍♀️",
      section: "sports",
      address: "Área Verde Central UTNC",
      time: "Jue 23 Jul · 8:00 AM",
      hostHandle: "@reginamtz",
      capacity: 10, // Strictly respects FREE plan limit <= 10
      description: "Clase matutina de yoga multinivel y meditación al aire libre para cargarse de energía limpia antes de las clases.",
      filters: {
        restriction: "all",
        cover: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1200&q=80",
        autoJoin: true
      },
      additionalAttendees: [sofia.id, joel.id]
    }
  ];

  for (const item of eventsData) {
    const attendeeIds = Array.from(new Set([item.creator.id, ...item.additionalAttendees]));
    
    const existing = await prisma.event.findFirst({
      where: {
        name: item.name,
        creatorId: item.creator.id
      }
    });

    if (existing) {
      console.log(`Event '${item.name}' already exists. Updating...`);
      await prisma.event.update({
        where: { id: existing.id },
        data: {
          emoji: item.emoji,
          section: item.section,
          address: item.address,
          time: item.time,
          hostHandle: item.hostHandle,
          capacity: item.capacity,
          description: item.description,
          filters: item.filters,
          attendees: {
            set: attendeeIds.map(id => ({ id }))
          }
        }
      });
    } else {
      console.log(`Creating new event '${item.name}' created by ${item.creator.firstName} (${item.hostHandle})...`);
      await prisma.event.create({
        data: {
          name: item.name,
          emoji: item.emoji,
          section: item.section,
          address: item.address,
          time: item.time,
          hostHandle: item.hostHandle,
          capacity: item.capacity,
          description: item.description,
          filters: item.filters,
          creatorId: item.creator.id,
          attendees: {
            connect: attendeeIds.map(id => ({ id }))
          }
        }
      });
    }
  }

  console.log("Successfully created 5 FREE tier events for @joelinjr, @mariago, @anagar, @sofi, @reginamtz!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
