from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Student, Coordinator, Company, Registrar

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone', 'password']
        extra_kwargs = {'password': {'write_only': True}}
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user

class StudentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Student
        fields = [
            'id', 'user', 'student_id', 'department', 'year_of_study', 'gpa', 'credits_completed',
            'profile_numeric_grade', 'profile_letter_grade', 'profile_grade_comment', 'profile_grade_updated_at'
        ]

class StudentCreateSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    
    class Meta:
        model = Student
        fields = ['user', 'student_id', 'department', 'year_of_study', 'gpa', 'credits_completed']
    
    def create(self, validated_data):
        user_data = validated_data.pop('user')
        user_data['role'] = 'student'
        user = UserSerializer().create(user_data)
        student = Student.objects.create(user=user, **validated_data)
        return student

class CoordinatorSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Coordinator
        fields = ['id', 'user', 'department', 'employee_id']

class CoordinatorCreateSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    
    class Meta:
        model = Coordinator
        fields = ['user', 'department', 'employee_id']
    
    def create(self, validated_data):
        user_data = validated_data.pop('user')
        user_data['role'] = 'coordinator'
        user = UserSerializer().create(user_data)
        coordinator = Coordinator.objects.create(user=user, **validated_data)
        return coordinator

class CompanySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Company
        fields = ['id', 'user', 'company_name', 'industry', 'address', 'website', 'verification_status', 'verified_by', 'verified_at']

class CompanyCreateSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    
    class Meta:
        model = Company
        fields = ['user', 'company_name', 'industry', 'address', 'website']
    
    def create(self, validated_data):
        user_data = validated_data.pop('user')
        user_data['role'] = 'company'
        user = UserSerializer().create(user_data)
        company = Company.objects.create(user=user, **validated_data)
        return company

class RegistrarSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Registrar
        fields = ['id', 'user', 'employee_id', 'office_location']

class RegistrarCreateSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    
    class Meta:
        model = Registrar
        fields = ['user', 'employee_id', 'office_location']
    
    def create(self, validated_data):
        user_data = validated_data.pop('user')
        user_data['role'] = 'registrar'
        user = UserSerializer().create(user_data)
        registrar = Registrar.objects.create(user=user, **validated_data)
        return registrar

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
    
    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            data['user'] = user
            return data
        else:
            raise serializers.ValidationError('Must include username and password')

class UserProfileSerializer(serializers.ModelSerializer):
    profile_data = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone', 'profile_data']
    
    def get_profile_data(self, obj):
        if obj.role == 'student' and hasattr(obj, 'student_profile'):
            return StudentSerializer(obj.student_profile).data
        elif obj.role == 'coordinator' and hasattr(obj, 'coordinator_profile'):
            return CoordinatorSerializer(obj.coordinator_profile).data
        elif obj.role == 'company' and hasattr(obj, 'company_profile'):
            return CompanySerializer(obj.company_profile).data
        elif obj.role == 'registrar' and hasattr(obj, 'registrar_profile'):
            return RegistrarSerializer(obj.registrar_profile).data
        return None
