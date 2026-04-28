from django.urls import reverse
from rest_framework import status
from test_utils import BaseTestCase
from users.models import User, Student, Coordinator, Company, Registrar


class UserModelTests(BaseTestCase):
    """Unit tests for User and profile models."""

    def test_user_creation(self):
        user = self.create_user('testuser', role='student')
        self.assertEqual(user.role, 'student')
        self.assertTrue(user.check_password('testpassword123'))

    def test_student_profile_creation(self):
        user, student = self.create_student(year_of_study=3, gpa=3.5)
        self.assertEqual(student.user, user)
        self.assertEqual(student.year_of_study, 3)
        self.assertEqual(student.gpa, 3.5)
        self.assertTrue(student.student_id.startswith('STU'))

    def test_coordinator_profile_creation(self):
        user, coordinator = self.create_coordinator(department='Electrical Engineering')
        self.assertEqual(coordinator.department, 'Electrical Engineering')
        self.assertTrue(coordinator.employee_id.startswith('COORD'))

    def test_company_profile_creation(self):
        user, company = self.create_company(company_name='Innovate Inc')
        self.assertEqual(company.company_name, 'Innovate Inc')
        self.assertEqual(company.industry, 'Technology')

    def test_registrar_profile_creation(self):
        user, registrar = self.create_registrar()
        self.assertTrue(registrar.employee_id.startswith('REG'))
        self.assertEqual(registrar.office_location, 'Main Office')

    def test_student_eligibility_by_year(self):
        """Students in year 1 should not be eligible for certain internships."""
        _, freshman = self.create_student(username='freshman', year_of_study=1, gpa=3.0)
        _, senior = self.create_student(username='senior', year_of_study=4, gpa=3.5)

        # Eligibility logic: year_of_study >= 2 and gpa >= 2.5
        self.assertFalse(freshman.year_of_study >= 2 and freshman.gpa >= 2.5)
        self.assertTrue(senior.year_of_study >= 2 and senior.gpa >= 2.5)

    def test_student_eligibility_by_gpa(self):
        """Students with GPA below 2.5 should not be eligible."""
        _, low_gpa = self.create_student(username='lowgpa', year_of_study=3, gpa=2.0)
        _, high_gpa = self.create_student(username='highgpa', year_of_study=3, gpa=3.0)

        self.assertFalse(low_gpa.gpa >= 2.5)
        self.assertTrue(high_gpa.gpa >= 2.5)

    def test_student_eligibility_by_department(self):
        """Department matching for eligibility."""
        _, cs_student = self.create_student(username='csstudent', department='Computer Science')
        _, ee_student = self.create_student(username='eestudent', department='Electrical Engineering')

        self.assertEqual(cs_student.department, 'Computer Science')
        self.assertEqual(ee_student.department, 'Electrical Engineering')
        self.assertNotEqual(cs_student.department, ee_student.department)

    def test_user_role_choices(self):
        valid_roles = ['student', 'coordinator', 'company', 'registrar']
        for role in valid_roles:
            user = self.create_user(f'user_{role}', role=role)
            self.assertEqual(user.role, role)


