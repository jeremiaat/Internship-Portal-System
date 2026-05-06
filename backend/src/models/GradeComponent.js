const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GradeComponent = sequelize.define('GradeComponent', {
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
  component_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  weight: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  max_score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  }
}, {
  tableName: 'grade_components',
  timestamps: false
});

module.exports = GradeComponent;
