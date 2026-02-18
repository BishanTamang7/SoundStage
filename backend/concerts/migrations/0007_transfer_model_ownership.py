from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('concerts', '0006_paymenttransaction_ticket'),
        ('events', '0001_initial'),
        ('payments', '0001_initial'),
        ('tickets', '0002_ticket'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.DeleteModel(name='Ticket'),
                migrations.DeleteModel(name='PaymentTransaction'),
                migrations.DeleteModel(name='TicketCategory'),
                migrations.DeleteModel(name='Concert'),
            ],
        ),
    ]
