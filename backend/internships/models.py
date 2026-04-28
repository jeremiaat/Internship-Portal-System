from django.db import models
from django.conf import settings

class Internship(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('closed', 'Closed'),
        ('draft', 'Draft'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    company = models.ForeignKey('users.Company', on_delete=models.CASCADE, related_name='internships')
    department = models.CharField(max_length=100)
    location = models.CharField(max_length=200)
    start_date = models.DateField()
    end_date = models.DateField()
    application_deadline = models.DateField()
    requirements = models.TextField()
    responsibilities = models.TextField()
    stipend = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'internships'

class Application(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('reviewed', 'Reviewed'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    ]
    
    student = models.ForeignKey('users.Student', on_delete=models.CASCADE, related_name='applications')
    internship = models.ForeignKey(Internship, on_delete=models.CASCADE, related_name='applications')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    cover_letter = models.TextField()
    resume = models.FileField(upload_to='resumes/', null=True, blank=True)
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'applications'
        unique_together = ['student', 'internship']

class Supervisor(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    internship = models.ForeignKey(Internship, on_delete=models.CASCADE, related_name='supervisors')
    company = models.ForeignKey('users.Company', on_delete=models.CASCADE)
    is_primary = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'supervisors'
