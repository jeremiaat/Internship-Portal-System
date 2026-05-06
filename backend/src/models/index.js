const sequelize = require('../config/database');
const User = require('./User');
const Student = require('./Student');
const Coordinator = require('./Coordinator');
const Company = require('./Company');
const Registrar = require('./Registrar');
const Internship = require('./Internship');
const Application = require('./Application');
const Supervisor = require('./Supervisor');
const Grade = require('./Grade');
const GradeComponent = require('./GradeComponent');
const GradeAppeal = require('./GradeAppeal');
const Report = require('./Report');
const Evaluation = require('./Evaluation');
const Notification = require('./Notification');
const NotificationPreference = require('./NotificationPreference');
const SystemAnnouncement = require('./SystemAnnouncement');

// Define associations
User.hasOne(Student, { foreignKey: 'user_id', as: 'student_profile' });
Student.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasOne(Coordinator, { foreignKey: 'user_id', as: 'coordinator_profile' });
Coordinator.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasOne(Company, { foreignKey: 'user_id', as: 'company_profile' });
Company.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasOne(Registrar, { foreignKey: 'user_id', as: 'registrar_profile' });
Registrar.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Company.hasMany(Internship, { foreignKey: 'company_id', as: 'internships' });
Internship.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

Student.hasMany(Application, { foreignKey: 'student_id', as: 'applications' });
Application.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

Internship.hasMany(Application, { foreignKey: 'internship_id', as: 'applications' });
Application.belongsTo(Internship, { foreignKey: 'internship_id', as: 'internship' });

Internship.hasMany(Supervisor, { foreignKey: 'internship_id', as: 'supervisors' });
Supervisor.belongsTo(Internship, { foreignKey: 'internship_id', as: 'internship' });

Company.hasMany(Supervisor, { foreignKey: 'company_id', as: 'supervisors' });
Supervisor.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

User.hasMany(Supervisor, { foreignKey: 'user_id', as: 'supervisors' });
Supervisor.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Student.hasMany(Grade, { foreignKey: 'student_id', as: 'grades' });
Grade.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

Application.hasOne(Grade, { foreignKey: 'application_id', as: 'grade' });
Grade.belongsTo(Application, { foreignKey: 'application_id', as: 'application' });

Coordinator.hasMany(Grade, { foreignKey: 'submitted_by', as: 'submitted_grades' });
Grade.belongsTo(Coordinator, { foreignKey: 'submitted_by', as: 'submitted_by_coordinator' });

Registrar.hasMany(Grade, { foreignKey: 'approved_by', as: 'approved_grades' });
Grade.belongsTo(Registrar, { foreignKey: 'approved_by', as: 'approved_by_registrar' });

Grade.hasMany(GradeComponent, { foreignKey: 'grade_id', as: 'components' });
GradeComponent.belongsTo(Grade, { foreignKey: 'grade_id', as: 'grade' });

Grade.hasMany(GradeAppeal, { foreignKey: 'grade_id', as: 'appeals' });
GradeAppeal.belongsTo(Grade, { foreignKey: 'grade_id', as: 'grade' });

Student.hasMany(GradeAppeal, { foreignKey: 'student_id', as: 'grade_appeals' });
GradeAppeal.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

Registrar.hasMany(GradeAppeal, { foreignKey: 'reviewed_by', as: 'reviewed_appeals' });
GradeAppeal.belongsTo(Registrar, { foreignKey: 'reviewed_by', as: 'reviewed_by_registrar' });

Student.hasMany(Report, { foreignKey: 'student_id', as: 'reports' });
Report.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

Application.hasMany(Report, { foreignKey: 'application_id', as: 'reports' });
Report.belongsTo(Application, { foreignKey: 'application_id', as: 'application' });

Report.hasOne(Evaluation, { foreignKey: 'report_id', as: 'evaluation' });
Evaluation.belongsTo(Report, { foreignKey: 'report_id', as: 'report' });

Supervisor.hasMany(Evaluation, { foreignKey: 'supervisor_id', as: 'evaluations' });
Evaluation.belongsTo(Supervisor, { foreignKey: 'supervisor_id', as: 'supervisor' });

User.hasMany(Notification, { foreignKey: 'recipient_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'recipient_id', as: 'recipient' });

Application.hasMany(Notification, { foreignKey: 'application_id', as: 'notifications' });
Notification.belongsTo(Application, { foreignKey: 'application_id', as: 'application' });

Grade.hasMany(Notification, { foreignKey: 'grade_id', as: 'notifications' });
Notification.belongsTo(Grade, { foreignKey: 'grade_id', as: 'grade' });

Report.hasMany(Notification, { foreignKey: 'report_id', as: 'notifications' });
Notification.belongsTo(Report, { foreignKey: 'report_id', as: 'report' });

User.hasOne(NotificationPreference, { foreignKey: 'user_id', as: 'notification_preferences' });
NotificationPreference.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(SystemAnnouncement, { foreignKey: 'created_by', as: 'created_announcements' });
SystemAnnouncement.belongsTo(User, { foreignKey: 'created_by', as: 'created_by_user' });

module.exports = {
  sequelize,
  User,
  Student,
  Coordinator,
  Company,
  Registrar,
  Internship,
  Application,
  Supervisor,
  Grade,
  GradeComponent,
  GradeAppeal,
  Report,
  Evaluation,
  Notification,
  NotificationPreference,
  SystemAnnouncement
};
