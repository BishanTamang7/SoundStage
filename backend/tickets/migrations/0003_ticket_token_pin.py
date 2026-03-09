from django.db import migrations, models


def _token_pin(value: str) -> str:
    token = str(value or '')
    if not token:
        return '0000'
    hashed = 0
    for char in token:
        hashed = (hashed * 31 + ord(char)) % 10000
    return str(hashed).zfill(4)


def fill_token_pin(apps, schema_editor):
    Ticket = apps.get_model('tickets', 'Ticket')
    for ticket in Ticket.objects.all().only('id', 'qr_token'):
        ticket.token_pin = _token_pin(ticket.qr_token)
        ticket.save(update_fields=['token_pin'])


class Migration(migrations.Migration):
    dependencies = [
        ('tickets', '0002_ticket'),
    ]

    operations = [
        migrations.AddField(
            model_name='ticket',
            name='token_pin',
            field=models.CharField(blank=True, db_index=True, max_length=4),
        ),
        migrations.RunPython(fill_token_pin, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='ticket',
            name='token_pin',
            field=models.CharField(db_index=True, max_length=4),
        ),
    ]

