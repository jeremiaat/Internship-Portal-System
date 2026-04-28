from django.urls import path
from . import views

urlpatterns = [
    # Notification endpoints
    path('', views.NotificationListView.as_view(), name='notification-list'),
    path('<int:pk>/', views.NotificationDetailView.as_view(), name='notification-detail'),
    path('<int:notification_id>/mark-read/', views.mark_as_read, name='mark-notification-read'),
    path('mark-all-read/', views.mark_all_as_read, name='mark-all-notifications-read'),
    
    # Notification Preference endpoints
    path('preferences/', views.NotificationPreferenceView.as_view(), name='notification-preferences'),
    path('preferences/update/', views.update_preferences, name='update-notification-preferences'),
    
    # System Announcement endpoints
    path('announcements/', views.SystemAnnouncementListView.as_view(), name='announcement-list'),
    path('announcements/<int:pk>/', views.SystemAnnouncementDetailView.as_view(), name='announcement-detail'),
    path('announcements/create/', views.SystemAnnouncementCreateView.as_view(), name='announcement-create'),
]
