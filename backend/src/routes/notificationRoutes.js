const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getNotificationPreferences,
  updateNotificationPreferences,
  getSystemAnnouncements,
  createSystemAnnouncement
} = require('../controllers/notificationController');

router.get('/', auth, getNotifications);
router.put('/:id/read', auth, markAsRead);
router.put('/read-all', auth, markAllAsRead);
router.get('/preferences', auth, getNotificationPreferences);
router.put('/preferences', auth, updateNotificationPreferences);
router.get('/system', auth, getSystemAnnouncements);
router.post('/system', auth, authorize('coordinator', 'registrar'), createSystemAnnouncement);

module.exports = router;
