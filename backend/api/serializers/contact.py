from rest_framework import serializers
from api.models import ContactName, GlobalPhoneNumber
from django.db import connection
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator


class ContactListSerializer(serializers.ModelSerializer):

    class Meta:
        model = ContactName
        fields = [
            "name",
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        sql = "SELECT * FROM contact_spam.api_globalphonenumber where id = %s"

        phone_number = GlobalPhoneNumber.objects.raw(
            sql, [instance.global_phone_number_id]
        )

        if phone_number:
            representation["phone_number"] = phone_number[0].phone_number

        return representation


class AddContactSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(
        max_length=15,
        validators=[RegexValidator(r"^\d{10,15}$", "Enter a valid phone number.")],
    )
    name = serializers.CharField(max_length=100)

    class Meta:
        model = ContactName
        fields = ["phone_number", "name"]

    def create(self, validated_data):
        phone_number = validated_data.get("phone_number")
        name = validated_data.get("name")
        user_id = self.context["request"].user.id

        with connection.cursor() as cursor:
            sql = "SELECT * FROM api_globalphonenumber WHERE phone_number = %s"
            cursor.execute(sql, [phone_number])
            global_phone_record = cursor.fetchone()

            if global_phone_record:
                global_phone_id = global_phone_record[0]
            else:
                insert_sql = """
                    INSERT INTO api_globalphonenumber (phone_number, is_registered, spam_count)
                    VALUES (%s, %s,%s)
                """
                cursor.execute(insert_sql, [phone_number, False, 0])
                global_phone_id = cursor.lastrowid

        with connection.cursor() as cursor:
            sql = """
                SELECT * FROM api_contactname
                WHERE user_id = %s AND global_phone_number_id = %s
            """
            cursor.execute(sql, [user_id, global_phone_id])
            existing_contact = cursor.fetchone()

            if existing_contact:
                raise serializers.ValidationError(
                    _("This contact already exists for the user.")
                )

        with connection.cursor() as cursor:
            insert_sql = """
                INSERT INTO api_contactname (global_phone_number_id, user_id, name)
                VALUES (%s, %s, %s)
            """
            cursor.execute(insert_sql, [global_phone_id, user_id, name])

        return {
            "phone_number": phone_number,
            "name": name,
            "user_id": user_id,
            "global_phone_number_id": global_phone_id,
        }


class MarkSpamSerializer(serializers.Serializer):
    phone_number = serializers.CharField(required=True)
