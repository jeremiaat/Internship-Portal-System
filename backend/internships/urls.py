from django.urls import path
from . import views

urlpatterns = [
    # Internship endpoints
    path('', views.InternshipListView.as_view(), name='internship-list'),
    path('<int:pk>/', views.InternshipDetailView.as_view(), name='internship-detail'),
    path('create/', views.InternshipCreateView.as_view(), name='internship-create'),
    path('<int:pk>/update/', views.InternshipUpdateView.as_view(), name='internship-update'),
    path('<int:pk>/delete/', views.InternshipDeleteView.as_view(), name='internship-delete'),
    path('<int:internship_id>/apply/', views.apply_to_internship, name='apply-to-internship'),
    
    # Application endpoints
    path('applications/', views.ApplicationListView.as_view(), name='application-list'),
    path('applications/<int:pk>/', views.ApplicationDetailView.as_view(), name='application-detail'),
    path('applications/create/', views.ApplicationCreateView.as_view(), name='application-create'),
    path('applications/<int:application_id>/status/', views.update_application_status, name='update-application-status'),
    
    # Supervisor endpoints
    path('supervisors/', views.SupervisorListView.as_view(), name='supervisor-list'),
]
