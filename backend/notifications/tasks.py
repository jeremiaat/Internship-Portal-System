from celery import shared_task
from django.utils import timezone
from .signals import create_report_due_reminder

@shared_task
def send_report_due_reminders():
    """Scheduled task to send report due reminders"""
    create_report_due_reminder()
    return f"Report due reminders sent at {timezone.now()}"

@shared_task
def cleanup_old_notifications():
    """Clean up notifications older than 90 days"""
    from .models import Notification
    
    cutoff_date = timezone.now() - timezone.timedelta(days=90)
    old_notifications = Notification.objects.filter(created_at__lt=cutoff_date, is_read=True)
    count = old_notifications.count()
    old_notifications.delete()
    
    return f"Cleaned up {count} old notifications at {timezone.now()}"

@shared_task
def send_system_announcements():
    """Send system announcements to target users"""
    from .models import SystemAnnouncement, Notification, NotificationPreference
    from users.models import User
    
    now = timezone.now()
    announcements = SystemAnnouncement.objects.filter(
        is_active=True,
        start_date__lte=now
    ).filter(
        end_date__isnull=True | end_date__gte=now
    )
    
    notifications_created = 0
    
    for announcement in announcements:
        target_roles = announcement.target_roles.split(',')
        
        for role in target_roles:
            if role.strip() == 'all':
                users = User.objects.all()
            else:
                users = User.objects.filter(role=role.strip())
            
            for user in users:
                # Check if user already received this announcement
                existing_notification = Notification.objects.filter(
                    recipient=user,
                    title=announcement.title,
                    message=announcement.message,
                    notification_type='system_announcement'
                ).first()
                
                if not existing_notification:
                    try:
                        preferences = NotificationPreference.objects.get(user=user)
                        # Create notification for all users (system announcements are important)
                        notification = Notification.objects.create(
                            recipient=user,
                            title=announcement.title,
                            message=announcement.message,
                            notification_type='system_announcement',
                            priority='high' if announcement.priority == 'urgent' else 'medium'
                        )
                        notifications_created += 1
                    except NotificationPreference.DoesNotExist:
                        # Create default notification
                        notification = Notification.objects.create(
                            recipient=user,
                            title=announcement.title,
                            message=announcement.message,
                            notification_type='system_announcement',
                            priority='high' if announcement.priority == 'urgent' else 'medium'
                        )
                        notifications_created += 1
    
    return f"Sent {notifications_created} system announcements at {timezone.now()}"
