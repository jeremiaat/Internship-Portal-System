from rest_framework import generics, permissions, status, filters
from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from .models import Report, Evaluation
from .serializers import (
    ReportSerializer, ReportCreateSerializer, ReportUpdateSerializer,
    EvaluationSerializer, EvaluationCreateSerializer
)

class ReportListView(generics.ListAPIView):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['report_type', 'status', 'student', 'application']
    ordering_fields = ['created_at', 'submitted_at', 'reviewed_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return Report.objects.filter(student=user.student_profile)
        elif user.role == 'company':
            return Report.objects.filter(application__internship__company=user.company_profile)
        elif user.role == 'coordinator':
            return Report.objects.filter(student__department=user.coordinator_profile.department)
        elif user.role == 'registrar':
            return Report.objects.all()
        return Report.objects.none()

class ReportDetailView(generics.RetrieveAPIView):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        # Check permissions based on user role
        if user.role == 'student' and obj.student.user != user:
            raise permissions.PermissionDenied("You can only view your own reports")
        elif user.role == 'company' and obj.application.internship.company.user != user:
            raise permissions.PermissionDenied("You can only view reports for your internships")
        return obj

class ReportCreateView(generics.CreateAPIView):
    serializer_class = ReportCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        if self.request.user.role != 'student':
            raise permissions.PermissionDenied("Only students can create reports")
        
        student = self.request.user.student_profile
        application = serializer.validated_data['application']
        
        # Check if the student owns this application
        if application.student != student:
            raise permissions.PermissionDenied("You can only create reports for your own applications")
        
        serializer.save(student=student)

class ReportUpdateView(generics.UpdateAPIView):
    queryset = Report.objects.all()
    serializer_class = ReportUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        # Students can only update their own draft reports
        if user.role == 'student':
            if obj.student.user != user:
                raise permissions.PermissionDenied("You can only update your own reports")
            if obj.status != 'draft':
                raise permissions.PermissionDenied("You can only update draft reports")
        # Coordinators and companies can update status
        elif user.role in ['coordinator', 'company']:
            if user.role == 'company' and obj.application.internship.company.user != user:
                raise permissions.PermissionDenied("You can only update reports for your internships")
            if user.role == 'coordinator' and obj.student.department != user.coordinator_profile.department:
                raise permissions.PermissionDenied("You can only update reports in your department")
        return obj

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_report(request, report_id):
    report = get_object_or_404(Report, id=report_id)
    user = request.user
    
    # Only students can submit their own reports
    if user.role != 'student' or report.student.user != user:
        return Response({'error': 'You can only submit your own reports'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    if report.status != 'draft':
        return Response({'error': 'Only draft reports can be submitted'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    report.status = 'submitted'
    report.submitted_at = timezone.now()
    report.save()
    
    serializer = ReportSerializer(report)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_report_file(request, report_id):
    report = get_object_or_404(Report, id=report_id)
    user = request.user
    
    # Only students can upload files to their own reports
    if user.role != 'student' or report.student.user != user:
        return Response({'error': 'You can only upload files to your own reports'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    if 'file' not in request.FILES:
        return Response({'error': 'No file provided'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    report.file = request.FILES['file']
    report.save()
    
    serializer = ReportSerializer(report)
    return Response(serializer.data)

class EvaluationListView(generics.ListAPIView):
    queryset = Evaluation.objects.all()
    serializer_class = EvaluationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['rating', 'supervisor', 'report']
    ordering_fields = ['evaluated_at']
    ordering = ['-evaluated_at']

class EvaluationDetailView(generics.RetrieveAPIView):
    queryset = Evaluation.objects.all()
    serializer_class = EvaluationSerializer
    permission_classes = [permissions.IsAuthenticated]

class EvaluationCreateView(generics.CreateAPIView):
    serializer_class = EvaluationCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        user = self.request.user
        # Only supervisors, coordinators, or company users can create evaluations
        if user.role not in ['company', 'coordinator']:
            raise permissions.PermissionDenied("Only authorized users can create evaluations")
        
        report = serializer.validated_data['report']
        
        # Check if evaluation already exists
        if Evaluation.objects.filter(report=report).exists():
            raise serializers.ValidationError("Evaluation already exists for this report")
        
        serializer.save()

from django.utils import timezone
