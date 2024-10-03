from django.urls import path
from api.views import ContactApiView, ContactSearchApiView, MarkSpamView


urlpatterns = [
    path(
        "user_contact/",
        ContactApiView.as_view(),
    ),
    path(
        "search_contact/",
        ContactSearchApiView.as_view(),
    ),
    path(
        "spam_contact/",
        MarkSpamView.as_view(),
    ),
]
