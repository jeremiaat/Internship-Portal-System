const { Application, Internship, Student, Company, User } = require('../models');
const { Op } = require('sequelize');
const notificationEventEmitter = require('../services/eventEmitter');

const createApplication = async (req, res) => {
  try {
    const { internship_id, cover_letter, resume } = req.body;
    
    const student = await Student.findOne({ where: { user_id: req.user.id } });
    if (!student) {
      return res.status(403).json({ error: 'Student profile not found' });
    }
    
    // Check if internship exists
    const internship = await Internship.findByPk(internship_id);
    if (!internship) {
      return res.status(404).json({ error: 'Internship not found' });
    }
    
    // Check eligibility based on academic status (department restriction removed)
    console.log('Student dept:', student.department, 'Internship dept:', internship.department);
    console.log('Student year:', student.year_of_study, 'Student GPA:', student.gpa);
    
    // Department restriction removed - any student can apply to any internship
    // Year of study requirement removed
    // if (student.year_of_study < 2) {
    //   return res.status(400).json({ error: `You must be at least in your 2nd year of study. You are in year ${student.year_of_study}.` });
    // }
    
    if (student.gpa < 2.0) {
      return res.status(400).json({ error: `You must have a minimum GPA of 2.0. Your GPA is ${student.gpa}.` });
    }
    
    // Check if already applied
    const existingApplication = await Application.findOne({
      where: {
        student_id: student.id,
        internship_id
      }
    });
    
    if (existingApplication) {
      return res.status(400).json({ error: 'Already applied to this internship' });
    }
    
    const application = await Application.create({
      student_id: student.id,
      internship_id,
      cover_letter,
      resume: (resume && typeof resume === 'string' && resume !== '') ? resume : null
    });
    
    res.status(201).json(application);
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({ error: 'Failed to create application: ' + error.message });
  }
};

const getApplications = async (req, res) => {
  try {
    const { status, internship_id } = req.query;
    
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    // Filter based on user role
    if (req.user.role === 'student') {
      const student = await Student.findOne({ where: { user_id: req.user.id } });
      if (student) {
        where.student_id = student.id;
      }
    } else if (req.user.role === 'company') {
      const company = await Company.findOne({ where: { user_id: req.user.id } });
      if (company) {
        // If a specific internship_id is provided, use it (but verify it belongs to this company)
        if (internship_id) {
          const internship = await Internship.findOne({ 
            where: { id: internship_id, company_id: company.id } 
          });
          if (!internship) {
            return res.json({ results: [] });
          }
          where.internship_id = internship_id;
        } else {
          // Otherwise, get all internships for this company
          const internships = await Internship.findAll({ where: { company_id: company.id }, attributes: ['id'] });
          const internshipIds = internships.map(i => i.id);
          if (internshipIds.length === 0) {
            return res.json({ results: [] });
          }
          where.internship_id = { [Op.in]: internshipIds };
        }
      }
    }
    
    const applications = await Application.findAll({
      where,
      include: [
        {
          model: Student,
          as: 'student',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'first_name', 'last_name', 'email']
            }
          ]
        },
        {
          model: Internship,
          as: 'internship',
          include: [
            {
              model: Company,
              as: 'company',
              attributes: ['id', 'company_name']
            }
          ]
        }
      ],
      order: [['applied_at', 'DESC']]
    });
    
    res.json({ results: applications });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications: ' + error.message });
  }
};

const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const application = await Application.findByPk(id, {
      include: [
        {
          model: Student,
          as: 'student',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'first_name', 'last_name', 'email']
            }
          ]
        },
        {
          model: Internship,
          as: 'internship',
          include: [
            {
              model: Company,
              as: 'company',
              attributes: ['id', 'company_name']
            }
          ]
        }
      ]
    });
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json(application);
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ error: 'Failed to fetch application: ' + error.message });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const application = await Application.findByPk(id);
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Check authorization - only company can update application status
    if (req.user.role !== 'company') {
      return res.status(403).json({ error: 'Not authorized to update application status' });
    }
    
    const internship = await Internship.findByPk(application.internship_id);
    const company = await Company.findOne({ where: { user_id: req.user.id } });
    
    if (!company || internship.company_id !== company.id) {
      return res.status(403).json({ error: 'Not authorized to update this application' });
    }
    
    application.status = status;
    await application.save();
    
    // Emit event for notification
    notificationEventEmitter.emit('application:status_changed', { application, status, studentId: application.student_id });
    
    res.json(application);
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ error: 'Failed to update application status' });
  }
};

module.exports = {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplicationStatus
};
