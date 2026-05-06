const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  recipient_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  notification_type: {
    type: DataTypes.ENUM('application_status', 'grade_posted', 'report_due', 'internship_available', 'system_announcement'),
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'medium'
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  application_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'applications',
      key: 'id'
    }
  },
  grade_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'grades',
      key: 'id'
    }
  },
  report_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'reports',
      key: 'id'
    }
  }
}, {
  tableName: 'notifications',
  timestamps: false,
  indexes: [
    {
      fields: ['recipient_id', 'created_at']
    }
  ]
});

module.exports = Notification;
