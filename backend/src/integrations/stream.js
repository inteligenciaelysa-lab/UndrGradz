const { StreamChat } = require('stream-chat');

const isProductionStream = process.env.STREAM_APP_KEY && process.env.STREAM_APP_SECRET;

let streamClient;

if (isProductionStream) {
  streamClient = StreamChat.getInstance(process.env.STREAM_APP_KEY, process.env.STREAM_APP_SECRET);
}

/**
 * Generates a secure Stream User Token for client-side chat initialization.
 * @param {string} userId - The authenticated user ID
 * @returns {string} The Stream JWT user token (or mock string)
 */
const generateUserChatToken = (userId) => {
  if (!isProductionStream) {
    console.log(`[STREAM MOCK] Generating fake chat token for user ${userId}`);
    return `mock-stream-token-${userId}`;
  }

  return streamClient.createToken(userId);
};

/**
 * Creates or synchronizes a user profile inside Stream Chat.
 * @param {string} userId
 * @param {string} name
 * @param {string} imageUrl
 */
const upsertChatUser = async (userId, name, imageUrl) => {
  if (!isProductionStream) {
    console.log(`[STREAM MOCK] Syncing user ${userId} (${name}) inside Stream`);
    return { success: true };
  }

  try {
    await streamClient.upsertUser({
      id: userId,
      name: name,
      image: imageUrl,
    });
  } catch (error) {
    console.error(`[STREAM ERROR] Failed to upsert user ${userId}:`, error);
  }
};

/**
 * Creates a private chat channel between two users (Match or Friends).
 * @param {string} channelId - Unique sorted channel ID
 * @param {string[]} memberIds - Array of the two user IDs
 * @returns {Promise<{ channelId: string, isMock: boolean }>}
 */
const createChatChannel = async (channelId, memberIds) => {
  if (!isProductionStream) {
    console.log(`[STREAM MOCK] Creating fake channel ${channelId} with members: ${memberIds.join(', ')}`);
    return { channelId, isMock: true };
  }

  try {
    const channel = streamClient.channel('messaging', channelId, {
      members: memberIds,
      created_by_id: memberIds[0],
    });

    await channel.create();
    return { channelId, isMock: false };
  } catch (error) {
    console.error(`[STREAM ERROR] Failed to create channel ${channelId}:`, error);
    return { channelId, isMock: false, error: error.message };
  }
};

module.exports = {
  generateUserChatToken,
  upsertChatUser,
  createChatChannel,
};
