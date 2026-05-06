# Internship Portal Backend - Node.js

This is the Node.js/Express backend for the Internship Portal System, migrated from Django.

## Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher) with MySQL Workbench
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Create a `.env` file in the root directory with the following variables:

```env
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=internship_portal
DB_USER=root
DB_PASSWORD=your_mysql_password

# JWT
JWT_SECRET=your-secret-key-change-this-in-production
JWT_ACCESS_EXPIRATION=60m
JWT_REFRESH_EXPIRATION=1d

# CORS
CORS_ORIGIN=http://localhost:5173
```

3. Set up MySQL database using MySQL Workbench:

**Option A: Using MySQL Workbench GUI**
- Open MySQL Workbench
- Connect to your MySQL server
- In the query editor, run:
```sql
CREATE DATABASE internship_portal;
```
- Click the lightning bolt icon to execute

**Option B: Using Command Line**
```bash
mysql -u root -p
```
Then run:
```sql
CREATE DATABASE internship_portal;
exit;
```

4. Run database migration to create all tables:
```bash
npm run migrate
```

This will automatically create all required tables with the correct schema.

## Running the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000` by default.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile/update` - Update user profile
- `POST /api/auth/change-password` - Change password

### Internships
- `POST /api/internships` - Create internship (Company only)
- `GET /api/internships` - Get all internships
- `GET /api/internships/:id` - Get internship by ID
- `PUT /api/internships/:id` - Update internship (Company only)
- `DELETE /api/internships/:id` - Delete internship (Company only)

### Applications
- `POST /api/applications` - Apply for internship (Student only)
- `GET /api/applications` - Get all applications
- `GET /api/applications/:id` - Get application by ID
- `PUT /api/applications/:id/status` - Update application status (Company only)

### Grades
- `POST /api/grades` - Create grade (Coordinator only)
- `GET /api/grades` - Get all grades
- `PUT /api/grades/:id/approve` - Approve/reject grade (Registrar only)
- `PUT /api/grades/students/:student_id/profile-grade` - Assign student profile grade (Registrar only)

### Reports
- `POST /api/reports` - Create report (Student only)
- `GET /api/reports` - Get all reports
- `PUT /api/reports/:id` - Update report (Student only)
- `POST /api/reports/:report_id/evaluation` - Submit evaluation

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `GET /api/notifications/preferences` - Get notification preferences
- `PUT /api/notifications/preferences` - Update notification preferences
- `GET /api/notifications/system` - Get system announcements
- `POST /api/notifications/system` - Create system announcement (Coordinator/Registrar only)

## User Roles

- **Student**: Can view internships, apply, submit reports, view grades
- **Company**: Can create/manage internships, review applications
- **Coordinator**: Can assign grades, create system announcements
- **Registrar**: Can approve grades, assign student profile grades, create system announcements

## Database Models

The backend uses Sequelize ORM with the following models:
- User
- Student
- Coordinator
- Company
- Registrar
- Internship
- Application
- Supervisor
- Grade
- GradeComponent
- GradeAppeal
- Report
- Evaluation
- Notification
- NotificationPreference
- SystemAnnouncement

## Database Schema

When you run `npm run migrate`, Sequelize will automatically create all tables with the following structure:

**Users Table**
- id, username, email, password, first_name, last_name, phone, role, created_at

**Students Table**
- id, user_id, student_id, department, year_of_study, gpa, credits_completed, profile_grade_updated_at

**Coordinators Table**
- id, user_id, employee_id, department

**Companies Table**
- id, user_id, company_name, industry, address, website, verification_status, verified_by, verified_at

**Registrars Table**
- id, user_id, employee_id, office_location

**Internships Table**
- id, company_id, title, description, department, location, start_date, end_date, application_deadline, requirements, responsibilities, stipend, status, created_at

**Applications Table**
- id, student_id, internship_id, status, cover_letter, resume, applied_at

**Supervisors Table**
- id, user_id, internship_id, company_id, is_primary

**Grades Table**
- id, student_id, application_id, letter_grade, numeric_grade, credits, status, submitted_by, approved_by, submission_date, approval_date, comments

**GradeComponents Table**
- id, grade_id, component_name, weight, score, max_score

**GradeAppeals Table**
- id, grade_id, student_id, reason, desired_grade, status, submitted_at, reviewed_by, review_date, review_comments

**Reports Table**
- id, student_id, application_id, report_type, title, content, status, submitted_at, created_at

**Evaluations Table**
- id, report_id, supervisor_id, rating, feedback, strengths, areas_for_improvement, evaluation_date

**Notifications Table**
- id, recipient_id, title, message, notification_type, priority, is_read, read_at, created_at, application_id, grade_id, report_id

**NotificationPreferences Table**
- id, user_id, email_notifications, push_notifications, application_updates, grade_updates, report_reminders, new_internships

**SystemAnnouncements Table**
- id, title, message, target_roles, is_active, start_date, end_date, created_by, created_at

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

## CORS

The backend is configured to accept requests from the frontend (default: `http://localhost:5173`). Modify the `CORS_ORIGIN` in the `.env` file to match your frontend URL.

## Development

The project uses nodemon for development, which automatically restarts the server when file changes are detected.

## Migration from Django

This Node.js backend provides equivalent functionality to the original Django backend:
- Same database schema (via Sequelize models)
- Same API endpoints
- Same authentication flow (JWT)
- Same role-based access control
