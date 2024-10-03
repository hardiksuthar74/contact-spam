from django.db import models
from api.models import User


class GlobalPhoneNumber(models.Model):
    phone_number = models.CharField(max_length=15, unique=True)
    is_registered = models.BooleanField(default=False)
    spam_count = models.IntegerField(default=0)

    def __str__(self):
        return self.phone_number


class ContactName(models.Model):
    global_phone_number = models.ForeignKey(
        GlobalPhoneNumber, on_delete=models.CASCADE, related_name="contacts"
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)

    class Meta:
        unique_together = ("user", "global_phone_number")

    def __str__(self):
        return f"{self.name} ({self.global_phone_number.phone_number})"


class SpamReport(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    phone_number = models.ForeignKey(GlobalPhoneNumber, on_delete=models.CASCADE)
    report_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} marked {self.phone_number.phone_number} as spam"
