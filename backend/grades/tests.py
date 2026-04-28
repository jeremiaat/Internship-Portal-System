from django.urls import reverse
from rest_framework import status
from test_utils import BaseTestCase
from grades.models import Grade, GradeComponent, GradeAppeal


class GradeModelTests(BaseTestCase):
    """Unit tests for Grade, GradeComponent, and GradeAppeal models."""

    def test_grade_creation(self):
        _, student = self.create_student()
        _, company = self.create_company()
        internship = self.create_internship(company)
        application = self.create_application(student, internship)
        grade = self.create_grade(student, application, letter_grade='A', numeric_grade=95.0)
        self.assertEqual(grade.letter_grade, 'A')
        self.assertEqual(grade.numeric_grade, 95.0)
        self.assertEqual(grade.status, 'pending')

    def test_grade_component_creation(self):
        _, student = self.create_student()
        _, company = self.create_company()
        internship = self.create_internship(company)
        application = self.create_application(student, internship)
        grade = self.create_grade(student, application)
        component = GradeComponent.objects.create(
            grade=grade,
            component_name='Report Quality',
            weight=40.00,
            score=38.00,
            max_score=40.00
        )
        self.assertEqual(component.component_name, 'Report Quality')
        self.assertEqual(component.weight, 40.00)

    def test_grade_appeal_creation(self):
        _, student = self.create_student()
        _, company = self.create_company()
        internship = self.create_internship(company)
        application = self.create_application(student, internship)
        grade = self.create_grade(student, application)
        appeal = GradeAppeal.objects.create(
            grade=grade,
            student=student,
            reason='I believe my grade should be higher',
            desired_grade='A'
        )
        self.assertEqual(appeal.status, 'submitted')
        self.assertEqual(appeal.desired_grade, 'A')

    def test_duplicate_grade_prevention(self):
        _, student = self.create_student()
        _, company = self.create_company()
        internship = self.create_internship(company)
        application = self.create_application(student, internship)
        self.create_grade(student, application)
        with self.assertRaises(Exception):
            self.create_grade(student, application)

    def test_grade_status_transitions(self):
        _, student = self.create_student()
        _, company = self.create_company()
        internship = self.create_internship(company)
        application = self.create_application(student, internship)
        grade = self.create_grade(student, application, status='pending')
        grade.status = 'approved'
        grade.save()
        grade.refresh_from_db()
        self.assertEqual(grade.status, 'approved')


class GradeAPITests(BaseTestCase):
    """Unit tests for Grade API endpoints."""

    def test_list_grades_as_student(self):
        user, student = self.create_student()
        _, company = self.create_company()
        internship = self.create_internship(company)
        application = self.create_application(student, internship)
        self.create_grade(student, application)
        self.authenticate_user(user)
        url = reverse('grade-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data.get('results', response.data)), 1)

    def test_list_grades_as_registrar(self):
        _, student = self.create_student()
        _, company = self.create_company()
        internship = self.create_internship(company)
        application = self.create_application(student, internship)
        self.create_grade(student, application)
        reg_user, _ = self.create_registrar()
        self.authenticate_user(reg_user)
        url = reverse('grade-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data.get('results', response.data)), 1)

    def test_registrar_can_create_grade(self):
        _, student = self.create_student()
        _, company = self.create_company()
        internship = self.create_internship(company)
        application = self.create_application(student, internship)
        reg_user, _ = self.create_registrar()
        self.authenticate_user(reg_user)
        url = reverse('grade-list')
        data = {
            'application': application.id,
            'letter_grade': 'B',
            'numeric_grade': 85.0,
            'credits': 3
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['letter_grade'], 'B')

    def test_student_cannot_create_grade(self):
        user, student = self.create_student()
        _, company = self.create_company()
        internship = self.create_internship(company)
        application = self.create_application(student, internship)
        self.authenticate_user(user)
        url = reverse('grade-list')
        data = {
            'application': application.id,
            'letter_grade': 'A',
            'numeric_grade': 95.0
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_registrar_can_update_grade(self):
        _, student = self.create_student()
        _, company = self.create_company()
        internship = self.create_internship(company)
        application = self.create_application(student, internship)
        grade = self.create_grade(student, application, letter_grade='B')
        reg_user, _ = self.create_registrar()
        self.authenticate_user(reg_user)
        url = reverse('grade-detail', kwargs={'pk': grade.id})
        data = {'letter_grade': 'A', 'numeric_grade': 95.0}
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        grade.refresh_from_db()
        self.assertEqual(grade.letter_grade, 'A')

    def test_approve_grade(self):
        _, student = self.create_student()
        _, company = self.create_company()
        internship = self.create_internship(company)
        application = self.create_application(student, internship)
        grade = self.create_grade(student, application, status='pending')
        reg_user, _ = self.create_registrar()
        self.authenticate_user(reg_user)
        url = reverse('approve_grade', kwargs={'grade_id': grade.id})
        response = self.client.put(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        grade.refresh_from_db()
        self.assertEqual(grade.status, 'approved')
        self.assertIsNotNone(grade.approval_date)
