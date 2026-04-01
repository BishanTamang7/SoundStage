from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('tickets', '0005_randomize_token_pin_values'),
        ('accounts', '0009_user_profile_photo'),
    ]

    operations = [
        migrations.AlterField(
            model_name='ticket',
            name='attendee',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='tickets',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
