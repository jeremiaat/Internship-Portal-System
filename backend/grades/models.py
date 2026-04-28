from django.db import models

class Grade(models.Model):
    GRADE_CHOICES = [
        ('A', 'A'),
        ('B', 'B'),
        ('C', 'C'),
        ('D', 'D'),
        ('F', 'F'),
        ('P', 'Pass'),
        ('NP', 'No Pass'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    student = models.ForeignKey('users.Student', on_delete=models.CASCADE, related_name='grades')
    application = models.OneToOneField('internships.Application', on_delete=models.CASCADE, related_name='grade')
    letter_grade = models.CharField(max_length=2, choices=GRADE_CHOICES, null=True, blank=True)
    numeric_grade = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    credits = models.IntegerField(default=3)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    submitted_by = models.ForeignKey('users.Coordinator', on_delete=models.SET_NULL, null=True, blank=True)
    approved_by = models.ForeignKey('users.Registrar', on_delete=models.SET_NULL, null=True, blank=True)
    submission_date = models.DateTimeField(auto_now_add=True)
    approval_date = models.DateTimeField(null=True, blank=True)
    comments = models.TextField(blank=True)
    
    class Meta:
        db_table = 'grades'

class GradeComponent(models.Model):
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE, related_name='components')
    component_name = models.CharField(max_length=100)  # e.g., "Report Quality", "Performance", "Attendance"
    weight = models.DecimalField(max_digits=5, decimal_places=2)  # percentage weight
    score = models.DecimalField(max_digits=5, decimal_places=2)
    max_score = models.DecimalField(max_digits=5, decimal_places=2)
    
    class Meta:
        db_table = 'grade_components'

class GradeAppeal(models.Model):
    STATUS_CHOICES = [
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE, related_name='appeals')
    student = models.ForeignKey('users.Student', on_delete=models.CASCADE)
    reason = models.TextField()
    desired_grade = models.CharField(max_length=2, choices=Grade.GRADE_CHOICES, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='submitted')
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey('users.Registrar', on_delete=models.SET_NULL, null=True, blank=True)
    review_date = models.DateTimeField(null=True, blank=True)
    review_comments = models.TextField(blank=True)
    
    class Meta:
        db_table = 'grade_appeals'
