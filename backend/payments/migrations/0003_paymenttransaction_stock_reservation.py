from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0002_paymenttransaction_ticket_snapshots'),
    ]

    operations = [
        migrations.AddField(
            model_name='paymenttransaction',
            name='reservation_expires_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='paymenttransaction',
            name='stock_reserved',
            field=models.BooleanField(default=False),
        ),
    ]
