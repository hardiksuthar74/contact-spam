from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.utils import timezone


class Country(models.Model):
    name = models.CharField(max_length=255)


class City(models.Model):
    name = models.CharField(max_length=255)
    country = models.ForeignKey(Country, on_delete=models.CASCADE)


class User(AbstractUser):
    username = None
    first_name = None
    last_name = None
    last_login = None
    is_superuser = None
    is_staff = None
    date_joined = None

    email = models.EmailField(unique=True, blank=False, null=False)
    name = models.CharField(
        max_length=255,
    )
    phone_number = models.CharField(
        max_length=15,
        unique=True,
        validators=[RegexValidator(r"^\d{10,15}$", "Enter a valid phone number.")],
    )
    city = models.ForeignKey(City, blank=True, null=True, on_delete=models.CASCADE)
    country = models.ForeignKey(
        Country, blank=True, null=True, on_delete=models.CASCADE
    )
    is_verified = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email


class UserOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expire_at = models.DateTimeField()

    def is_valid(self):
        return timezone.now() < self.expire_at
