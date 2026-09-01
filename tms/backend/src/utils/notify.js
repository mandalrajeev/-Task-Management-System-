const { Notification } = require('../models');

/**
 * Creates a notification record for a user. This is intentionally simple
 * (DB-persisted, polled by the frontend) so it works without any extra
 * infrastructure (no websockets / email provider required). Swap the body
 * of this function for a push to a websocket room or an email queue if
 * real-time delivery is needed later.
 */
async function notify({ userId, taskId = null, type, message }) {
  if (!userId) return null;
  return Notification.create({ user_id: userId, task_id: taskId, type, message });
}

module.exports = notify;
