from rest_framework import serializers
from .models import Notification, NotificationPreference, SystemAnnouncement
from users.serializers import UserSerializer

class NotificationSerializer(serializers.ModelSerializer):
    recipient = UserSerializer(read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'title', 'message', 'notification_type',
            'priority', 'is_read', 'created_at', 'read_at',
            'application', 'grade', 'report'
        ]
        read_only_fields = ['created_at', 'read_at']

class NotificationPreferenceSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = NotificationPreference
        fields = [
            'user', 'email_notifications', 'push_notifications',
            'application_updates', 'grade_updates', 'report_reminders',
            'new_internships'
        ]

class SystemAnnouncementSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = SystemAnnouncement
        fields = [
            'id', 'title', 'message', 'target_roles', 'is_active',
            'start_date', 'end_date', 'created_by', 'created_at'
        ]
        read_only_fields = ['created_at']
