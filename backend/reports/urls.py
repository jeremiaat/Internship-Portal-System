from django.urls import path
from . import views

urlpatterns = [
    # Report endpoints
    path('', views.ReportListView.as_view(), name='report-list'),
    path('<int:pk>/', views.ReportDetailView.as_view(), name='report-detail'),
    path('create/', views.ReportCreateView.as_view(), name='report-create'),
    path('<int:pk>/update/', views.ReportUpdateView.as_view(), name='report-update'),
    path('<int:report_id>/submit/', views.submit_report, name='submit-report'),
    path('<int:report_id>/upload-file/', views.upload_report_file, name='upload-report-file'),
    
    # Evaluation endpoints
    path('evaluations/', views.EvaluationListView.as_view(), name='evaluation-list'),
    path('evaluations/<int:pk>/', views.EvaluationDetailView.as_view(), name='evaluation-detail'),
    path('evaluations/create/', views.EvaluationCreateView.as_view(), name='evaluation-create'),
]
