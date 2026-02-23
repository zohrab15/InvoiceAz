export const translateError = (error, fallback = 'Xəta baş verdi') => {
    if (!error) return fallback;

    let msg = '';
    if (typeof error === 'string') {
        msg = error;
    } else if (error.response?.data?.detail) {
        msg = error.response.data.detail;
    } else if (error.detail) {
        msg = error.detail;
    } else if (error.message) {
        msg = error.message;
    } else {
        msg = fallback;
    }

    const translations = {
        'You do not have permission to perform this action.': 'Sizin bu əməliyyatı yerinə yetirmək üçün icazəniz yoxdur.',
        'Authentication credentials were not provided.': 'Giriş məlumatları təmin edilməyib.',
        'Not found.': 'Tapılmadı.',
        'Method not allowed.': 'Bu metod icazə verilmir.',
        'Invalid token.': 'Yanlış token.',
        'User is inactive.': 'İstifadəçi aktiv deyil.',
        'Unable to log in with provided credentials.': 'Daxil edilən məlumatlarla giriş mümkün olmadı.',
        'Account is disabled.': 'Hesab deaktiv edilib.',
        'Network Error': 'Şəbəkə xətası baş verdi.',
        'This field is required.': 'Bu sahə məcburidir.',
        'This field may not be blank.': 'Bu sahə boş qala bilməz.',
        'Enter a valid email address.': 'Düzgün e-poçt ünvanı daxil edin.',
        'The two password fields didn\'t match.': 'Şifrələr uyğun gəlmir.',
        'A user with that email already exists.': 'Bu e-poçt ilə artıq hesab mövcuddur.',
        'This password is too short. It must contain at least 8 characters.': 'Şifrə çox qısadır. Ən azı 8 simvol olmalıdır.',
        'This password is too common.': 'Bu şifrə çox sadədir.',
        'This password is too similar to the email address.': 'Şifrə e-poçt ünvanına çox bənzəyir.',
    };

    // Handle nested DRF errors (first error message)
    if (typeof error === 'object' && error?.response?.data) {
        const data = error.response.data;
        if (typeof data === 'object') {
            const firstValue = Object.values(data).flat()[0];
            if (typeof firstValue === 'string') {
                return translations[firstValue] || firstValue;
            }
        }
    }

    return translations[msg] || msg || fallback;
};
