from django.contrib.auth import get_user_model
from .models import Notification, NotificationPreference
from django.utils import timezone

User = get_user_model()

class NotificationService:
    """Service class for creating and managing notifications"""
    
    @staticmethod
    def create_notification(user, title, message, notification_type='system_announcement', 
                          priority='medium', application=None, grade=None, report=None):
        """Create a notification for a user"""
        try:
            preferences = NotificationPreference.objects.get(user=user)
            
            # Check if user has this type of notification enabled
            if notification_type == 'application_status' and not preferences.application_updates:
                return None
            elif notification_type == 'grade_posted' and not preferences.grade_updates:
                return None
            elif notification_type == 'report_due' and not preferences.report_reminders:
                return None
            elif notification_type == 'internship_available' and not preferences.new_internships:
                return None
            
            notification = Notification.objects.create(
                recipient=user,
                title=title,
                message=message,
                notification_type=notification_type,
                priority=priority,
                application=application,
                grade=grade,
                report=report
            )
            return notification
            
        except NotificationPreference.DoesNotExist:
            # Create default notification if no preferences exist
            notification = Notification.objects.create(
                recipient=user,
                title=title,
                message=message,
                notification_type=notification_type,
                priority=priority,
                application=application,
                grade=grade,
                report=report
            )
            return notification
    
    @staticmethod
    def create_bulk_notifications(users, title, message, notification_type='system_announcement', 
                                priority='medium'):
        """Create notifications for multiple users"""
        notifications = []
        
        for user in users:
            notification = NotificationService.create_notification(
                user=user,
                title=title,
                message=message,
                notification_type=notification_type,
                priority=priority
            )
            if notification:
                notifications.append(notification)
        
        return notifications
    
    @staticmethod
    def notify_role(role, title, message, notification_type='system_announcement', priority='medium'):
        """Create notifications for all users with a specific role"""
        users = User.objects.filter(role=role)
        return NotificationService.create_bulk_notifications(
            users=users,
            title=title,
            message=message,
            notification_type=notification_type,
            priority=priority
        )
    
    @staticmethod
    def notify_students_by_department(department, title, message, notification_type='internship_available', 
                                     priority='medium'):
        """Create notifications for students in a specific department"""
        from users.models import Student
        students = Student.objects.filter(department__iexact=department)
        users = [student.user for student in students]
        
        return NotificationService.create_bulk_notifications(
            users=users,
            title=title,
            message=message,
            notification_type=notification_type,
            priority=priority
        )
    
    @staticmethod
    def mark_as_read(notification_id, user):
        """Mark a notification as read for a user"""
        try:
            notification = Notification.objects.get(id=notification_id, recipient=user)
            if not notification.is_read:
                notification.is_read = True
                notification.read_at = timezone.now()
                notification.save()
            return True
        except Notification.DoesNotExist:
            return False
    
    @staticmethod
    def mark_all_as_read(user):
        """Mark all notifications as read for a user"""
        count = Notification.objects.filter(recipient=user, is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )
        return count
    
    @staticmethod
    def get_unread_count(user):
        """Get unread notification count for a user"""
        return Notification.objects.filter(recipient=user, is_read=False).count()
    
    @staticmethod
    def get_recent_notifications(user, limit=10):
        """Get recent notifications for a user"""
        return Notification.objects.filter(recipient=user).order_by('-created_at')[:limit]
    
    @staticmethod
    def cleanup_old_notifications(days=90):
        """Clean up old read notifications"""
        cutoff_date = timezone.now() - timezone.timedelta(days=days)
        count = Notification.objects.filter(
            created_at__lt=cutoff_date, 
            is_read=True
        ).delete()[0]
        return count
