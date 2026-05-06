const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Registrar = sequelize.define('Registrar', {
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
  employee_id: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  office_location: {
    type: DataTypes.STRING(100),
    allowNull: false
  }
}, {
  tableName: 'registrars',
  timestamps: false
});

module.exports = Registrar;
