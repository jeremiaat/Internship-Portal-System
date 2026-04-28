from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from .models import Notification, NotificationPreference
from internships.models import Application, Internship
from grades.models import Grade
from reports.models import Report

@receiver(post_save, sender=Application)
def create_application_notification(sender, instance, created, **kwargs):
    """Create notifications when applications are submitted or status changes"""
    if created:
        # New application submitted - notify student and company
        # Notify student
        try:
            preferences = NotificationPreference.objects.get(user=instance.student.user)
            if preferences.application_updates:
                notification = Notification.objects.create(
                    recipient=instance.student.user,
                    title='Application Submitted Successfully',
                    message=f'Your application for {instance.internship.title} at {instance.internship.company.company_name} has been submitted successfully.',
                    notification_type='application_status',
                    priority='medium',
                    application=instance
                )
        except NotificationPreference.DoesNotExist:
            # Create default notification if no preferences exist
            notification = Notification.objects.create(
                recipient=instance.student.user,
                title='Application Submitted Successfully',
                message=f'Your application for {instance.internship.title} at {instance.internship.company.company_name} has been submitted successfully.',
                notification_type='application_status',
                priority='medium',
                application=instance
            )
        
        # Notify company about new application
        try:
            company_preferences = NotificationPreference.objects.get(user=instance.internship.company.user)
            if company_preferences.application_updates:
                company_notification = Notification.objects.create(
                    recipient=instance.internship.company.user,
                    title='New Application Received',
                    message=f'{instance.student.user.first_name} {instance.student.user.last_name} has applied for {instance.internship.title}.',
                    notification_type='application_status',
                    priority='high',
                    application=instance
                )
        except NotificationPreference.DoesNotExist:
            # Create default notification for company
            company_notification = Notification.objects.create(
                recipient=instance.internship.company.user,
                title='New Application Received',
                message=f'{instance.student.user.first_name} {instance.student.user.last_name} has applied for {instance.internship.title}.',
                notification_type='application_status',
                priority='high',
                application=instance
            )
    else:
        # Status change - notify student
        old_status = Application.objects.filter(id=instance.id).values_list('status', flat=True).first()
        if old_status != instance.status:
            try:
                preferences = NotificationPreference.objects.get(user=instance.student.user)
                if preferences.application_updates:
                    notification = Notification.objects.create(
                        recipient=instance.student.user,
                        title=f'Application Status Updated',
                        message=f'Your application for {instance.internship.title} at {instance.internship.company.company_name} has been {instance.status}.',
                        notification_type='application_status',
                        priority='high' if instance.status == 'accepted' else 'medium',
                        application=instance
                    )
            except NotificationPreference.DoesNotExist:
                # Create default notification if no preferences exist
                notification = Notification.objects.create(
                    recipient=instance.student.user,
                    title=f'Application Status Updated',
                    message=f'Your application for {instance.internship.title} at {instance.internship.company.company_name} has been {instance.status}.',
                    notification_type='application_status',
                    priority='high' if instance.status == 'accepted' else 'medium',
                    application=instance
                )

@receiver(post_save, sender=Internship)
def create_internship_notification(sender, instance, created, **kwargs):
    """Create notifications for new internships"""
    if created and instance.status == 'active':
        # Notify all students who have new_internship preferences enabled
        from users.models import Student
        students = Student.objects.all()
        
        for student in students:
            try:
                preferences = NotificationPreference.objects.get(user=student.user)
                if preferences.new_internships:
                    # Check if internship matches student's department
                    if instance.department.lower() == student.department.lower():
                        notification = Notification.objects.create(
                            recipient=student.user,
                            title='New Internship Available',
                            message=f'A new internship "{instance.title}" at {instance.company.company_name} is now available in your department.',
                            notification_type='internship_available',
                            priority='medium',
                            application=None
                        )
            except NotificationPreference.DoesNotExist:
                # Create default notification for matching department
                if instance.department.lower() == student.department.lower():
                    notification = Notification.objects.create(
                        recipient=student.user,
                        title='New Internship Available',
                        message=f'A new internship "{instance.title}" at {instance.company.company_name} is now available in your department.',
                        notification_type='internship_available',
                        priority='medium',
                        application=None
                    )

@receiver(post_save, sender=Grade)
def create_grade_notification(sender, instance, created, **kwargs):
    """Create notifications when grades are posted"""
    try:
        preferences = NotificationPreference.objects.get(user=instance.student.user)
        if preferences.grade_updates:
            notification = Notification.objects.create(
                recipient=instance.student.user,
                title='Grade Posted',
                message=f'Your grade for {instance.application.internship.title} has been posted: {instance.letter_grade or instance.numeric_grade}',
                notification_type='grade_posted',
                priority='high',
                grade=instance
            )
    except NotificationPreference.DoesNotExist:
        # Create default notification
        notification = Notification.objects.create(
            recipient=instance.student.user,
            title='Grade Posted',
            message=f'Your grade for {instance.application.internship.title} has been posted: {instance.letter_grade or instance.numeric_grade}',
            notification_type='grade_posted',
            priority='high',
            grade=instance
        )

@receiver(post_save, sender=Report)
def create_report_notification(sender, instance, created, **kwargs):
    """Create notifications when report status changes"""
    if not created and instance.status == 'reviewed':
        # Notify student that report has been reviewed
        try:
            preferences = NotificationPreference.objects.get(user=instance.student.user)
            if preferences.report_reminders:
                notification = Notification.objects.create(
                    recipient=instance.student.user,
                    title='Report Reviewed',
                    message=f'Your {instance.report_type} report "{instance.title}" has been reviewed.',
                    notification_type='report_due',
                    priority='medium',
                    report=instance
                )
        except NotificationPreference.DoesNotExist:
            # Create default notification
            notification = Notification.objects.create(
                recipient=instance.student.user,
                title='Report Reviewed',
                message=f'Your {instance.report_type} report "{instance.title}" has been reviewed.',
                notification_type='report_due',
                priority='medium',
                report=instance
            )

def create_report_due_reminder():
    """Create report due reminders (to be called by scheduled task)"""
    from reports.models import Report
    from datetime import timedelta
    
    # Check for reports due in 3 days
    due_date = timezone.now() + timedelta(days=3)
    pending_reports = Report.objects.filter(
        status='draft',
        created_at__lte=timezone.now() - timedelta(days=7)  # Reports older than 7 days
    )
    
    for report in pending_reports:
        try:
            preferences = NotificationPreference.objects.get(user=report.student.user)
            if preferences.report_reminders:
                notification = Notification.objects.create(
                    recipient=report.student.user,
                    title='Report Due Reminder',
                    message=f'Your {report.report_type} report "{report.title}" is due soon. Please submit it.',
                    notification_type='report_due',
                    priority='medium',
                    report=report
                )
        except NotificationPreference.DoesNotExist:
            # Create default notification
            notification = Notification.objects.create(
                recipient=report.student.user,
                title='Report Due Reminder',
                message=f'Your {report.report_type} report "{report.title}" is due soon. Please submit it.',
                notification_type='report_due',
                priority='medium',
                report=report
            )
