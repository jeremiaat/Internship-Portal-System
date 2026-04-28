from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('coordinator', 'Coordinator'),
        ('company', 'Company'),
        ('registrar', 'Registrar'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    phone = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'

class Student(models.Model):
    PROFILE_GRADE_CHOICES = [
        ('A', 'A'),
        ('B', 'B'),
        ('C', 'C'),
        ('D', 'D'),
        ('F', 'F'),
        ('P', 'Pass'),
        ('NP', 'No Pass'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    student_id = models.CharField(max_length=20, unique=True)
    department = models.CharField(max_length=100)
    year_of_study = models.IntegerField()
    gpa = models.DecimalField(max_digits=3, decimal_places=2)
    credits_completed = models.IntegerField(default=0)
    profile_numeric_grade = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    profile_letter_grade = models.CharField(max_length=2, choices=PROFILE_GRADE_CHOICES, null=True, blank=True)
    profile_grade_comment = models.TextField(blank=True)
    profile_grade_updated_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'students'

class Coordinator(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='coordinator_profile')
    department = models.CharField(max_length=100)
    employee_id = models.CharField(max_length=20, unique=True)
    
    class Meta:
        db_table = 'coordinators'

class Company(models.Model):
    VERIFICATION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='company_profile')
    company_name = models.CharField(max_length=200)
    industry = models.CharField(max_length=100)
    address = models.TextField()
    website = models.URLField(blank=True, null=True)
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_STATUS_CHOICES, default='pending')
    verified_by = models.ForeignKey('Coordinator', on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_companies')
    verified_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'companies'

class Registrar(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='registrar_profile')
    employee_id = models.CharField(max_length=20, unique=True)
    office_location = models.CharField(max_length=100)
    
    class Meta:
        db_table = 'registrars'
