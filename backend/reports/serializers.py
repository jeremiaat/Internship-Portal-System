from rest_framework import serializers
from .models import Report, Evaluation
from internships.models import Application, Supervisor
from users.serializers import StudentSerializer
from internships.serializers import ApplicationSerializer

class ReportSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    application = ApplicationSerializer(read_only=True)
    application_id = serializers.IntegerField(write_only=True)
    evaluation = serializers.SerializerMethodField()
    
    class Meta:
        model = Report
        fields = [
            'id', 'student', 'application', 'application_id', 'report_type',
            'title', 'content', 'file', 'status', 'submitted_at', 'reviewed_at',
            'created_at', 'updated_at', 'evaluation'
        ]
        read_only_fields = ['submitted_at', 'reviewed_at', 'created_at', 'updated_at']
    
    def get_evaluation(self, obj):
        if hasattr(obj, 'evaluation'):
            from .serializers import EvaluationSerializer
            return EvaluationSerializer(obj.evaluation).data
        return None

class ReportCreateSerializer(serializers.ModelSerializer):
    application_id = serializers.PrimaryKeyRelatedField(
        source='application',
        queryset=Application.objects.all(),
        write_only=True
    )

    class Meta:
        model = Report
        fields = ['application_id', 'report_type', 'title', 'content', 'file']

class ReportUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ['title', 'content', 'file', 'status']

class EvaluationSerializer(serializers.ModelSerializer):
    supervisor = serializers.StringRelatedField(read_only=True)
    report = ReportSerializer(read_only=True)
    report_id = serializers.IntegerField(write_only=True)
    supervisor_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Evaluation
        fields = [
            'id', 'report', 'report_id', 'supervisor', 'supervisor_id',
            'rating', 'feedback', 'strengths', 'areas_for_improvement', 'evaluated_at'
        ]
        read_only_fields = ['evaluated_at']

class EvaluationCreateSerializer(serializers.ModelSerializer):
    report_id = serializers.PrimaryKeyRelatedField(
        source='report',
        queryset=Report.objects.all(),
        write_only=True
    )
    supervisor_id = serializers.PrimaryKeyRelatedField(
        source='supervisor',
        queryset=Supervisor.objects.all(),
        write_only=True
    )

    class Meta:
        model = Evaluation
        fields = ['report_id', 'supervisor_id', 'rating', 'feedback', 'strengths', 'areas_for_improvement']
