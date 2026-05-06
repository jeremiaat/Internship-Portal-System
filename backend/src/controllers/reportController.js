const { Report, Student, Application, Supervisor, Evaluation } = require('../models');
const { Op } = require('sequelize');
const notificationEventEmitter = require('../services/eventEmitter');

const createReport = async (req, res) => {
  try {
    const { application_id, report_type, title, content, status } = req.body;
    
    const student = await Student.findOne({ where: { user_id: req.user.id } });
    if (!student) {
      return res.status(403).json({ error: 'Student profile not found' });
    }
    
    const application = await Application.findByPk(application_id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    if (application.student_id !== student.id) {
      return res.status(403).json({ error: 'Not authorized to create report for this application' });
    }
    
    const report = await Report.create({
      student_id: student.id,
      application_id,
      report_type,
      title,
      content,
      status: status || 'draft'
    });
    
    res.status(201).json(report);
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
};

const getReports = async (req, res) => {
  try {
    const { status, report_type, student_id } = req.query;
    
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (report_type) {
      where.report_type = report_type;
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
    
    const reports = await Report.findAll({
      where,
      include: [
        {
          model: Student,
          include: [
            {
              model: require('../models').User,
              attributes: ['id', 'username', 'first_name', 'last_name']
            }
          ]
        },
        {
          model: Application,
          include: [
            {
              model: require('../models').Internship,
              attributes: ['id', 'title']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    res.json({ results: reports });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, status } = req.body;
    
    const report = await Report.findByPk(id);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Check authorization
    const student = await Student.findOne({ where: { user_id: req.user.id } });
    if (!student || report.student_id !== student.id) {
      return res.status(403).json({ error: 'Not authorized to update this report' });
    }
    
    if (title) report.title = title;
    if (content) report.content = content;
    if (status) {
      report.status = status;
      if (status === 'submitted') {
        report.submitted_at = new Date();
        // Emit event for notification
        notificationEventEmitter.emit('report:submitted', { report, studentId: req.user.id });
      }
    }
    
    await report.save();
    
    res.json(report);
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
};

const submitEvaluation = async (req, res) => {
  try {
    const { report_id } = req.params;
    const { rating, feedback, strengths, areas_for_improvement } = req.body;
    
    const report = await Report.findByPk(report_id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Check if evaluation already exists
    const existingEvaluation = await Evaluation.findOne({ where: { report_id } });
    if (existingEvaluation) {
      return res.status(400).json({ error: 'Evaluation already exists for this report' });
    }
    
    // Find supervisor (this is simplified - in reality you'd need to check if user is a supervisor)
    const evaluation = await Evaluation.create({
      report_id,
      supervisor_id: 1, // This should be the actual supervisor ID
      rating,
      feedback,
      strengths: strengths || '',
      areas_for_improvement: areas_for_improvement || ''
    });
    
    res.status(201).json(evaluation);
  } catch (error) {
    console.error('Submit evaluation error:', error);
    res.status(500).json({ error: 'Failed to submit evaluation' });
  }
};

module.exports = {
  createReport,
  getReports,
  updateReport,
  submitEvaluation
};
