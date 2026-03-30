from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0003_paymenttransaction_stock_reservation'),
    ]

    operations = [
        migrations.AddField(
            model_name='paymenttransaction',
            name='provider',
            field=models.CharField(
                choices=[('KHALTI', 'Khalti'), ('ESEWA', 'eSewa')],
                default='KHALTI',
                max_length=20,
            ),
        ),
    ]
