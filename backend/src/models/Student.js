const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  student_id: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  year_of_study: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  gpa: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  credits_completed: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  profile_numeric_grade: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  profile_letter_grade: {
    type: DataTypes.ENUM('A', 'B', 'C', 'D', 'F', 'P', 'NP'),
    allowNull: true
  },
  profile_grade_comment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  profile_grade_updated_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'students',
  timestamps: false
});

module.exports = Student;
