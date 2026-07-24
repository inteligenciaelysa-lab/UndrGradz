const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf-8');
const lines = appJs.split('\n');

console.log("=== SEARCH FOR INITIAL ARRAYS (HANGOUT_EVENTS, crushData, etc.) ===");

lines.forEach((line, index) => {
  if (
    line.includes('HANGOUT_EVENTS') ||
    line.includes('crushData =') ||
    line.includes('var crushData') ||
    line.includes('_likedYou') ||
    line.includes('seedEvents') ||
    line.includes('seedChats') ||
    line.includes('DEFAULT_CONVERSATIONS')
  ) {
    console.log(`Line ${index + 1}: ${line.trim().slice(0, 140)}`);
  }
});
