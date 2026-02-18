import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('concerts', '0006_paymenttransaction_ticket'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.CreateModel(
                    name='Concert',
                    fields=[
                        ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                        ('title', models.CharField(max_length=255)),
                        ('description', models.TextField()),
                        ('date_time', models.DateTimeField()),
                        ('venue', models.CharField(max_length=255)),
                        ('main_artist', models.CharField(max_length=255)),
                        ('organizer_name', models.CharField(max_length=255)),
                        ('contact_email', models.EmailField(max_length=254)),
                        ('contact_phone', models.CharField(blank=True, max_length=20, null=True)),
                        ('cover_image', models.ImageField(blank=True, null=True, upload_to='concerts/covers/')),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('updated_at', models.DateTimeField(auto_now=True)),
                        ('organizer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='concerts', to=settings.AUTH_USER_MODEL)),
                    ],
                    options={
                        'verbose_name': 'Concert',
                        'verbose_name_plural': 'Concerts',
                        'db_table': 'concerts',
                        'ordering': ['-date_time'],
                    },
                ),
            ],
        ),
    ]
