const { Internship, Company, Application, Student, User } = require('../models');
const { Op } = require('sequelize');

const createInternship = async (req, res) => {
  try {
    const { title, description, departments, location, start_date, end_date, application_deadline, requirements, responsibilities, stipend, status } = req.body;
    
    const company = await Company.findOne({ where: { user_id: req.user.id } });
    if (!company) {
      return res.status(403).json({ error: 'Company profile not found' });
    }
    
    // Convert departments array to comma-separated string for storage
    const department = Array.isArray(departments) ? departments.join(', ') : (departments || '');
    
    const internship = await Internship.create({
      title,
      description,
      company_id: company.id,
      department,
      location,
      start_date,
      end_date,
      application_deadline,
      requirements,
      responsibilities,
      stipend: stipend || null,
      status: status || 'active'
    });
    
    res.status(201).json(internship);
  } catch (error) {
    console.error('Create internship error:', error);
    res.status(500).json({ error: 'Failed to create internship' });
  }
};

const getInternships = async (req, res) => {
  try {
    const { status, search, department } = req.query;
    
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (department) {
      where.department = department;
    }
    
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // If user is company, only show their internships
    if (req.user.role === 'company') {
      const company = await Company.findOne({ where: { user_id: req.user.id } });
      if (company) {
        where.company_id = company.id;
      }
    }
    
    const internships = await Internship.findAll({
      where,
      include: [
        {
          model: Company,
          as: 'company',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'first_name', 'last_name']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    res.json({ results: internships });
  } catch (error) {
    console.error('Get internships error:', error);
    res.status(500).json({ error: 'Failed to fetch internships' });
  }
};

const getInternshipById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const internship = await Internship.findByPk(id, {
      include: [
        {
          model: Company,
          as: 'company',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'first_name', 'last_name', 'email']
            }
          ]
        }
      ]
    });
    
    if (!internship) {
      return res.status(404).json({ error: 'Internship not found' });
    }
    
    res.json(internship);
  } catch (error) {
    console.error('Get internship error:', error);
    res.status(500).json({ error: 'Failed to fetch internship' });
  }
};

const updateInternship = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, departments, location, start_date, end_date, application_deadline, requirements, responsibilities, stipend, status } = req.body;
    
    const internship = await Internship.findByPk(id);
    
    if (!internship) {
      return res.status(404).json({ error: 'Internship not found' });
    }
    
    // Check if user owns this internship
    const company = await Company.findOne({ where: { user_id: req.user.id } });
    if (!company || internship.company_id !== company.id) {
      return res.status(403).json({ error: 'Not authorized to update this internship' });
    }
    
    if (title) internship.title = title;
    if (description) internship.description = description;
    if (departments !== undefined) {
      // Convert departments array to comma-separated string for storage
      internship.department = Array.isArray(departments) ? departments.join(', ') : (departments || '');
    }
    if (location) internship.location = location;
    if (start_date) internship.start_date = start_date;
    if (end_date) internship.end_date = end_date;
    if (application_deadline) internship.application_deadline = application_deadline;
    if (requirements) internship.requirements = requirements;
    if (responsibilities) internship.responsibilities = responsibilities;
    if (stipend !== undefined) internship.stipend = stipend;
    if (status) internship.status = status;
    
    await internship.save();
    
    res.json(internship);
  } catch (error) {
    console.error('Update internship error:', error);
    res.status(500).json({ error: 'Failed to update internship' });
  }
};

const deleteInternship = async (req, res) => {
  try {
    const { id } = req.params;
    
    const internship = await Internship.findByPk(id);
    
    if (!internship) {
      return res.status(404).json({ error: 'Internship not found' });
    }
    
    // Check if user owns this internship
    const company = await Company.findOne({ where: { user_id: req.user.id } });
    if (!company || internship.company_id !== company.id) {
      return res.status(403).json({ error: 'Not authorized to delete this internship' });
    }
    
    await internship.destroy();
    
    res.json({ message: 'Internship deleted successfully' });
  } catch (error) {
    console.error('Delete internship error:', error);
    res.status(500).json({ error: 'Failed to delete internship' });
  }
};

module.exports = {
  createInternship,
  getInternships,
  getInternshipById,
  updateInternship,
  deleteInternship
};
