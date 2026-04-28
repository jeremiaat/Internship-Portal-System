from django.urls import path
from . import views

urlpatterns = [
    # Grade endpoints
    path('', views.GradeListView.as_view(), name='grade-list'),
    path('<int:pk>/', views.GradeDetailView.as_view(), name='grade-detail'),
    path('create/', views.GradeCreateView.as_view(), name='grade-create'),
    path('<int:pk>/update/', views.GradeUpdateView.as_view(), name='grade-update'),
    path('<int:grade_id>/approve/', views.approve_grade, name='approve-grade'),
    path('<int:grade_id>/reject/', views.reject_grade, name='reject-grade'),
    
    # Grade Appeal endpoints
    path('appeals/', views.GradeAppealListView.as_view(), name='grade-appeal-list'),
    path('appeals/<int:pk>/', views.GradeAppealDetailView.as_view(), name='grade-appeal-detail'),
    path('appeals/create/', views.GradeAppealCreateView.as_view(), name='grade-appeal-create'),
    path('appeals/<int:appeal_id>/review/', views.review_appeal, name='review-appeal'),
]
