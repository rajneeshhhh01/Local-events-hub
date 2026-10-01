// Save an action in the activity log
const db = require('../config/db');

async function addLog(userId, action, itemType, itemId, details) {
  try {
    await db.execute(
      'INSERT INTO activity_log (user_id, action, item_type, item_id, details) VALUES (?, ?, ?, ?, ?)',
      [userId, action, itemType, itemId, details]
    );
  } catch (err) {
    // A log error should not stop the app
    console.log('Could not save log:', err.message);
  }
}

module.exports = addLog;
