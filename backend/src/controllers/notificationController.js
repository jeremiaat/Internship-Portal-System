const { Notification, NotificationPreference, User, SystemAnnouncement } = require('../models');
const { Op } = require('sequelize');

const getNotifications = async (req, res) => {
  try {
    const { is_read, notification_type } = req.query;
    
    const where = {
      recipient_id: req.user.id
    };
    
    if (is_read !== undefined) {
      where.is_read = is_read === 'true';
    }
    
    if (notification_type) {
      where.notification_type = notification_type;
    }
    
    const notifications = await Notification.findAll({
      where,
      order: [['created_at', 'DESC']]
    });
    
    res.json({ results: notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findOne({
      where: {
        id,
        recipient_id: req.user.id
      }
    });
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    notification.is_read = true;
    notification.read_at = new Date();
    await notification.save();
    
    res.json(notification);
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      {
        is_read: true,
        read_at: new Date()
      },
      {
        where: {
          recipient_id: req.user.id,
          is_read: false
        }
      }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};

const getNotificationPreferences = async (req, res) => {
  try {
    const preferences = await NotificationPreference.findOne({
      where: { user_id: req.user.id }
    });
    
    if (!preferences) {
      // Create default preferences if not exist
      const newPreferences = await NotificationPreference.create({
        user_id: req.user.id
      });
      return res.json(newPreferences);
    }
    
    res.json(preferences);
  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({ error: 'Failed to fetch notification preferences' });
  }
};

const updateNotificationPreferences = async (req, res) => {
  try {
    const { email_notifications, push_notifications, application_updates, grade_updates, report_reminders, new_internships } = req.body;
    
    const preferences = await NotificationPreference.findOne({
      where: { user_id: req.user.id }
    });
    
    if (!preferences) {
      const newPreferences = await NotificationPreference.create({
        user_id: req.user.id,
        email_notifications,
        push_notifications,
        application_updates,
        grade_updates,
        report_reminders,
        new_internships
      });
      return res.json(newPreferences);
    }
    
    if (email_notifications !== undefined) preferences.email_notifications = email_notifications;
    if (push_notifications !== undefined) preferences.push_notifications = push_notifications;
    if (application_updates !== undefined) preferences.application_updates = application_updates;
    if (grade_updates !== undefined) preferences.grade_updates = grade_updates;
    if (report_reminders !== undefined) preferences.report_reminders = report_reminders;
    if (new_internships !== undefined) preferences.new_internships = new_internships;
    
    await preferences.save();
    
    res.json(preferences);
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
};

const getSystemAnnouncements = async (req, res) => {
  try {
    const now = new Date();
    
    const announcements = await SystemAnnouncement.findAll({
      where: {
        is_active: true,
        start_date: { [Op.lte]: now },
        [Op.or]: [
          { end_date: null },
          { end_date: { [Op.gte]: now } }
        ]
      },
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'first_name', 'last_name']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    // Filter by user role
    const filteredAnnouncements = announcements.filter(announcement => {
      const targetRoles = announcement.target_roles.split(',');
      return targetRoles.includes(req.user.role);
    });
    
    res.json(filteredAnnouncements);
  } catch (error) {
    console.error('Get system announcements error:', error);
    res.status(500).json({ error: 'Failed to fetch system announcements' });
  }
};

const createSystemAnnouncement = async (req, res) => {
  try {
    const { title, message, target_roles, start_date, end_date } = req.body;
    
    const announcement = await SystemAnnouncement.create({
      title,
      message,
      target_roles,
      is_active: true,
      start_date,
      end_date: end_date || null,
      created_by: req.user.id
    });
    
    res.status(201).json(announcement);
  } catch (error) {
    console.error('Create system announcement error:', error);
    res.status(500).json({ error: 'Failed to create system announcement' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getNotificationPreferences,
  updateNotificationPreferences,
  getSystemAnnouncements,
  createSystemAnnouncement
};
