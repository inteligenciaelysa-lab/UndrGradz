const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding 5 original events created by 5 UTNC students...");

  // Find UTNC users by handle (with or without @)
  const carla = await prisma.user.findFirst({ where: { OR: [{ handle: 'carlasala' }, { handle: '@carlasala' }] } });
  const santiago = await prisma.user.findFirst({ where: { OR: [{ handle: 'santi_mendoza' }, { handle: '@santi_mendoza' }] } });
  const renata = await prisma.user.findFirst({ where: { OR: [{ handle: 'renata_trv' }, { handle: '@renata_trv' }] } });
  const diego = await prisma.user.findFirst({ where: { OR: [{ handle: 'diegocast' }, { handle: '@diegocast' }] } });
  const mariana = await prisma.user.findFirst({ where: { OR: [{ handle: 'marianamrls' }, { handle: '@marianamrls' }] } });

  if (!carla || !santiago || !renata || !diego || !mariana) {
    console.error("Error: Could not find all 5 UTNC student profiles!", {
      carla: !!carla, santiago: !!santiago, renata: !!renata, diego: !!diego, mariana: !!mariana
    });
    process.exit(1);
  }

  const eventsData = [
    {
      creator: renata,
      name: "Welcome Summer Party & Rooftop 🪩",
      emoji: "🪩",
      section: "nightlife",
      address: "Skyline Lounge Rooftop · Piedras Negras",
      time: "Vie 24 Jul · 9:30 PM",
      hostHandle: "@renata_trv",
      capacity: 45,
      description: "Noche de bienvenida al verano con DJ en vivo, coctelería y excelente ambiente. Entrada libre para estudiantes con credencial UTNC.",
      filters: {
        restriction: "all",
        cover: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80",
        autoJoin: true,
        majors: ["Licenciatura en Gestión de Negocios y Proyectos"],
        years: ["2026"]
      },
      additionalAttendees: [carla.id, santiago.id, mariana.id]
    },
    {
      creator: santiago,
      name: "Torneo de Fútbol Rápido UTNC ⚽",
      emoji: "⚽",
      section: "sports",
      address: "Canchas Deportivas UTNC · Piedras Negras",
      time: "Sáb 25 Jul · 6:00 PM",
      hostHandle: "@santi_mendoza",
      capacity: 20,
      description: "Reta amistosa de fútbol rápido en las canchas de la UTNC. Equipos de 5v5 con cambios libres. ¡Traigan sus tachones y buena vibra!",
      filters: {
        restriction: "all",
        cover: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
        autoJoin: true,
        majors: ["Ingeniería Mecatrónica"],
        years: ["2025"]
      },
      additionalAttendees: [diego.id, carla.id]
    },
    {
      creator: carla,
      name: "Hackathon Prep & UI/UX Workshop 💻",
      emoji: "💻",
      section: "study",
      address: "Laboratorio de Cómputo 3 · UTNC Piedras Negras",
      time: "Vie 24 Jul · 5:00 PM",
      hostHandle: "@carlasala",
      capacity: 12,
      description: "Sesión de preparación para el Hackathon universitario. Revisaremos prototipado en Figma, integración de APIs y buenas prácticas de código. ¡Habrá café y pizza! 🍕",
      filters: {
        restriction: "all",
        cover: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80",
        autoJoin: true,
        majors: ["Ingeniería en Tecnologías de la Información"],
        years: ["2026"]
      },
      additionalAttendees: [santiago.id, renata.id]
    },
    {
      creator: diego,
      name: "Noche de Asado & Smash Bros 🥩🎮",
      emoji: "🥩",
      section: "dorm",
      address: "Residencias Estudiantiles Módulo B · Piedras Negras",
      time: "Sáb 25 Jul · 8:00 PM",
      hostHandle: "@diegocast",
      capacity: 15,
      description: "Carne asada estilo norteño y torneo de Super Smash Bros en la terraza. Traigan sus bebidas y control si tienen.",
      filters: {
        restriction: "all",
        cover: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80",
        autoJoin: true,
        majors: ["Ingeniería en Mantenimiento Industrial"],
        years: ["2025"]
      },
      additionalAttendees: [santiago.id, mariana.id]
    },
    {
      creator: mariana,
      name: "Feria de Intercambio & Logística Global ✈️",
      emoji: "✈️",
      section: "campus",
      address: "Auditorio Principal UTNC · Piedras Negras",
      time: "Lun 27 Jul · 11:00 AM",
      hostHandle: "@marianamrls",
      capacity: 30,
      description: "Encuentro informativo sobre programas de intercambio internacional y movilidad académica para estudiantes de la UTNC. Charlas con egresados.",
      filters: {
        restriction: "all",
        cover: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
        autoJoin: true,
        majors: ["Licenciatura en Logística Internacional"],
        years: ["2027"]
      },
      additionalAttendees: [carla.id, renata.id]
    }
  ];

  for (const item of eventsData) {
    const attendeeIds = Array.from(new Set([item.creator.id, ...item.additionalAttendees]));
    
    // Check if event already exists
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
      console.log(`Creating new event '${item.name}' created by ${item.creator.firstName}...`);
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

  console.log("Successfully created 5 original events for UTNC students!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
