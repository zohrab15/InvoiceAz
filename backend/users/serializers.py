from rest_framework import serializers
from users.models import User, Business, TeamMember

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'phone', 'avatar', 'timezone', 'language', 'membership', 'is_2fa_enabled')
        read_only_fields = ('id', 'email')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.avatar and str(instance.avatar).startswith('http'):
            data['avatar'] = str(instance.avatar)
        return data

class BusinessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = '__all__'
        read_only_fields = ('id', 'user')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.logo and str(instance.logo).startswith('http'):
            data['logo'] = str(instance.logo)
        return data

class TeamMemberSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.first_name', read_only=True)

    class Meta:
        model = TeamMember
        fields = ('id', 'user', 'user_email', 'user_name', 'role', 'last_latitude', 'last_longitude', 'last_location_update', 'created_at')
        read_only_fields = ('id', 'user', 'created_at', 'last_latitude', 'last_longitude', 'last_location_update')

from dj_rest_auth.registration.serializers import RegisterSerializer

class CustomRegisterSerializer(RegisterSerializer):
    username = None
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        data['first_name'] = self.validated_data.get('first_name', '')
        data['last_name'] = self.validated_data.get('last_name', '')
        return data

    def validate_username(self, username):
        return None

    def validate_email(self, email):
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("Bu e-poçt ilə artıq hesab mövcuddur.")
        return email

class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Mövcud şifrə yanlışdır.")
        return value
