from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0003_remove_user_admin_fields"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE accounts_user
                DROP COLUMN IF EXISTS email_otp_expires_at,
                DROP COLUMN IF EXISTS email_otp_hash,
                DROP COLUMN IF EXISTS email_otp_sent_at,
                DROP COLUMN IF EXISTS is_email_verified;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
