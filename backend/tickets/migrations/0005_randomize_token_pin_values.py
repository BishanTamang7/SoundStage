import secrets

from django.db import migrations


def randomize_token_pins(apps, schema_editor):
    Ticket = apps.get_model('tickets', 'Ticket')
    used = set(
        Ticket.objects.exclude(token_pin__isnull=True)
        .exclude(token_pin='')
        .values_list('token_pin', flat=True)
    )

    for ticket in Ticket.objects.all().order_by('created_at', 'id').only('id', 'token_pin'):
        # Reassign each ticket so all pins are random 4-digit values.
        used.discard(ticket.token_pin)
        for _ in range(2000):
            candidate = f'{secrets.randbelow(10000):04d}'
            if candidate in used:
                continue
            ticket.token_pin = candidate
            ticket.save(update_fields=['token_pin'])
            used.add(candidate)
            break
        else:
            # Keep previous value if pool is saturated.
            used.add(ticket.token_pin)


class Migration(migrations.Migration):
    dependencies = [
        ('tickets', '0004_remove_ticket_seat_number'),
    ]

    operations = [
        migrations.RunPython(randomize_token_pins, migrations.RunPython.noop),
    ]

