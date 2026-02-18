import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0001_initial'),
        ('tickets', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Ticket',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('seat_number', models.PositiveIntegerField()),
                ('qr_token', models.CharField(max_length=64, unique=True)),
                ('is_used', models.BooleanField(default=False)),
                ('used_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('attendee', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tickets', to=settings.AUTH_USER_MODEL)),
                ('concert', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tickets', to='events.concert')),
                ('payment_transaction', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tickets', to='payments.paymenttransaction')),
                ('ticket_category', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tickets', to='tickets.ticketcategory')),
                ('used_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='validated_tickets', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'tickets',
                'ordering': ['-created_at'],
                'unique_together': {('payment_transaction', 'seat_number')},
            },
        ),
    ]
