from rest_framework import serializers
from api.models import User
from django.contrib.auth.hashers import make_password
from django.db import connection
import random
from django.core.mail import send_mail
from datetime import timedelta
from django.utils import timezone


class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "name",
            "password",
            "email",
            "phone_number",
            "city",
            "country",
        ]

    def create(self, validated_data):
        hashed_password = make_password(validated_data["password"])

        city = validated_data.get("city")
        country = validated_data.get("country")

        otp = random.randint(100000, 999999)

        sql = """
            INSERT INTO api_user (name, email, password, phone_number, is_verified, city_id, country_id, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = [
            validated_data["name"],
            validated_data["email"],
            hashed_password,
            validated_data.get("phone_number"),
            False,
            city.id if city else None,
            country.id if country else None,
            True,
        ]

        with connection.cursor() as cursor:
            cursor.execute(sql, params)
            user_id = cursor.lastrowid

        expire_at = timezone.now() + timedelta(minutes=5)
        otp_sql = """
            INSERT INTO api_userotp (user_id, otp, created_at, expire_at)
            VALUES (%s, %s, %s, %s)
        """
        otp_params = [user_id, str(otp), timezone.now(), expire_at]

        with connection.cursor() as cursor:
            cursor.execute(otp_sql, otp_params)

        phone_number = validated_data.get("phone_number")
        sql = "SELECT * FROM api_globalphonenumber WHERE phone_number = %s"

        with connection.cursor() as cursor:
            cursor.execute(sql, [phone_number])
            result = cursor.fetchone()

            if result:
                sql_update = "UPDATE api_globalphonenumber SET is_registered = %s WHERE phone_number = %s"
                cursor.execute(sql_update, [True, phone_number])
            else:
                sql_insert = """
                    INSERT INTO api_globalphonenumber (phone_number, is_registered,spam_count)
                    VALUES (%s, %s,%s)
                """
                cursor.execute(sql_insert, [phone_number, True, 0])

        send_mail(
            subject="Your OTP Code",
            message=f"Your OTP code is {otp}. Please verify your email.",
            from_email="hardiksuthar74@gmail.com",
            recipient_list=[validated_data["email"]],
            fail_silently=False,
        )

        return validated_data


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