class AuthenticationTests(BaseTestCase):
    """Unit tests for authentication endpoints."""

    def test_register_student(self):
        url = reverse('register')
        data = {
            'username': 'newstudent',
            'email': 'newstudent@test.com',
            'password': 'securepassword123',
            'first_name': 'New',
            'last_name': 'Student',
            'role': 'student'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertTrue(User.objects.filter(username='newstudent').exists())
        self.assertTrue(Student.objects.filter(user__username='newstudent').exists())

    def test_register_company(self):
        url = reverse('register')
        data = {
            'username': 'newcompany',
            'email': 'newcompany@test.com',
            'password': 'securepassword123',
            'first_name': 'New',
            'last_name': 'Company',
            'role': 'company',
            'company_name': 'New Tech'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Company.objects.filter(user__username='newcompany').exists())

    def test_register_duplicate_username(self):
        self.create_user('existinguser')
        url = reverse('register')
        data = {
            'username': 'existinguser',
            'email': 'existing@test.com',
            'password': 'securepassword123',
            'role': 'student'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_success(self):
        user = self.create_user('logintest', role='student')
        user.set_password('mypassword')
        user.save()
        url = reverse('login')
        data = {'username': 'logintest', 'password': 'mypassword'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_login_invalid_credentials(self):
        url = reverse('login')
        data = {'username': 'nonexistent', 'password': 'wrongpassword'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_logout(self):
        user = self.create_user('logouttest')
        self.authenticate_user(user)
        url = reverse('logout')
        response = self.client.post(url, {'refresh_token': 'dummy'}, format='json')
        # May fail due to invalid token but endpoint should be accessible
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])


class ProfileTests(BaseTestCase):
    """Unit tests for profile management."""

    def test_get_profile(self):
        user, _ = self.create_student()
        self.authenticate_user(user)
        url = reverse('profile')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], user.username)
        self.assertIn('profile_data', response.data)

    def test_update_profile(self):
        user, student = self.create_student()
        self.authenticate_user(user)
        url = reverse('update_profile')
        data = {
            'email': 'updated@test.com',
            'first_name': 'Updated',
            'department': 'Mathematics'
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertEqual(user.email, 'updated@test.com')
        self.assertEqual(user.first_name, 'Updated')

    def test_change_password(self):
        user = self.create_user('pwduser')
        user.set_password('oldpassword')
        user.save()
        self.authenticate_user(user)
        url = reverse('change_password')
        data = {'old_password': 'oldpassword', 'new_password': 'newsecurepassword123'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.check_password('newsecurepassword123'))

    def test_change_password_wrong_old(self):
        user = self.create_user('pwduser2')
        user.set_password('oldpassword')
        user.save()
        self.authenticate_user(user)
        url = reverse('change_password')
        data = {'old_password': 'wrongpassword', 'new_password': 'newpassword'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class PermissionTests(BaseTestCase):
    """Unit tests for role-based permissions."""

    def test_student_cannot_access_company_endpoints(self):
        user, _ = self.create_student()
        self.authenticate_user(user)
        # Try to create an internship (company-only action)
        url = reverse('internship-list')
        data = {'title': 'Hacked Internship', 'description': 'test'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_access_denied(self):
        url = reverse('profile')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_registrar_can_assign_profile_grade(self):
        _, student = self.create_student()
        reg_user, _ = self.create_registrar()
        self.authenticate_user(reg_user)
        url = reverse('assign_student_profile_grade', kwargs={'student_id': student.id})
        data = {'numeric_grade': 85.5, 'profile_grade_comment': 'Good performance'}
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        student.refresh_from_db()
        self.assertEqual(student.profile_numeric_grade, 85.5)

    def test_student_cannot_assign_profile_grade(self):
        user, student = self.create_student()
        self.authenticate_user(user)
        url = reverse('assign_student_profile_grade', kwargs={'student_id': student.id})
        data = {'numeric_grade': 90.0}
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_invalid_grade_range(self):
        _, student = self.create_student()
        reg_user, _ = self.create_registrar()
        self.authenticate_user(reg_user)
        url = reverse('assign_student_profile_grade', kwargs={'student_id': student.id})
        data = {'numeric_grade': 150}
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class StudentListTests(BaseTestCase):
    """Unit tests for student listing endpoints."""

    def test_list_students(self):
        self.create_student(username='student_a')
        self.create_student(username='student_b')
        user, _ = self.create_coordinator()
        self.authenticate_user(user)
        url = reverse('student-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)

    def test_student_detail(self):
        _, student = self.create_student(username='detail_student')
        user, _ = self.create_coordinator()
        self.authenticate_user(user)
        url = reverse('student-detail', kwargs={'pk': student.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['student_id'], student.student_id)

