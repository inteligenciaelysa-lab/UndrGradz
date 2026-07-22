const admin = require('firebase-admin');

const isProductionFirebase = 
  process.env.FIREBASE_PROJECT_ID && 
  process.env.FIREBASE_CLIENT_EMAIL && 
  process.env.FIREBASE_PRIVATE_KEY;

if (isProductionFirebase) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
  }
} else {
  console.log('ℹ️ Firebase running in MOCK mode (No credentials in .env)');
}

/**
 * Sends a push notification to a specific device token.
 * @param {string} token - The destination FCM device token
 * @param {object} payload - Notification payload { title, body, data }
 * @returns {Promise<boolean>}
 */
const sendPushNotification = async (token, { title, body, data = {} }) => {
  if (!token) return false;

  if (!isProductionFirebase) {
    console.log(`[FIREBASE MOCK PUSH] to Token: ${token}`);
    console.log(`  Title: ${title}`);
    console.log(`  Body: ${body}`);
    console.log(`  Data:`, data);
    return true;
  }

  try {
    const message = {
      token,
      notification: {
        title,
        body,
      },
      data,
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Push notification sent successfully:', response);
    return true;
  } catch (error) {
    console.error('❌ Failed to send push notification:', error.message);
    return false;
  }
};

/**
 * Helper to fetch a user's FCM token and send a push.
 * @param {string} userId - Target user ID
 * @param {object} payload - Notification payload { title, body, data }
 */
const sendPushToUser = async (userId, payload) => {
  const prisma = require('../database/prisma');
  try {
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { fcmToken: true },
    });

    if (userProfile?.fcmToken) {
      await sendPushNotification(userProfile.fcmToken, payload);
    }
  } catch (error) {
    console.error(`❌ Failed to send push to user ${userId}:`, error.message);
  }
};

module.exports = {
  sendPushNotification,
  sendPushToUser,
};
