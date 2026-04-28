from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='student',
            name='profile_grade_comment',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='student',
            name='profile_grade_updated_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='student',
            name='profile_letter_grade',
            field=models.CharField(blank=True, choices=[('A', 'A'), ('B', 'B'), ('C', 'C'), ('D', 'D'), ('F', 'F'), ('P', 'Pass'), ('NP', 'No Pass')], max_length=2, null=True),
        ),
        migrations.AddField(
            model_name='student',
            name='profile_numeric_grade',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True),
        ),
    ]
