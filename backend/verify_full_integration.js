const authService = require('./src/services/auth.service');
const userService = require('./src/services/user.service');
const swipeService = require('./src/services/swipe.service');
const eventService = require('./src/services/event.service');
const chatService = require('./src/services/chat.service');
const prisma = require('./src/database/prisma');

async function testIntegration() {
  console.log("--- Starting Database Integration Verification ---");

  const testEmail = `test_integration_${Date.now()}@smu.edu`;
  const testHandle = `testuser_${Date.now()}`;

  // 1. Sign Up / Register
  console.log("1. Registering new user...");
  const registeredUser = await authService.register({
    email: testEmail,
    password: "Password123!",
    firstName: "TestFirst",
    lastName: "TestLast",
    birthDate: "2002-05-15",
    handle: testHandle,
  });
  console.log("   User registered with ID:", registeredUser.id);

  // 2. Complete Profile Onboarding & Edit
  console.log("2. Updating user profile...");
  const updatedProfile = await userService.updateProfile(registeredUser.id, {
    firstName: "UpdatedFirst",
    lastName: "UpdatedLast",
    handle: `updated_${testHandle}`,
    bio: "This is a real database test bio",
    gender: "WOMAN",
    interestedIn: "EVERYONE",
    university: "Southern Methodist University",
    major: "Computer Science",
    grad: "May '26",
    interests: ["Coding", "Coffee", "Music"],
    lifestyle: { drinking: "never", workout: "often" },
    academic: { minor: "Mathematics" },
    socials: { ig: "test_ig" },
  });
  console.log("   Profile updated in DB successfully!");

  // 3. Verify getProfile (getMe)
  console.log("3. Fetching getMe profile from DB...");
  const fullProfile = await userService.getProfile(registeredUser.id);
  console.log("   Name in DB:", fullProfile.firstName, fullProfile.lastName);
  console.log("   Handle in DB:", fullProfile.handle);
  console.log("   University in DB:", fullProfile.profile.university);
  console.log("   Major in DB:", fullProfile.profile.major);
  console.log("   Interests in DB:", fullProfile.profile.interests);

  // 4. Verify Crush Feed
  console.log("4. Querying Crush Feed for user...");
  const crushFeed = await swipeService.getCrushFeed(registeredUser.id);
  console.log(`   Crush feed returned ${crushFeed.length} candidate cards from DB.`);

  // 5. Verify Event Creation & Fetching
  console.log("5. Testing Event creation & host picture retrieval...");
  const newEvent = await eventService.createEvent(registeredUser.id, {
    name: "DB Integration Launch Party",
    emoji: "🎉",
    section: "nightlife",
    address: "SMU Student Center",
    time: "Tonight @ 9 PM",
    hostHandle: `@updated_${testHandle}`,
    capacity: 25,
    description: "Celebrating full DB integration!",
  });
  console.log("   Event created with ID:", newEvent.id);

  const allEvents = await eventService.getAllEvents(registeredUser.id);
  const foundEvent = allEvents.find(e => e.id === newEvent.id);
  console.log("   Host Handle from DB Event:", foundEvent.creator.handle);
  console.log("   Host Name from DB Event:", foundEvent.creator.firstName, foundEvent.creator.lastName);

  // Clean up test data
  console.log("6. Cleaning up test event and user...");
  await prisma.event.delete({ where: { id: newEvent.id } });
  await prisma.user.delete({ where: { id: registeredUser.id } });
  console.log("--- Integration Test Completed Successfully! ---");
}

testIntegration()
  .catch(err => {
    console.error("❌ Integration test failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
