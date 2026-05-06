const { Grade, Student, Application, Coordinator, Registrar, GradeComponent, GradeAppeal } = require('../models');
const { Op } = require('sequelize');
const notificationEventEmitter = require('../services/eventEmitter');

const createGrade = async (req, res) => {
  try {
    const { application_id, letter_grade, numeric_grade, credits, comments, components } = req.body;
    
    const coordinator = await Coordinator.findOne({ where: { user_id: req.user.id } });
    if (!coordinator) {
      return res.status(403).json({ error: 'Coordinator profile not found' });
    }
    
    const application = await Application.findByPk(application_id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Check if grade already exists
    const existingGrade = await Grade.findOne({ where: { application_id } });
    if (existingGrade) {
      return res.status(400).json({ error: 'Grade already exists for this application' });
    }
    
    const grade = await Grade.create({
      student_id: application.student_id,
      application_id,
      letter_grade,
      numeric_grade,
      credits: credits || 3,
      status: 'pending',
      submitted_by: coordinator.id,
      comments
    });
    
    // Create grade components if provided
    if (components && Array.isArray(components)) {
      for (const component of components) {
        await GradeComponent.create({
          grade_id: grade.id,
          component_name: component.component_name,
          weight: component.weight,
          score: component.score,
          max_score: component.max_score
        });
      }
    }
    
    // Emit event for notification
    notificationEventEmitter.emit('grade:submitted', { grade, studentId: application.student_id });
    
    res.status(201).json(grade);
  } catch (error) {
    console.error('Create grade error:', error);
    res.status(500).json({ error: 'Failed to create grade' });
  }
};

const getGrades = async (req, res) => {
  try {
    const { status, student_id } = req.query;
    
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (student_id) {
      where.student_id = student_id;
    }
    
    // Filter based on user role
    if (req.user.role === 'student') {
      const student = await Student.findOne({ where: { user_id: req.user.id } });
      if (student) {
        where.student_id = student.id;
      }
    }
    
    const grades = await Grade.findAll({
      where,
      include: [
        {
          model: Student,
          as: 'student',
          include: [
            {
              model: require('../models').User,
              as: 'user',
              attributes: ['id', 'username', 'first_name', 'last_name']
            }
          ]
        },
        {
          model: Application,
          as: 'application',
          include: [
            {
              model: require('../models').Internship,
              as: 'internship',
              attributes: ['id', 'title']
            }
          ]
        },
        {
          model: Coordinator,
          as: 'submitted_by_coordinator',
          attributes: ['id', 'employee_id']
        },
        {
          model: Registrar,
          as: 'approved_by_registrar',
          attributes: ['id', 'employee_id']
        }
      ],
      order: [['submission_date', 'DESC']]
    });
    
    res.json({ results: grades });
  } catch (error) {
    console.error('Get grades error:', error);
    res.status(500).json({ error: 'Failed to fetch grades: ' + error.message });
  }
};

const approveGrade = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, letter_grade, numeric_grade } = req.body;
    
    const registrar = await Registrar.findOne({ where: { user_id: req.user.id } });
    if (!registrar) {
      return res.status(403).json({ error: 'Registrar profile not found' });
    }
    
    const grade = await Grade.findByPk(id);
    if (!grade) {
      return res.status(404).json({ error: 'Grade not found' });
    }
    
    if (action === 'approve') {
      grade.status = 'approved';
      grade.approved_by = registrar.id;
      grade.approval_date = new Date();
      if (letter_grade) grade.letter_grade = letter_grade;
      if (numeric_grade) grade.numeric_grade = numeric_grade;
      
      // Emit event for notification
      notificationEventEmitter.emit('grade:approved', { grade, studentId: grade.student_id });
    } else if (action === 'reject') {
      grade.status = 'rejected';
      grade.approved_by = registrar.id;
      grade.approval_date = new Date();
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    await grade.save();
    
    res.json(grade);
  } catch (error) {
    console.error('Approve grade error:', error);
    res.status(500).json({ error: 'Failed to approve grade' });
  }
};

const assignStudentProfileGrade = async (req, res) => {
  try {
    const { student_id } = req.params;
    const { gpa } = req.body;
    
    if (req.user.role !== 'registrar') {
      return res.status(403).json({ error: 'Only registrar users can assign student profile grades' });
    }
    
    const student = await Student.findByPk(student_id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    if (gpa === null || gpa === '') {
      return res.status(400).json({ error: 'gpa is required' });
    }
    
    const gpaValue = parseFloat(gpa);
    if (isNaN(gpaValue) || gpaValue < 0 || gpaValue > 4) {
      return res.status(400).json({ error: 'gpa must be between 0 and 4' });
    }
    
    student.gpa = gpaValue;
    student.profile_grade_updated_at = new Date();
    await student.save();
    
    res.json(student);
  } catch (error) {
    console.error('Assign student profile grade error:', error);
    res.status(500).json({ error: 'Failed to assign student profile grade' });
  }
};

module.exports = {
  createGrade,
  getGrades,
  approveGrade,
  assignStudentProfileGrade
};
