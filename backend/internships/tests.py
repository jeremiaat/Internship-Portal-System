import datetime
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from test_utils import BaseTestCase
from internships.models import Internship, Application, Supervisor


class InternshipModelTests(BaseTestCase):
    """Unit tests for Internship and Application models."""

    def test_internship_creation(self):
        _, company = self.create_company()
        internship = self.create_internship(company, title='Backend Intern')
        self.assertEqual(internship.title, 'Backend Intern')
        self.assertEqual(internship.status, 'active')
        self.assertEqual(internship.company, company)

    def test_application_creation(self):
        _, student = self.create_student()
        _, company = self.create_company()
        internship = self.create_internship(company)
        application = self.create_application(student, internship)
        self.assertEqual(application.student, student)
        self.assertEqual(application.internship, internship)
        self.assertEqual(application.status, 'pending')

    def test_duplicate_application_prevention(self):
        _, student = self.create_student()
        _, company = self.create_company()
        internship = self.create_internship(company)
        self.create_application(student, internship)
        with self.assertRaises(Exception):
            self.create_application(student, internship)

    def test_internship_status_choices(self):
        _, company = self.create_company()
        for status_val in ['active', 'closed', 'draft']:
            internship = self.create_internship(company, status=status_val, title=f'Intern-{status_val}')
            self.assertEqual(internship.status, status_val)

    def test_application_status_workflow(self):
        _, student = self.create_student()
        _, company = self.create_company()
        internship = self.create_internship(company)
        application = self.create_application(student, internship, status='pending')
        for new_status in ['reviewed', 'accepted', 'rejected', 'completed']:
            application.status = new_status
            application.save()
            application.refresh_from_db()
            self.assertEqual(application.status, new_status)

    def test_internship_applications_count(self):
        _, student1 = self.create_student(username='s1')
        _, student2 = self.create_student(username='s2')
        _, company = self.create_company()
        internship = self.create_internship(company)
        self.create_application(student1, internship)
        self.create_application(student2, internship)
        self.assertEqual(internship.applications.count(), 2)


