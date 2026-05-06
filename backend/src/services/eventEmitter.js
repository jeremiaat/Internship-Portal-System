const EventEmitter = require('events');
const { Notification, User, Grade, Application } = require('../models');

class NotificationEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Grade submitted event - notify student
    this.on('grade:submitted', async ({ grade, studentId }) => {
      try {
        const student = await User.findByPk(studentId);
        if (student) {
          await Notification.create({
            recipient_id: student.id,
            title: 'Grade Posted',
            message: 'Your internship grade has been posted and is pending approval.',
            notification_type: 'grade_posted',
            priority: 'high',
            grade_id: grade.id
          });
          console.log(`Notification sent to student ${student.username} for grade ${grade.id}`);
        }
      } catch (error) {
        console.error('Error sending grade notification:', error);
      }
    });

    // Grade approved event - notify student
    this.on('grade:approved', async ({ grade, studentId }) => {
      try {
        const student = await User.findByPk(studentId);
        if (student) {
          await Notification.create({
            recipient_id: student.id,
            title: 'Grade Approved',
            message: `Your internship grade has been approved: ${grade.letter_grade}`,
            notification_type: 'grade_posted',
            priority: 'high',
            grade_id: grade.id
          });
          console.log(`Approval notification sent to student ${student.username}`);
        }
      } catch (error) {
        console.error('Error sending grade approval notification:', error);
      }
    });

    // Application status changed event - notify student
    this.on('application:status_changed', async ({ application, status, studentId }) => {
      try {
        const student = await User.findByPk(studentId);
        if (student) {
          await Notification.create({
            recipient_id: student.id,
            title: 'Application Status Update',
            message: `Your internship application has been ${status}`,
            notification_type: 'application_status',
            priority: status === 'accepted' ? 'high' : 'medium',
            application_id: application.id
          });
          console.log(`Application status notification sent to student ${student.username}`);
        }
      } catch (error) {
        console.error('Error sending application status notification:', error);
      }
    });

    // Company approved event - notify company
    this.on('company:approved', async ({ companyId, userId }) => {
      try {
        const companyUser = await User.findByPk(userId);
        if (companyUser) {
          await Notification.create({
            recipient_id: companyUser.id,
            title: 'Company Registration Approved',
            message: 'Your company registration has been approved. You can now post internships.',
            notification_type: 'system_announcement',
            priority: 'high'
          });
          console.log(`Company approval notification sent to ${companyUser.username}`);
        }
      } catch (error) {
        console.error('Error sending company approval notification:', error);
      }
    });

    // Report submitted event - notify coordinator
    this.on('report:submitted', async ({ report, studentId }) => {
      try {
        // Find coordinators in the same department
        const student = await require('../models').Student.findOne({
          where: { user_id: studentId },
          include: [{ model: require('../models').Application }]
        });
        
        if (student) {
          const coordinators = await require('../models').Coordinator.findAll({
            where: { department: student.department },
            include: [{ model: User }]
          });

          for (const coordinator of coordinators) {
            await Notification.create({
              recipient_id: coordinator.user_id,
              title: 'Report Submitted',
              message: `A student has submitted an internship report.`,
              notification_type: 'report_due',
              priority: 'medium',
              report_id: report.id
            });
          }
          console.log(`Report submission notifications sent to coordinators`);
        }
      } catch (error) {
        console.error('Error sending report submission notification:', error);
      }
    });
  }
}

const notificationEventEmitter = new NotificationEventEmitter();

module.exports = notificationEventEmitter;
