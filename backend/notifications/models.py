from django.db import models
from django.conf import settings

class Notification(models.Model):
    TYPE_CHOICES = [
        ('application_status', 'Application Status'),
        ('grade_posted', 'Grade Posted'),
        ('report_due', 'Report Due'),
        ('internship_available', 'Internship Available'),
        ('system_announcement', 'System Announcement'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Optional related objects
    application = models.ForeignKey('internships.Application', on_delete=models.CASCADE, null=True, blank=True)
    grade = models.ForeignKey('grades.Grade', on_delete=models.CASCADE, null=True, blank=True)
    report = models.ForeignKey('reports.Report', on_delete=models.CASCADE, null=True, blank=True)
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

class NotificationPreference(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notification_preferences')
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    application_updates = models.BooleanField(default=True)
    grade_updates = models.BooleanField(default=True)
    report_reminders = models.BooleanField(default=True)
    new_internships = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'notification_preferences'

class SystemAnnouncement(models.Model):
    title = models.CharField(max_length=200)
    message = models.TextField()
    target_roles = models.CharField(max_length=100)  # Comma-separated roles
    is_active = models.BooleanField(default=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'system_announcements'
