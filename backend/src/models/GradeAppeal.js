const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GradeAppeal = sequelize.define('GradeAppeal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  grade_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'grades',
      key: 'id'
    }
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'students',
      key: 'id'
    }
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  desired_grade: {
    type: DataTypes.ENUM('A', 'B', 'C', 'D', 'F', 'P', 'NP'),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('submitted', 'under_review', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'submitted'
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  reviewed_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'registrars',
      key: 'id'
    }
  },
  review_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  review_comments: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'grade_appeals',
  timestamps: false
});

module.exports = GradeAppeal;
