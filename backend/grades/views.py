from rest_framework import generics, permissions, status, filters
from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from .models import Grade, GradeComponent, GradeAppeal
from .serializers import (
    GradeSerializer, GradeCreateSerializer, GradeUpdateSerializer,
    GradeAppealSerializer, GradeAppealCreateSerializer
)

class GradeListView(generics.ListAPIView):
    serializer_class = GradeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'letter_grade', 'student', 'application']
    ordering_fields = ['submission_date', 'approval_date']
    ordering = ['-submission_date']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return Grade.objects.filter(student=user.student_profile)
        elif user.role == 'coordinator':
            return Grade.objects.filter(application__internship__department=user.coordinator_profile.department)
        elif user.role == 'registrar':
            return Grade.objects.all()
        return Grade.objects.none()

class GradeDetailView(generics.RetrieveAPIView):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        # Check permissions based on user role
        if user.role == 'student' and obj.student.user != user:
            raise permissions.PermissionDenied("You can only view your own grades")
        return obj

class GradeCreateView(generics.CreateAPIView):
    serializer_class = GradeCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        user = self.request.user
        # Registrar is the owner of final grade assignment.
        if user.role != 'registrar':
            raise permissions.PermissionDenied("Only registrar users can assign grades")
        
        application = serializer.validated_data['application']
        
        # Check if grade already exists
        if Grade.objects.filter(application=application).exists():
            raise serializers.ValidationError("Grade already exists for this application")
        
        serializer.save(
            student=application.student,
            status='approved',
            approved_by=user.registrar_profile,
            approval_date=timezone.now()
        )

class GradeUpdateView(generics.UpdateAPIView):
    queryset = Grade.objects.all()
    serializer_class = GradeUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        # Registrar owns grade maintenance.
        if user.role != 'registrar':
            raise permissions.PermissionDenied("You don't have permission to update grades")
        return obj

@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def approve_grade(request, grade_id):
    grade = get_object_or_404(Grade, id=grade_id)
    user = request.user
    
    # Only registrars can approve grades
    if user.role != 'registrar':
        return Response({'error': 'Only registrars can approve grades'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    if grade.status != 'pending':
        return Response({'error': 'Only pending grades can be approved'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    grade.status = 'approved'
    grade.approved_by = user.registrar_profile
    grade.approval_date = timezone.now()
    grade.save()
    
    serializer = GradeSerializer(grade)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def reject_grade(request, grade_id):
    grade = get_object_or_404(Grade, id=grade_id)
    user = request.user
    
    # Only registrars can reject grades
    if user.role != 'registrar':
        return Response({'error': 'Only registrars can reject grades'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    if grade.status != 'pending':
        return Response({'error': 'Only pending grades can be rejected'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    grade.status = 'rejected'
    grade.approved_by = user.registrar_profile
    grade.approval_date = timezone.now()
    grade.comments = request.data.get('comments', grade.comments)
    grade.save()
    
    serializer = GradeSerializer(grade)
    return Response(serializer.data)

class GradeAppealListView(generics.ListAPIView):
    serializer_class = GradeAppealSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'grade']
    ordering_fields = ['submitted_at', 'review_date']
    ordering = ['-submitted_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return GradeAppeal.objects.filter(student=user.student_profile)
        elif user.role == 'registrar':
            return GradeAppeal.objects.all()
        return GradeAppeal.objects.none()

class GradeAppealDetailView(generics.RetrieveAPIView):
    queryset = GradeAppeal.objects.all()
    serializer_class = GradeAppealSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        # Check permissions based on user role
        if user.role == 'student' and obj.student.user != user:
            raise permissions.PermissionDenied("You can only view your own appeals")
        return obj

class GradeAppealCreateView(generics.CreateAPIView):
    serializer_class = GradeAppealCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        user = self.request.user
        # Only students can create appeals
        if user.role != 'student':
            raise permissions.PermissionDenied("Only students can create grade appeals")
        
        grade = serializer.validated_data['grade']
        
        # Check if the grade belongs to the student
        if grade.student != user.student_profile:
            raise permissions.PermissionDenied("You can only appeal your own grades")
        
        # Check if appeal already exists
        if GradeAppeal.objects.filter(grade=grade, student=user.student_profile).exists():
            raise serializers.ValidationError("Appeal already exists for this grade")
        
        serializer.save(student=user.student_profile)

@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def review_appeal(request, appeal_id):
    appeal = get_object_or_404(GradeAppeal, id=appeal_id)
    user = request.user
    
    # Only registrars can review appeals
    if user.role != 'registrar':
        return Response({'error': 'Only registrars can review appeals'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    if appeal.status != 'submitted':
        return Response({'error': 'Only submitted appeals can be reviewed'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    new_status = request.data.get('status')
    if new_status not in ['approved', 'rejected']:
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
    
    appeal.status = new_status
    appeal.reviewed_by = user.registrar_profile
    appeal.review_date = timezone.now()
    appeal.review_comments = request.data.get('review_comments', '')
    appeal.save()
    
    serializer = GradeAppealSerializer(appeal)
    return Response(serializer.data)

from django.utils import timezone
