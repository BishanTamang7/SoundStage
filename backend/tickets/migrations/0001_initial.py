import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('events', '0001_initial'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.CreateModel(
                    name='TicketCategory',
                    fields=[
                        ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                        ('name', models.CharField(max_length=100)),
                        ('price', models.DecimalField(decimal_places=2, max_digits=10)),
                        ('quantity', models.PositiveIntegerField()),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('concert', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ticket_categories', to='events.concert')),
                    ],
                    options={
                        'verbose_name': 'Ticket Category',
                        'verbose_name_plural': 'Ticket Categories',
                        'db_table': 'ticket_categories',
                        'unique_together': {('concert', 'name')},
                    },
                ),
            ],
        ),
    ]
