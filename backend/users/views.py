from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import User, Student, Coordinator, Company, Registrar
from .serializers import (
    UserSerializer, StudentSerializer, StudentCreateSerializer,
    CoordinatorSerializer, CoordinatorCreateSerializer,
    CompanySerializer, CompanyCreateSerializer,
    RegistrarSerializer, RegistrarCreateSerializer,
    LoginSerializer, UserProfileSerializer
)

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register(request):
    role = request.data.get('role', 'student')
    
    # Extract user data from request
    user_data = {
        'username': request.data.get('username'),
        'email': request.data.get('email'),
        'first_name': request.data.get('first_name'),
        'last_name': request.data.get('last_name'),
        'phone': request.data.get('phone', ''),
        'password': request.data.get('password'),
        'role': role
    }
    
    # Validate user data first
    user_serializer = UserSerializer(data=user_data)
    if not user_serializer.is_valid():
        return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # Create user
    user = user_serializer.save()
    
    # Create role-specific profile with minimal required data
    try:
        if role == 'student':
            Student.objects.create(
                user=user,
                student_id=f"STU{user.id:06d}",
                department='Computer Science',
                year_of_study=1,
                gpa=0.0,
                credits_completed=0
            )
        elif role == 'coordinator':
            Coordinator.objects.create(
                user=user,
                employee_id=f"COORD{user.id:06d}",
                department='Computer Science'
            )
        elif role == 'company':
            Company.objects.create(
                user=user,
                company_name=request.data.get('company_name', f"Company {user.id}"),
                industry='Technology',
                address='',
                website=''
            )
        elif role == 'registrar':
            Registrar.objects.create(
                user=user,
                employee_id=f"REG{user.id:06d}",
                office_location='Main Office'
            )
        
        # Generate tokens
        tokens = get_tokens_for_user(user)
        
        return Response({
            'user': UserProfileSerializer(user).data,
            'access': tokens['access'],
            'refresh': tokens['refresh']
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        # If profile creation fails, delete the user and return error
        user.delete()
        return Response({'error': f'Failed to create profile: {str(e)}'}, 
                       status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        tokens = get_tokens_for_user(user)
        
        return Response({
            'user': UserProfileSerializer(user).data,
            'access': tokens['access'],
            'refresh': tokens['refresh']
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def logout(request):
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'message': 'Successfully logged out'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def profile(request):
    serializer = UserProfileSerializer(request.user)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def update_profile(request):
    user = request.user
    data = request.data
    
    # Update user fields
    if 'email' in data:
        user.email = data['email']
    if 'first_name' in data:
        user.first_name = data['first_name']
    if 'last_name' in data:
        user.last_name = data['last_name']
    if 'phone' in data:
        user.phone = data['phone']
    
    user.save()
    
    # Update profile-specific fields
    if user.role == 'student' and hasattr(user, 'student_profile'):
        student = user.student_profile
        if 'department' in data:
            student.department = data['department']
        if 'year_of_study' in data:
            student.year_of_study = data['year_of_study']
        student.save()
    elif user.role == 'coordinator' and hasattr(user, 'coordinator_profile'):
        coordinator = user.coordinator_profile
        if 'department' in data:
            coordinator.department = data['department']
        coordinator.save()
    elif user.role == 'company' and hasattr(user, 'company_profile'):
        company = user.company_profile
        if 'company_name' in data:
            company.company_name = data['company_name']
        if 'industry' in data:
            company.industry = data['industry']
        if 'address' in data:
            company.address = data['address']
        if 'website' in data:
            company.website = data['website']
        company.save()
    
    serializer = UserProfileSerializer(user)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    
    if not old_password or not new_password:
        return Response({'error': 'Both old_password and new_password are required'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    if not user.check_password(old_password):
        return Response({'error': 'Invalid old password'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    user.set_password(new_password)
    user.save()
    
    return Response({'message': 'Password changed successfully'}, 
                   status=status.HTTP_200_OK)

class StudentListView(generics.ListAPIView):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

class StudentDetailView(generics.RetrieveAPIView):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]

class CompanyListView(generics.ListAPIView):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticated]

class CompanyDetailView(generics.RetrieveAPIView):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticated]

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def approve_company(request, company_id):
    company = get_object_or_404(Company, id=company_id)
    user = request.user
    
    # Only coordinators can approve companies
    if user.role != 'coordinator':
        return Response({'error': 'Only coordinators can approve companies'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    action = request.data.get('action')
    if action not in ['approve', 'reject']:
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
    
    if company.verification_status != 'pending':
        return Response({'error': 'Company has already been processed'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    company.verification_status = 'approved' if action == 'approve' else 'rejected'
    if hasattr(user, 'coordinator_profile'):
        company.verified_by = user.coordinator_profile
    company.verified_at = timezone.now()
    company.save()
    
    serializer = CompanySerializer(company)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def assign_student_profile_grade(request, student_id):
    user = request.user
    if user.role != 'registrar':
        return Response({'error': 'Only registrar users can assign student profile grades'},
                        status=status.HTTP_403_FORBIDDEN)

    student = Student.objects.filter(id=student_id).first()
    if not student:
        return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)

    gpa = request.data.get('gpa')

    if gpa in [None, '']:
        return Response({'error': 'gpa is required'},
                        status=status.HTTP_400_BAD_REQUEST)
    try:
        gpa = float(gpa)
    except (TypeError, ValueError):
        return Response({'error': 'gpa must be a valid decimal number'},
                        status=status.HTTP_400_BAD_REQUEST)
    if gpa < 0 or gpa > 4:
        return Response({'error': 'gpa must be between 0 and 4'},
                        status=status.HTTP_400_BAD_REQUEST)

    student.gpa = gpa
    student.profile_grade_updated_at = timezone.now()
    student.save()

    return Response(StudentSerializer(student).data, status=status.HTTP_200_OK)
