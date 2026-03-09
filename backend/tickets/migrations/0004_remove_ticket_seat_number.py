from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('tickets', '0003_ticket_token_pin'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='ticket',
            unique_together=set(),
        ),
        migrations.RemoveField(
            model_name='ticket',
            name='seat_number',
        ),
    ]

