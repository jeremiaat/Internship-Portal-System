from rest_framework import generics, permissions, status, filters
from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from .models import Internship, Application, Supervisor
from .serializers import (
    InternshipSerializer, InternshipCreateSerializer,
    ApplicationSerializer, ApplicationCreateSerializer, ApplicationUpdateSerializer,
    SupervisorSerializer, SupervisorCreateSerializer
)

class InternshipListView(generics.ListAPIView):
    queryset = Internship.objects.all()
    serializer_class = InternshipSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['department', 'company', 'location', 'status']
    search_fields = ['title', 'description', 'company__company_name']
    ordering_fields = ['created_at', 'application_deadline', 'start_date']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        base_queryset = Internship.objects.select_related('company', 'company__user')

        if user.role == 'student':
            return base_queryset.filter(status='active')
        if user.role == 'company':
            return base_queryset.filter(company=user.company_profile)
        return base_queryset

class InternshipDetailView(generics.RetrieveAPIView):
    queryset = Internship.objects.all()
    serializer_class = InternshipSerializer
    permission_classes = [permissions.IsAuthenticated]

class InternshipCreateView(generics.CreateAPIView):
    queryset = Internship.objects.all()
    serializer_class = InternshipCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        # Only company users can create internships
        if self.request.user.role != 'company':
            raise permissions.PermissionDenied("Only company users can create internships")
        
        company = self.request.user.company_profile
        serializer.save(company=company)

class InternshipUpdateView(generics.UpdateAPIView):
    queryset = Internship.objects.all()
    serializer_class = InternshipCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        obj = super().get_object()
        if self.request.user.role != 'company':
            raise permissions.PermissionDenied("Only company users can update internships")
        if obj.company.user != self.request.user:
            raise permissions.PermissionDenied("You can only update your own internships")
        return obj

class InternshipDeleteView(generics.DestroyAPIView):
    queryset = Internship.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        obj = super().get_object()
        if self.request.user.role != 'company':
            raise permissions.PermissionDenied("Only company users can delete internships")
        if obj.company.user != self.request.user:
            raise permissions.PermissionDenied("You can only delete your own internships")
        return obj

class ApplicationListView(generics.ListAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'internship']
    ordering_fields = ['applied_at', 'updated_at']
    ordering = ['-applied_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return Application.objects.filter(student=user.student_profile)
        elif user.role == 'company':
            return Application.objects.filter(internship__company=user.company_profile)
        elif user.role == 'coordinator':
            return Application.objects.filter(internship__department=user.coordinator_profile.department)
        elif user.role == 'registrar':
            return Application.objects.all()
        return Application.objects.none()

class ApplicationDetailView(generics.RetrieveAPIView):
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        # Check permissions based on user role
        if user.role == 'student' and obj.student.user != user:
            raise permissions.PermissionDenied("You can only view your own applications")
        elif user.role == 'company' and obj.internship.company.user != user:
            raise permissions.PermissionDenied("You can only view applications for your internships")
        return obj

class ApplicationCreateView(generics.CreateAPIView):
    serializer_class = ApplicationCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        if self.request.user.role != 'student':
            raise permissions.PermissionDenied("Only students can apply for internships")
        
        student = self.request.user.student_profile
        internship = serializer.validated_data['internship']
        
        # Check if already applied
        if Application.objects.filter(student=student, internship=internship).exists():
            raise serializers.ValidationError("You have already applied for this internship")

        # Eligibility is reviewed by coordinator/registrar workflow after submission.
        serializer.save(student=student)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def apply_to_internship(request, internship_id):
    if request.user.role != 'student':
        return Response({'error': 'Only students can apply for internships'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    student = request.user.student_profile
    internship = get_object_or_404(Internship, id=internship_id)
    
    # Check if already applied
    if Application.objects.filter(student=student, internship=internship).exists():
        return Response({'error': 'You have already applied for this internship'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    application = Application.objects.create(
        student=student,
        internship=internship,
        cover_letter=request.data.get('cover_letter', ''),
        resume=request.FILES.get('resume')
    )
    
    serializer = ApplicationSerializer(application)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def update_application_status(request, application_id):
    application = get_object_or_404(Application, id=application_id)
    user = request.user
    
    # Check permissions
    if user.role == 'student':
        return Response({'error': 'Students cannot update application status'},
                       status=status.HTTP_403_FORBIDDEN)
    if user.role == 'company' and application.internship.company.user != user:
        return Response({'error': 'You can only update applications for your internships'}, 
                       status=status.HTTP_403_FORBIDDEN)
    elif user.role == 'coordinator' and application.internship.department != user.coordinator_profile.department:
        return Response({'error': 'You can only update applications in your department'}, 
                       status=status.HTTP_403_FORBIDDEN)
    elif user.role not in ['company', 'coordinator', 'registrar']:
        return Response({'error': 'You do not have permission to update applications'},
                       status=status.HTTP_403_FORBIDDEN)
    
    new_status = request.data.get('status')
    if new_status not in ['pending', 'reviewed', 'accepted', 'rejected', 'completed']:
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
    
    application.status = new_status
    application.save()
    
    serializer = ApplicationSerializer(application)
    return Response(serializer.data)

class SupervisorListView(generics.ListAPIView):
    queryset = Supervisor.objects.all()
    serializer_class = SupervisorSerializer
    permission_classes = [permissions.IsAuthenticated]

class SupervisorCreateView(generics.CreateAPIView):
    queryset = Supervisor.objects.all()
    serializer_class = SupervisorCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        if self.request.user.role not in ['company', 'coordinator']:
            raise permissions.PermissionDenied("Only company or coordinator users can assign supervisors")
        serializer.save()
