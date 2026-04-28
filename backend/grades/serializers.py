from rest_framework import serializers
from .models import Grade, GradeComponent, GradeAppeal
from internships.models import Application
from users.serializers import StudentSerializer, CoordinatorSerializer, RegistrarSerializer
from internships.serializers import ApplicationSerializer

class GradeComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradeComponent
        fields = ['id', 'component_name', 'weight', 'score', 'max_score']

class GradeSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    application = ApplicationSerializer(read_only=True)
    application_id = serializers.IntegerField(write_only=True)
    submitted_by = CoordinatorSerializer(read_only=True)
    approved_by = RegistrarSerializer(read_only=True)
    components = GradeComponentSerializer(many=True, read_only=True)
    appeals = serializers.SerializerMethodField()
    
    class Meta:
        model = Grade
        fields = [
            'id', 'student', 'application', 'application_id', 'letter_grade',
            'numeric_grade', 'credits', 'status', 'submitted_by', 'approved_by',
            'submission_date', 'approval_date', 'comments', 'components', 'appeals'
        ]
        read_only_fields = ['submission_date', 'approval_date']
    
    def get_appeals(self, obj):
        appeals = obj.appeals.all()
        return GradeAppealSerializer(appeals, many=True).data

class GradeCreateSerializer(serializers.ModelSerializer):
    application_id = serializers.PrimaryKeyRelatedField(
        source='application',
        queryset=Application.objects.all(),
        write_only=True
    )
    components = GradeComponentSerializer(many=True, required=False)
    
    class Meta:
        model = Grade
        fields = [
            'application_id', 'letter_grade', 'numeric_grade', 'credits',
            'status', 'comments', 'components'
        ]
    
    def create(self, validated_data):
        components_data = validated_data.pop('components', [])
        grade = Grade.objects.create(**validated_data)
        
        for component_data in components_data:
            GradeComponent.objects.create(grade=grade, **component_data)
        
        return grade

class GradeUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = ['letter_grade', 'numeric_grade', 'status', 'comments']

class GradeAppealSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    grade = GradeSerializer(read_only=True)
    grade_id = serializers.IntegerField(write_only=True)
    reviewed_by = RegistrarSerializer(read_only=True)
    
    class Meta:
        model = GradeAppeal
        fields = [
            'id', 'grade', 'grade_id', 'student', 'reason', 'desired_grade',
            'status', 'submitted_at', 'reviewed_by', 'review_date', 'review_comments'
        ]
        read_only_fields = ['submitted_at', 'review_date']

class GradeAppealCreateSerializer(serializers.ModelSerializer):
    grade_id = serializers.PrimaryKeyRelatedField(
        source='grade',
        queryset=Grade.objects.all(),
        write_only=True
    )

    class Meta:
        model = GradeAppeal
        fields = ['grade_id', 'reason', 'desired_grade']
