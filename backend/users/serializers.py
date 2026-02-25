from rest_framework import serializers
from users.models import User, Business, TeamMember, DiscountCoupon, TeamMemberInvitation


class DiscountCouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiscountCoupon
        fields = ['code', 'discount_percent', 'reason', 'is_used', 'created_at', 'used_at']


class UserSerializer(serializers.ModelSerializer):
    referral_code = serializers.CharField(read_only=True)
    referral_count = serializers.IntegerField(read_only=True)
    coupons = DiscountCouponSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'phone', 'avatar', 'timezone', 'language', 'membership', 'is_2fa_enabled', 'referral_code', 'referral_count', 'coupons')
        read_only_fields = ('id', 'email')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Ensure avatar URL is correctly formatted
        if instance.avatar:
            request = self.context.get('request')
            if request:
                data['avatar'] = request.build_absolute_uri(instance.avatar.url)
            else:
                # If no request context, return relative URL which frontend will prefix
                data['avatar'] = instance.avatar.url
        return data

class BusinessSerializer(serializers.ModelSerializer):
    user_role = serializers.SerializerMethodField()

    class Meta:
        model = Business
        fields = [
            'id', 'name', 'voen', 'logo', 'address', 'city', 'phone', 
            'email', 'website', 'bank_name', 'iban', 'swift', 
            'budget_limit', 'default_invoice_theme', 'is_active', 
            'created_at', 'updated_at', 'user_role'
        ]
        read_only_fields = ('id', 'user')

    def validate_voen(self, value):
        if value:
            # Remove any spaces or dashes
            value = value.replace(' ', '').replace('-', '')
            if not value.isdigit():
                raise serializers.ValidationError("VÖEN yalnız rəqəmlərdən ibarət olmalıdır.")
            if len(value) != 10:
                raise serializers.ValidationError("VÖEN mütləq 10 rəqəmli olmalıdır.")
        return value

    def get_user_role(self, obj):
        request = self.context.get('request')
        if not request or not request.user or request.user.is_anonymous:
            return None
            
        # Hardened check: compare IDs to avoid issues with proxy user objects
        if obj.user_id == request.user.id:
            return 'OWNER'
            
        # 1. Direct check: Is this user in the team of the business owner?
        member = TeamMember.objects.filter(owner_id=obj.user_id, user_id=request.user.id).first()
        if member:
            return member.role
            
        # 2. Hierarchical check: Was this user invited by someone who is in the team of the business owner?
        # (Supports legacy data before we flattened the structure)
        team_member_ids = TeamMember.objects.filter(owner_id=obj.user_id).values_list('user_id', flat=True)
        member = TeamMember.objects.filter(owner_id__in=team_member_ids, user_id=request.user.id).first()
        if member:
            return member.role
            
        return None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Ensure logo URL is correctly formatted
        if instance.logo:
            request = self.context.get('request')
            if request:
                data['logo'] = request.build_absolute_uri(instance.logo.url)
            else:
                data['logo'] = instance.logo.url
            
        # Role-based sensitive data hiding (Data Leak prevention)
        role = data.get('user_role')
        if role not in ['OWNER', 'MANAGER', 'ACCOUNTANT']:
            sensitive_fields = ['bank_name', 'iban', 'swift', 'budget_limit']
            for field in sensitive_fields:
                data.pop(field, None)
                
        # White label check
        from users.plan_limits import get_full_plan_status
        status = get_full_plan_status(instance.user, business_id=instance.id)
        data['white_label_enabled'] = status.get('limits', {}).get('white_label', False)
        
        return data

class TeamMemberSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.first_name', read_only=True)

    class Meta:
        model = TeamMember
        fields = ('id', 'user', 'user_email', 'user_name', 'business', 'role', 'monthly_target', 'last_latitude', 'last_longitude', 'last_location_update', 'created_at')
        read_only_fields = ('id', 'user', 'created_at', 'last_latitude', 'last_longitude', 'last_location_update')

class TeamMemberInvitationSerializer(serializers.ModelSerializer):
    inviter_email = serializers.EmailField(source='inviter.email', read_only=True)

    class Meta:
        model = TeamMemberInvitation
        fields = ('id', 'email', 'inviter', 'inviter_email', 'business', 'role', 'is_used', 'created_at')
        read_only_fields = ('id', 'inviter', 'is_used', 'created_at')

from dj_rest_auth.registration.serializers import RegisterSerializer

class CustomRegisterSerializer(RegisterSerializer):
    username = None
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    referral_code = serializers.CharField(required=False, allow_blank=True, write_only=True)

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

    def save(self, request):
        user = super().save(request)
        
        # 1. Process Referral Code
        code = self.validated_data.get('referral_code', '').strip().upper()
        if code:
            referrer = User.objects.filter(referral_code=code).first()
            if referrer and referrer.pk != user.pk:
                user.referred_by = referrer
                user.save(update_fields=['referred_by'])
        
        # 2. Process Team Invitations
        invites = TeamMemberInvitation.objects.filter(email__iexact=user.email, is_used=False)
        for invite in invites:
            # Create TeamMember record linked to specific business
            TeamMember.objects.get_or_create(
                business=invite.business,
                user=user,
                defaults={
                    'owner': invite.inviter,
                    'role': invite.role
                }
            )
            invite.is_used = True
            invite.save(update_fields=['is_used'])
            
        return user

class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Mövcud şifrə yanlışdır.")
        return value
