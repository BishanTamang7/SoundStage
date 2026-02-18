from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0004_drop_email_otp_columns"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE accounts_user
                DROP COLUMN IF EXISTS email_verified,
                DROP COLUMN IF EXISTS status;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
