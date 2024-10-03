from rest_framework.views import APIView
from api.serializers import RegisterSerializer, LoginSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from api.models import User, Country, City
from django.utils import timezone
import random
from django.core.mail import send_mail
from datetime import timedelta
from django.db import connection
from django.contrib.auth.hashers import check_password


class RegisterApiView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "User registered successfully!"},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginApiView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            password = serializer.validated_data["password"]

            sql = "SELECT * FROM api_user WHERE email = %s"
            users = User.objects.raw(sql, [email])

            if not users:
                return Response(
                    {"message": "Invalid email or password"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user = users[0]

            if check_password(password, user.password):

                if not user.is_verified:
                    return Response(
                        {"message": "Please verify your email"},
                        status=status.HTTP_403_FORBIDDEN,
                    )

                refresh = RefreshToken.for_user(user)
                acc_token = str(refresh.access_token)

                credential = {
                    "email": user.email,
                    "name": user.name,
                    "is_verified": user.is_verified,
                    "access": acc_token,
                }

                return Response(
                    {"message": "Login successful", "data": credential},
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"message": "Invalid email or password"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResendOtpApiView(APIView):
    def post(self, request):
        email = request.data.get("email")

        sql = "SELECT * FROM api_user WHERE email = %s"
        users = User.objects.raw(sql, [email])

        if not users:
            return Response(
                {"error": "Invalid email or password"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = users[0]

        otp = random.randint(100000, 999999)

        expire_at = timezone.now() + timedelta(minutes=5)

        otp_sql = """
            INSERT INTO api_userotp (user_id, otp, created_at, expire_at)
            VALUES (%s, %s, %s, %s)
        """
        otp_params = [user.id, str(otp), timezone.now(), expire_at]

        with connection.cursor() as cursor:
            cursor.execute(otp_sql, otp_params)

        # Send OTP via email
        send_mail(
            subject="Your OTP Code",
            message=f"Your OTP code is {otp}. Please verify your email.",
            from_email="hardiksuthar74@gmail.com",
            recipient_list=[email],
            fail_silently=False,
        )

        return Response({"message": "OTP has been send"}, status=status.HTTP_200_OK)


class VerifyOTPApiView(APIView):
    def post(self, request):
        email = request.data.get("email")
        otp = request.data.get("otp")

        user_sql = "SELECT * FROM api_user WHERE email = %s"
        with connection.cursor() as cursor:
            cursor.execute(user_sql, [email])
            user = cursor.fetchone()

        if not user:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )

        user_id = user[0]

        otp_sql = """
            SELECT * FROM api_userotp
            WHERE user_id = %s AND otp = %s
            ORDER BY created_at DESC LIMIT 1
        """
        with connection.cursor() as cursor:
            cursor.execute(otp_sql, [user_id, otp])
            otp_record = cursor.fetchone()

        if not otp_record:
            return Response(
                {"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST
            )

        otp_expire_at = otp_record[3]

        if not timezone.is_aware(otp_expire_at):
            otp_expire_at = timezone.make_aware(
                otp_expire_at, timezone.get_current_timezone()
            )

        if timezone.now() < otp_expire_at:
            update_sql = "UPDATE api_user SET is_verified = %s WHERE id = %s"
            with connection.cursor() as cursor:
                cursor.execute(update_sql, [True, user_id])

            refresh = RefreshToken.for_user(User.objects.get(pk=user_id))
            acc_token = str(refresh.access_token)

            credential = {
                "email": email,
                "name": user[7],
                "is_verified": True,
                "access": acc_token,
            }

            return Response(
                {
                    "message": "Email verified successfully",
                    "data": credential,
                },
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {"error": "OTP has expired"}, status=status.HTTP_400_BAD_REQUEST
            )


class CountryApiView(APIView):
    def get(self, request):
        with connection.cursor() as cursor:
            cursor.execute("SELECT id, name FROM api_country")
            countries = cursor.fetchall()

        country_list = [{"id": country[0], "name": country[1]} for country in countries]
        return Response(country_list)


class CityApiView(APIView):
    def get(self, request, country_id):
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT id, name FROM api_city WHERE country_id = %s", [country_id]
            )
            cities = cursor.fetchall()

        city_list = [{"id": city[0], "name": city[1]} for city in cities]
        return Response(city_list)