class InternshipAPITests(BaseTestCase):
    """Unit tests for Internship API endpoints."""

    def test_list_internships_as_student(self):
        _, company = self.create_company()
        self.create_internship(company, title='Visible Internship')
        self.create_internship(company, title='Closed Internship', status='closed')
        user, _ = self.create_student()
        self.authenticate_user(user)
        url = reverse('internship-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Students should only see active internships
        titles = [i['title'] for i in response.data.get('results', response.data)]
        self.assertIn('Visible Internship', titles)
        self.assertNotIn('Closed Internship', titles)

    def test_list_internships_as_company(self):
        _, company = self.create_company()
        self.create_internship(company, title='My Internship')
        user, _ = self.create_student()
        _, other_company = self.create_company(username='other_company')
        self.create_internship(other_company, title='Other Internship')
        self.authenticate_user(company.user)
        url = reverse('internship-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [i['title'] for i in response.data.get('results', response.data)]
        self.assertIn('My Internship', titles)
        self.assertNotIn('Other Internship', titles)

    def test_create_internship_as_company(self):
        _, company = self.create_company()
        self.authenticate_user(company.user)
        url = reverse('internship-list')
        data = {
            'title': 'New Internship',
            'description': 'Exciting opportunity',
            'department': 'Computer Science',
            'location': 'Remote',
            'start_date': str(timezone.now().date() + datetime.timedelta(days=30)),
            'end_date': str(timezone.now().date() + datetime.timedelta(days=120)),
            'application_deadline': str(timezone.now().date() + datetime.timedelta(days=15)),
            'requirements': 'Python',
            'responsibilities': 'Code',
            'stipend': '3000.00'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'New Internship')

    def test_student_cannot_create_internship(self):
        user, _ = self.create_student()
        self.authenticate_user(user)
        url = reverse('internship-list')
        data = {'title': 'Hacked', 'description': 'test'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_own_internship(self):
        _, company = self.create_company()
        internship = self.create_internship(company)
        self.authenticate_user(company.user)
        url = reverse('internship-detail', kwargs={'pk': internship.id})
        data = {'title': 'Updated Title', 'description': 'Updated'}
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        internship.refresh_from_db()
        self.assertEqual(internship.title, 'Updated Title')

    def test_company_cannot_update_other_internship(self):
        _, company1 = self.create_company(username='c1')
        _, company2 = self.create_company(username='c2')
        internship = self.create_internship(company1)
        self.authenticate_user(company2.user)
        url = reverse('internship-detail', kwargs={'pk': internship.id})
        data = {'title': 'Hacked'}
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_internship(self):
        _, company = self.create_company()
        internship = self.create_internship(company)
        self.authenticate_user(company.user)
        url = reverse('internship-detail', kwargs={'pk': internship.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Internship.objects.filter(id=internship.id).exists())


class ApplicationAPITests(BaseTestCase):
    """Unit tests for Application API endpoints."""

    def test_student_can_apply(self):
        user, student = self.create_student()
        _, company = self.create_company()
        internship = self.create_internship(company)
        self.authenticate_user(user)
        url = reverse('apply_to_internship', kwargs={'internship_id': internship.id})
        data = {'cover_letter': 'I want this internship'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'pending')

    def test_student_cannot_apply_twice(self):
        user, student = self.create_student()
        _, company = self.create_company()
        internship = self.create_internship(company)
        self.create_application(student, internship)
        self.authenticate_user(user)
        url = reverse('apply_to_internship', kwargs={'internship_id': internship.id})
        data = {'cover_letter': 'Second attempt'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_company_cannot_apply(self):
        _, company = self.create_company()
        _, other_company = self.create_company(username='other')
        internship = self.create_internship(other_company)
        self.authenticate_user(company.user)
        url = reverse('apply_to_internship', kwargs={'internship_id': internship.id})
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_applications_as_student(self):
        user, student = self.create_student()
        _, company = self.create_company()
        internship = self.create_internship(company)
        self.create_application(student, internship)
        self.authenticate_user(user)
        url = reverse('application-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data.get('results', response.data)), 1)

    def test_list_applications_as_company(self):
        _, student = self.create_student()
        _, company = self.create_company()
        internship = self.create_internship(company)
        self.create_application(student, internship)
        self.authenticate_user(company.user)
        url = reverse('application-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data.get('results', response.data)), 1)

    def test_company_can_update_application_status(self):
        _, student = self.create_student()
        _, company = self.create_company()
        internship = self.create_internship(company)
        application = self.create_application(student, internship)
        self.authenticate_user(company.user)
        url = reverse('update_application_status', kwargs={'application_id': application.id})
        data = {'status': 'accepted'}
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        application.refresh_from_db()
        self.assertEqual(application.status, 'accepted')

    def test_student_cannot_update_application_status(self):
        user, student = self.create_student()
        _, company = self.create_company()
        internship = self.create_internship(company)
        application = self.create_application(student, internship)
        self.authenticate_user(user)
        url = reverse('update_application_status', kwargs={'application_id': application.id})
        data = {'status': 'accepted'}
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_invalid_status_update(self):
        _, student = self.create_student()
        _, company = self.create_company()
        internship = self.create_internship(company)
        application = self.create_application(student, internship)
        self.authenticate_user(company.user)
        url = reverse('update_application_status', kwargs={'application_id': application.id})
        data = {'status': 'invalid_status'}
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_application_detail_permissions(self):
        user, student = self.create_student()
        _, company = self.create_company()
        internship = self.create_internship(company)
        application = self.create_application(student, internship)
        # Student can view own application
        self.authenticate_user(user)
        url = reverse('application-detail', kwargs={'pk': application.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Another student cannot view
        other_user, _ = self.create_student(username='other')
        self.authenticate_user(other_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class SupervisorAPITests(BaseTestCase):
    """Unit tests for Supervisor API endpoints."""

    def test_create_supervisor(self):
        _, company = self.create_company()
        user, coordinator = self.create_coordinator()
        internship = self.create_internship(company)
        self.authenticate_user(user)
        url = reverse('supervisor-list')
        data = {
            'user': company.user.id,
            'internship': internship.id,
            'company': company.id,
            'is_primary': True
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Supervisor.objects.filter(internship=internship).exists())

    def test_student_cannot_create_supervisor(self):
        user, _ = self.create_student()
        _, company = self.create_company()
        internship = self.create_internship(company)
        self.authenticate_user(user)
        url = reverse('supervisor-list')
        data = {
            'user': company.user.id,
            'internship': internship.id,
            'company': company.id,
            'is_primary': True
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_supervisors(self):
        _, company = self.create_company()
        user, _ = self.create_coordinator()
        internship = self.create_internship(company)
        Supervisor.objects.create(user=company.user, internship=internship, company=company)
        self.authenticate_user(user)
        url = reverse('supervisor-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

