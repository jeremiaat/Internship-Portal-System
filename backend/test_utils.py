import datetime
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import User, Student, Coordinator, Company, Registrar
from internships.models import Internship, Application
from grades.models import Grade, GradeComponent, GradeAppeal
from reports.models import Report, Evaluation
from notifications.models import Notification, NotificationPreference, SystemAnnouncement


class BaseTestCase(APITestCase):
    """Base test case with shared helpers for all tests."""

    def setUp(self):
        self.client = APIClient()

    def create_user(self, username, role='student', **kwargs):
        return User.objects.create_user(
            username=username,
            email=f"{username}@test.com",
            password='testpassword123',
            role=role,
            **kwargs
        )

    def create_student(self, username='student1', department='Computer Science',
                       year_of_study=3, gpa=3.5, credits_completed=90, **kwargs):
        user = self.create_user(username, role='student', **kwargs)
        student = Student.objects.create(
            user=user,
            student_id=f"STU{user.id:06d}",
            department=department,
            year_of_study=year_of_study,
            gpa=gpa,
            credits_completed=credits_completed
        )
        return user, student

    def create_coordinator(self, username='coordinator1', department='Computer Science', **kwargs):
        user = self.create_user(username, role='coordinator', **kwargs)
        coordinator = Coordinator.objects.create(
            user=user,
            employee_id=f"COORD{user.id:06d}",
            department=department
        )
        return user, coordinator

    def create_company(self, username='company1', company_name='Tech Corp', **kwargs):
        user = self.create_user(username, role='company', **kwargs)
        company = Company.objects.create(
            user=user,
            company_name=company_name,
            industry='Technology',
            address='123 Main St'
        )
        return user, company

    def create_registrar(self, username='registrar1', **kwargs):
        user = self.create_user(username, role='registrar', **kwargs)
        registrar = Registrar.objects.create(
            user=user,
            employee_id=f"REG{user.id:06d}",
            office_location='Main Office'
        )
        return user, registrar

    def create_internship(self, company, title='Software Intern', department='Computer Science',
                          status='active', **kwargs):
        defaults = {
            'title': title,
            'description': 'Test internship',
            'company': company,
            'department': department,
            'location': 'Remote',
            'start_date': timezone.now().date() + datetime.timedelta(days=30),
            'end_date': timezone.now().date() + datetime.timedelta(days=120),
            'application_deadline': timezone.now().date() + datetime.timedelta(days=15),
            'requirements': 'Python, Django',
            'responsibilities': 'Develop features',
            'stipend': 5000.00,
            'status': status,
        }
        defaults.update(kwargs)
        return Internship.objects.create(**defaults)

    def create_application(self, student, internship, status='pending', **kwargs):
        defaults = {
            'student': student,
            'internship': internship,
            'status': status,
            'cover_letter': 'I am interested in this position.',
        }
        defaults.update(kwargs)
        return Application.objects.create(**defaults)

    def create_grade(self, student, application, letter_grade='A', numeric_grade=95.0, **kwargs):
        defaults = {
            'student': student,
            'application': application,
            'letter_grade': letter_grade,
            'numeric_grade': numeric_grade,
            'credits': 3,
            'status': 'pending',
        }
        defaults.update(kwargs)
        return Grade.objects.create(**defaults)

    def create_report(self, student, application, report_type='weekly', status='draft', **kwargs):
        defaults = {
            'student': student,
            'application': application,
            'report_type': report_type,
            'title': 'Test Report',
            'content': 'Report content',
            'status': status,
        }
        defaults.update(kwargs)
        return Report.objects.create(**defaults)

    def create_notification(self, recipient, title='Test Notification', **kwargs):
        defaults = {
            'recipient': recipient,
            'title': title,
            'message': 'Test message',
            'notification_type': 'system_announcement',
            'priority': 'medium',
        }
        defaults.update(kwargs)
        return Notification.objects.create(**defaults)

    def authenticate_user(self, user):
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')

    def logout_user(self):
        self.client.credentials()

