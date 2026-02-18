from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0005_drop_legacy_user_columns'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="""
                        ALTER TABLE accounts_user
                        ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;
                        ALTER TABLE accounts_user
                        ADD COLUMN IF NOT EXISTS status varchar(30) DEFAULT 'PENDING_VERIFICATION';
                        CREATE INDEX IF NOT EXISTS accounts_user_status_idx ON accounts_user (status);
                    """,
                    reverse_sql="""
                        DROP INDEX IF EXISTS accounts_user_status_idx;
                        ALTER TABLE accounts_user DROP COLUMN IF EXISTS status;
                        ALTER TABLE accounts_user DROP COLUMN IF EXISTS email_verified;
                    """,
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name='user',
                    name='email_verified',
                    field=models.BooleanField(default=False),
                ),
                migrations.AddField(
                    model_name='user',
                    name='status',
                    field=models.CharField(
                        choices=[
                            ('PENDING_VERIFICATION', 'Pending Verification'),
                            ('ACTIVE', 'Active'),
                            ('SUSPENDED', 'Suspended'),
                        ],
                        db_index=True,
                        default='PENDING_VERIFICATION',
                        max_length=30,
                    ),
                ),
            ],
        ),
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="""
                        CREATE TABLE IF NOT EXISTS accounts_emailverificationtoken (
                            id bigserial PRIMARY KEY,
                            token_hash varchar(64) UNIQUE NOT NULL,
                            expires_at timestamptz NOT NULL,
                            used_at timestamptz NULL,
                            created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            user_id bigint NOT NULL REFERENCES accounts_user(id) DEFERRABLE INITIALLY DEFERRED
                        );
                        CREATE INDEX IF NOT EXISTS accounts_emailverificationtoken_expires_at_idx
                        ON accounts_emailverificationtoken (expires_at);
                        CREATE INDEX IF NOT EXISTS accounts_ema_user_id_388073_idx
                        ON accounts_emailverificationtoken (user_id, created_at);
                    """,
                    reverse_sql="""
                        DROP INDEX IF EXISTS accounts_ema_user_id_388073_idx;
                        DROP INDEX IF EXISTS accounts_emailverificationtoken_expires_at_idx;
                        DROP TABLE IF EXISTS accounts_emailverificationtoken;
                    """,
                ),
            ],
            state_operations=[
                migrations.CreateModel(
                    name='EmailVerificationToken',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('token_hash', models.CharField(db_index=True, max_length=64, unique=True)),
                        ('expires_at', models.DateTimeField(db_index=True)),
                        ('used_at', models.DateTimeField(blank=True, null=True)),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='email_verification_tokens', to='accounts.user')),
                    ],
                    options={
                        'ordering': ['-created_at'],
                    },
                ),
                migrations.AddIndex(
                    model_name='emailverificationtoken',
                    index=models.Index(fields=['user', 'created_at'], name='accounts_ema_user_id_388073_idx'),
                ),
            ],
        ),
        migrations.RunSQL(
            sql="""
                UPDATE accounts_user
                SET status = CASE
                    WHEN email_verified = true THEN 'ACTIVE'
                    ELSE 'PENDING_VERIFICATION'
                END
                WHERE status IS NULL OR status = '';
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.AlterField(
            model_name='user',
            name='status',
            field=models.CharField(
                choices=[
                    ('PENDING_VERIFICATION', 'Pending Verification'),
                    ('ACTIVE', 'Active'),
                    ('SUSPENDED', 'Suspended'),
                ],
                db_index=True,
                default='PENDING_VERIFICATION',
                max_length=30,
            ),
        ),
    ]
