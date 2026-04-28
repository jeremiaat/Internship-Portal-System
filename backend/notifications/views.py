from rest_framework import generics, permissions, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from .models import Notification, NotificationPreference, SystemAnnouncement
from .serializers import (
    NotificationSerializer, NotificationPreferenceSerializer, 
    SystemAnnouncementSerializer
)

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['notification_type', 'priority', 'is_read']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

class NotificationDetailView(generics.RetrieveAPIView):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_as_read(request, notification_id):
    notification = get_object_or_404(Notification, id=notification_id, recipient=request.user)
    
    if not notification.is_read:
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
    
    serializer = NotificationSerializer(notification)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_all_as_read(request):
    notifications = Notification.objects.filter(recipient=request.user, is_read=False)
    
    for notification in notifications:
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
    
    return Response({'message': 'All notifications marked as read'})

class NotificationPreferenceView(generics.RetrieveUpdateAPIView):
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        preference, created = NotificationPreference.objects.get_or_create(
            user=self.request.user,
            defaults={
                'email_notifications': True,
                'push_notifications': True,
                'application_updates': True,
                'grade_updates': True,
                'report_reminders': True,
                'new_internships': True,
            }
        )
        return preference

@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def update_preferences(request):
    preference, created = NotificationPreference.objects.get_or_create(
        user=request.user,
        defaults={
            'email_notifications': True,
            'push_notifications': True,
            'application_updates': True,
            'grade_updates': True,
            'report_reminders': True,
            'new_internships': True,
        }
    )
    
    # Update preferences
    for field in ['email_notifications', 'push_notifications', 'application_updates', 
                  'grade_updates', 'report_reminders', 'new_internships']:
        if field in request.data:
            setattr(preference, field, request.data[field])
    
    preference.save()
    
    serializer = NotificationPreferenceSerializer(preference)
    return Response(serializer.data)

class SystemAnnouncementListView(generics.ListAPIView):
    serializer_class = SystemAnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'start_date']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        now = timezone.now()
        
        # Filter by user role and active announcements
        queryset = SystemAnnouncement.objects.filter(
            is_active=True,
            start_date__lte=now
        ).filter(
            models.Q(end_date__isnull=True) | models.Q(end_date__gte=now)
        )
        
        # Filter by target roles
        user_role_announcements = []
        for announcement in queryset:
            target_roles = announcement.target_roles.split(',')
            if user.role in target_roles or 'all' in target_roles:
                user_role_announcements.append(announcement)
        
        return user_role_announcements

class SystemAnnouncementDetailView(generics.RetrieveAPIView):
    queryset = SystemAnnouncement.objects.all()
    serializer_class = SystemAnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]

class SystemAnnouncementCreateView(generics.CreateAPIView):
    serializer_class = SystemAnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        # Only coordinators and registrars can create announcements
        if self.request.user.role not in ['coordinator', 'registrar']:
            raise permissions.PermissionDenied("Only coordinators and registrars can create announcements")
        
        serializer.save(created_by=self.request.user)

from django.utils import timezone
from django.db import models
