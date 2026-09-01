const { Notification } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/notifications
const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.findAll({
    where: { user_id: req.user.id },
    order: [['created_at', 'DESC']],
    limit: 100
  });
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  res.json({ success: true, notifications, unreadCount });
});

// PATCH /api/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findByPk(req.params.id);
  if (!notification || notification.user_id !== req.user.id) {
    throw new ApiError(404, 'Notification not found');
  }
  notification.is_read = true;
  await notification.save();
  res.json({ success: true, notification });
});

// PATCH /api/notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.update({ is_read: true }, { where: { user_id: req.user.id, is_read: false } });
  res.json({ success: true, message: 'All notifications marked as read' });
});

module.exports = { listNotifications, markAsRead, markAllAsRead };
