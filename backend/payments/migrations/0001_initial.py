import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('events', '0001_initial'),
        ('tickets', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.CreateModel(
                    name='PaymentTransaction',
                    fields=[
                        ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                        ('pidx', models.CharField(max_length=255, unique=True)),
                        ('purchase_order_id', models.CharField(max_length=255, unique=True)),
                        ('amount_paisa', models.PositiveIntegerField()),
                        ('quantity', models.PositiveIntegerField()),
                        ('status', models.CharField(default='Initiated', max_length=50)),
                        ('transaction_id', models.CharField(blank=True, max_length=255, null=True)),
                        ('raw_response', models.JSONField(blank=True, default=dict)),
                        ('tickets_issued', models.BooleanField(default=False)),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('updated_at', models.DateTimeField(auto_now=True)),
                        ('attendee', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payment_transactions', to=settings.AUTH_USER_MODEL)),
                        ('concert', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payment_transactions', to='events.concert')),
                        ('ticket_category', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payment_transactions', to='tickets.ticketcategory')),
                    ],
                    options={
                        'db_table': 'payment_transactions',
                        'ordering': ['-created_at'],
                    },
                ),
            ],
        ),
    ]
