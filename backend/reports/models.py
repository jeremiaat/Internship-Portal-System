from django.db import models

class Report(models.Model):
    REPORT_TYPE_CHOICES = [
        ('weekly', 'Weekly Report'),
        ('monthly', 'Monthly Report'),
        ('final', 'Final Report'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('reviewed', 'Reviewed'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    student = models.ForeignKey('users.Student', on_delete=models.CASCADE, related_name='reports')
    application = models.ForeignKey('internships.Application', on_delete=models.CASCADE, related_name='reports')
    report_type = models.CharField(max_length=20, choices=REPORT_TYPE_CHOICES)
    title = models.CharField(max_length=200)
    content = models.TextField()
    file = models.FileField(upload_to='reports/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'reports'

class Evaluation(models.Model):
    report = models.OneToOneField(Report, on_delete=models.CASCADE, related_name='evaluation')
    supervisor = models.ForeignKey('internships.Supervisor', on_delete=models.CASCADE)
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])  # 1-5 rating
    feedback = models.TextField()
    strengths = models.TextField(blank=True)
    areas_for_improvement = models.TextField(blank=True)
    evaluated_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'evaluations'
