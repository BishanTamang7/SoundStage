from django.db import migrations, models


def backfill_ticket_snapshots(apps, schema_editor):
    PaymentTransaction = apps.get_model('payments', 'PaymentTransaction')

    for payment in PaymentTransaction.objects.select_related('ticket_category').all():
        category = getattr(payment, 'ticket_category', None)
        updates = {}
        if not payment.ticket_category_name_snapshot and category:
            updates['ticket_category_name_snapshot'] = category.name
        if payment.ticket_unit_price_snapshot is None and category:
            updates['ticket_unit_price_snapshot'] = category.price
        if updates:
            PaymentTransaction.objects.filter(pk=payment.pk).update(**updates)


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='paymenttransaction',
            name='ticket_category_name_snapshot',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='paymenttransaction',
            name='ticket_unit_price_snapshot',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
        migrations.RunPython(backfill_ticket_snapshots, migrations.RunPython.noop),
    ]
