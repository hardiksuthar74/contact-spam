from rest_framework.views import APIView
from api.models import ContactName
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from api.serializers import (
    ContactListSerializer,
    AddContactSerializer,
    MarkSpamSerializer,
)
from django.db import connection
from django.utils import timezone


class BaseAuthenticatedAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]


class ContactApiView(BaseAuthenticatedAPIView):
    def get(self, request):
        sql = "SELECT * FROM contact_spam.api_contactname where user_id = %s"
        contacts = ContactName.objects.raw(sql, [request.user.id])
        serializer = ContactListSerializer(contacts, many=True)

        return Response(serializer.data)

    def post(self, request):
        serializer = AddContactSerializer(
            data=request.data, context={"request": request}
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Contact added successfully"},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ContactSearchApiView(BaseAuthenticatedAPIView):
    def get(self, request):
        query = request.query_params.get("query", "").strip()

        if query == "":
            return Response([])

        contacts_by_name_start = []
        contacts_by_name_contains = []
        contacts_by_phone = []

        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT COUNT(*)
                FROM api_user
                WHERE is_verified = TRUE
            """
            )
            total_verified_users = cursor.fetchone()[0]

            cursor.execute(
                """
                SELECT cn.id, cn.name, gpn.phone_number, gpn.spam_count
                FROM api_contactname cn
                JOIN api_globalphonenumber gpn ON cn.global_phone_number_id = gpn.id
                WHERE cn.name LIKE %s
                """,
                [query + "%"],
            )
            contacts_by_name_start = cursor.fetchall()

            cursor.execute(
                """
                SELECT cn.id, cn.name, gpn.phone_number, gpn.spam_count
                FROM api_contactname cn
                JOIN api_globalphonenumber gpn ON cn.global_phone_number_id = gpn.id
                WHERE cn.name LIKE %s AND cn.name NOT LIKE %s
                """,
                ["%" + query + "%", query + "%"],
            )
            contacts_by_name_contains = cursor.fetchall()

            cursor.execute(
                """
                SELECT gpn.id, cn.name, gpn.phone_number, gpn.spam_count
                FROM api_globalphonenumber gpn
                JOIN api_contactname cn ON cn.global_phone_number_id = gpn.id
                WHERE gpn.phone_number = %s
                """,
                [query],
            )
            contacts_by_phone = cursor.fetchall()

        combined_contacts = (
            contacts_by_name_start + contacts_by_name_contains + contacts_by_phone
        )

        contacts_with_spam_likelihood = [
            (
                contact[0],
                contact[1],
                contact[2],
                self.calculate_spam_likelihood(contact[3], total_verified_users),
            )
            for contact in combined_contacts
        ]

        serialized_results = self.serialize_results(
            contacts_with_spam_likelihood, request.user.id
        )

        return Response(serialized_results)

    def calculate_spam_likelihood(self, spam_count, total_verified_users):
        if total_verified_users == 0:
            return 0
        return round(spam_count / total_verified_users * 100, 2)

    def serialize_results(self, contacts, user_id):
        result = []
        for contact in contacts:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT u.email
                    FROM contact_spam.api_contactname as cn
                    join contact_spam.api_globalphonenumber gn on gn.id = cn.global_phone_number_id
                    left join contact_spam.api_user u on u.phone_number = gn.phone_number
                    where cn.user_id = %s
                    and gn.phone_number = %s
                    """,
                    [user_id, contact[2]],
                )
                contact_details = cursor.fetchone()

            result.append(
                {
                    "name": contact[1],
                    "phone_number": contact[2],
                    "spam_likelihood": contact[3],
                    "email": contact_details[0] if contact_details else None,
                }
            )
        return result


class MarkSpamView(APIView):
    def post(self, request):
        serializer = MarkSpamSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone_number = serializer.validated_data["phone_number"]

        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, spam_count
                FROM api_globalphonenumber
                WHERE phone_number = %s
                """,
                [phone_number],
            )
            global_phone = cursor.fetchone()

        if not global_phone:
            return Response(
                {"detail": "Phone number not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        global_phone_id, spam_count = global_phone

        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT COUNT(*)
                FROM api_spamreport
                WHERE phone_number_id = %s AND user_id = %s
                """,
                [global_phone_id, request.user.id],
            )
            reported_count = cursor.fetchone()[0]

        if reported_count > 0:
            return Response(
                {"detail": "You have already reported this number as spam."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        report_date = timezone.now()

        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO api_spamreport (phone_number_id, user_id, report_date)
                VALUES (%s, %s,%s)
                """,
                [global_phone_id, request.user.id, report_date],
            )

        spam_count += 1
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE api_globalphonenumber
                SET spam_count = %s
                WHERE id = %s
                """,
                [spam_count, global_phone_id],
            )

        return Response(
            {"detail": "Phone number marked as spam."},
            status=status.HTTP_201_CREATED,
        )
