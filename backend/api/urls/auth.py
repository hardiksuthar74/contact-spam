from django.urls import path
from api.views import (
    LoginApiView,
    RegisterApiView,
    ResendOtpApiView,
    VerifyOTPApiView,
    CountryApiView,
    CityApiView,
)


urlpatterns = [
    path(
        "register/",
        RegisterApiView.as_view(),
    ),
    path(
        "login/",
        LoginApiView.as_view(),
    ),
    path(
        "resend_otp/",
        ResendOtpApiView.as_view(),
    ),
    path(
        "verify_otp/",
        VerifyOTPApiView.as_view(),
    ),
    path(
        "country/",
        CountryApiView.as_view(),
    ),
    path(
        "city/<str:country_id>",
        CityApiView.as_view(),
    ),
]
