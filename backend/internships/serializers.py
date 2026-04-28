from rest_framework import serializers
from .models import Internship, Application, Supervisor
from users.serializers import CompanySerializer, StudentSerializer

class InternshipSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    applications_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Internship
        fields = [
            'id', 'title', 'description', 'company', 'department',
            'location', 'start_date', 'end_date', 'application_deadline',
            'requirements', 'responsibilities', 'stipend', 'status',
            'created_at', 'updated_at', 'applications_count'
        ]
    
    def get_applications_count(self, obj):
        return obj.applications.count()

class InternshipCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Internship
        fields = [
            'title', 'description', 'department',
            'location', 'start_date', 'end_date', 'application_deadline',
            'requirements', 'responsibilities', 'stipend', 'status'
        ]

class ApplicationSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    internship = InternshipSerializer(read_only=True)
    internship_id = serializers.IntegerField(source='internship.id', read_only=True)
    student_id = serializers.IntegerField(source='student.id', read_only=True)
    has_grade = serializers.SerializerMethodField()
    
    class Meta:
        model = Application
        fields = [
            'id', 'student', 'internship', 'internship_id', 'student_id',
            'status', 'cover_letter', 'resume', 'applied_at', 'updated_at', 'has_grade'
        ]
        read_only_fields = ['applied_at', 'updated_at']

    def get_has_grade(self, obj):
        return hasattr(obj, 'grade')

class ApplicationCreateSerializer(serializers.ModelSerializer):
    internship_id = serializers.PrimaryKeyRelatedField(
        source='internship',
        queryset=Internship.objects.filter(status='active'),
        write_only=True
    )

    class Meta:
        model = Application
        fields = ['internship_id', 'cover_letter', 'resume']

class ApplicationUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ['status']

class SupervisorSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    company = CompanySerializer(read_only=True)
    internship = InternshipSerializer(read_only=True)
    
    class Meta:
        model = Supervisor
        fields = ['id', 'user', 'internship', 'company', 'is_primary']

class SupervisorCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supervisor
        fields = ['user', 'internship', 'company', 'is_primary']
