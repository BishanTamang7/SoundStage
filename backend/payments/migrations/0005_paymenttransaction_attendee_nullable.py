from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0004_paymenttransaction_provider'),
        ('accounts', '0009_user_profile_photo'),
    ]

    operations = [
        migrations.AlterField(
            model_name='paymenttransaction',
            name='attendee',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='payment_transactions',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
