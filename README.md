# Internship Portal System

A comprehensive web-based platform for managing internship applications, company approvals, and student performance tracking in educational institutions.

## Overview

The Internship Portal System streamlines the entire internship lifecycle from company registration and approval to student applications, performance evaluation, and grade management. The system serves four main user roles: Students, Companies, Coordinators, and Registrars.

## Features

### For Students
- Browse and apply to available internships
- Track application status (pending, accepted, rejected)
- Submit internship reports
- View grades and performance feedback
- Department-specific internship opportunities (CSE, Software, Communication, Power)

### For Companies
- Register company profile and await coordinator approval
- Post, edit, and delete internship opportunities
- Review student applications
- Accept or reject applications
- Provide performance feedback for interns
- Track internship status and applications

### For Coordinators
- Approve or reject company registrations
- Monitor internship postings
- Review student applications
- Assign grades for completed internships
- Access comprehensive dashboard metrics

### For Registrars
- View system-wide statistics
- Monitor internship participation
- Access student performance data
- Generate reports

## Technology Stack

### Backend
- **Framework**: Django REST Framework
- **Database**: SQLite (development)
- **Authentication**: JWT Token-based authentication
- **API**: RESTful API endpoints

### Frontend
- **Framework**: React.js
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Routing**: React Router
- **HTTP Client**: Axios

## Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run migrations:
```bash
python manage.py migrate
```

5. Create a superuser:
```bash
python manage.py createsuperuser
```

6. Start the development server:
```bash
python manage.py runserver
```

The backend API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend application will be available at `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `GET /api/auth/profile/` - Get user profile

### Companies
- `GET /api/auth/companies/` - List all companies
- `POST /api/auth/companies/` - Register new company
- `POST /api/auth/companies/{id}/approve/` - Approve/reject company (coordinator only)

### Internships
- `GET /api/internships/` - List all internships
- `POST /api/internships/` - Create new internship (approved companies only)
- `PUT /api/internships/{id}/update/` - Update internship (company owner only)
- `DELETE /api/internships/{id}/delete/` - Delete internship (company owner only)

### Applications
- `GET /api/applications/` - List applications
- `POST /api/applications/` - Apply to internship
- `PUT /api/applications/{id}/` - Update application status (company only)

### Reports
- `GET /api/reports/` - List internship reports
- `POST /api/reports/` - Submit internship report

### Grades
- `GET /api/grades/` - List grades
- `PUT /api/grades/{student_id}/` - Assign grade (coordinator/registrar only)

## User Roles & Permissions

### Student
- View and apply to internships
- Submit reports
- View own grades and feedback

### Company
- Register and await approval
- Post internships (after approval)
- Manage applications
- Provide performance feedback

### Coordinator
- Approve/reject company registrations
- Monitor all internships and applications
- Assign grades
- Access system metrics

### Registrar
- View system-wide statistics
- Monitor student performance
- Generate reports

## Department Restrictions

Internship postings are restricted to the following departments:
- CSE (Computer Science Engineering)
- Software
- Communication
- Power

## Company Approval Workflow

1. Company registers via registration form
2. Status set to "pending"
3. Coordinator reviews company profile
4. Coordinator approves or rejects company
5. Approved companies can post internships
6. Companies can refresh their approval status via "Refresh Status" button

## Database Schema

### User Model
- id, username, email, first_name, last_name, role, phone
- Related profiles: Student, Company, Coordinator, Registrar

### Company Model
- id, user, company_name, industry, address, website
- verification_status, verified_by, verified_at

### Internship Model
- id, company, title, description, department, location
- start_date, end_date, application_deadline, requirements, responsibilities, stipend, status

### Application Model
- id, student, internship, status, applied_at
- company_feedback (JSON)

### Report Model
- id, student, internship, title, content, report_type, status

### Grade Model
- id, student, internship, grade, assigned_by, assigned_at

## Development

### Running Tests
```bash
# Backend
cd backend
python manage.py test

# Frontend
cd frontend
npm test
```

### Code Structure
```
IP/
├── backend/
│   ├── grades/          # Grade management
│   ├── internships/     # Internship CRUD
│   ├── notifications/   # System notifications
│   ├── reports/         # Student reports
│   ├── resumes/         # Resume handling
│   └── users/           # User authentication & profiles
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── contexts/    # React contexts
│   │   ├── pages/       # Page components
│   │   └── services/    # API services
│   └── public/
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is developed for educational purposes.

## Support

For issues and questions, please contact the development team.

## Version History

- **v1.0.0** - Initial release with core functionality
  - User authentication and role-based access
  - Company registration and approval workflow
  - Internship posting and application management
  - Performance feedback system
  - Grade assignment functionality
