require('dotenv').config();
const sequelize = require('../config/database');
const { sequelize: db } = require('../models');

const migrate = async () => {
  try {
    console.log('Starting database migration...');
    
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Create all tables
    await db.sync({ force: false, alter: true });
    console.log('Database tables created/updated successfully.');
    
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
