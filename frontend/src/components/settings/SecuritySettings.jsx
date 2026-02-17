import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Shield, Key, Smartphone, Trash2, LogOut, Check, AlertCircle } from 'lucide-react';
import client from '../../api/client';
import { useToast } from '../Toast';

const SecuritySettings = () => {
    const queryClient = useQueryClient();
    const showToast = useToast();
    const [passwordData, setPasswordData] = useState({ old_password: '', new_password: '', confirm_password: '' });

    // 2FA State
    const [is2faSetupOpen, setIs2faSetupOpen] = useState(false);
    const [twoFactorData, setTwoFactorData] = useState(null);
    const [otpCode, setOtpCode] = useState('');

    const { data: user } = useQuery({
        queryKey: ['user-details'],
        queryFn: async () => {
            const res = await client.get('/users/me/');
            return res.data;
        }
    });

    // Fetch Active Sessions
    const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
        queryKey: ['sessions'],
        queryFn: async () => {
            const res = await client.get('/users/sessions/');
            return res.data;
        }
    });

    const passMutation = useMutation({
        mutationFn: (data) => client.post('/users/change-password/', data),
        onSuccess: () => {
            showToast('Şifrə uğurla dəyişdirildi!');
            setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
        },
        onError: (err) => {
            const msg = err.response?.data?.old_password?.[0] || 'Şifrə dəyişdirilə bilmədi.';
            showToast(msg, 'error');
        }
    });

    const generate2FAMutation = useMutation({
        mutationFn: () => client.post('/users/2fa/generate/'),
        onSuccess: (res) => {
            setTwoFactorData(res.data);
            setIs2faSetupOpen(true);
        }
    });

    const enable2FAMutation = useMutation({
        mutationFn: (code) => client.post('/users/2fa/enable/', { code }),
        onSuccess: () => {
            showToast('İki mərhələli doğrulama aktiv edildi!');
            setIs2faSetupOpen(false);
            setTwoFactorData(null);
            setOtpCode('');
            queryClient.invalidateQueries(['user-details']);
        },
        onError: () => showToast('Yanlış kod, yenidən yoxlayın.', 'error')
    });

    const disable2FAMutation = useMutation({
        mutationFn: () => client.post('/users/2fa/disable/'),
        onSuccess: () => {
            showToast('İki mərhələli doğrulama söndürüldü.');
            queryClient.invalidateQueries(['user-details']);
        }
    });

    const revokeMutation = useMutation({
        mutationFn: (id) => client.post(`/users/sessions/${id}/revoke/`),
        onSuccess: () => {
            queryClient.invalidateQueries(['sessions']);
            showToast('Sessiya sonlandırıldı.');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: () => client.delete('/users/delete-account/'),
        onSuccess: () => {
            showToast('Hesabınız silindi. Sağ olun.');
            window.location.href = '/login';
        }
    });

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (passwordData.new_password !== passwordData.confirm_password) {
            return showToast('Yeni şifrələr uyğun gəlmir.', 'error');
        }
        passMutation.mutate({
            old_password: passwordData.old_password,
            new_password: passwordData.new_password
        });
    };

    return (
        <div className="space-y-8">
            {/* Password Change */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <h3 className="font-black text-gray-800 flex items-center gap-3 text-lg tracking-tight">
                    <div className="p-2 bg-blue-50 rounded-lg text-primary-blue"><Key size={20} /></div>
                    Şifrəni Yenilə
                </h3>
                <form onSubmit={handlePasswordSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Mövcud Şifrə</label>
                        <input
                            type="password"
                            value={passwordData.old_password}
                            onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-primary-blue focus:bg-white rounded-xl p-2.5 outline-none transition-all font-bold"
                            required
                            onInvalid={(e) => e.target.setCustomValidity('Zəhmət olmasa bu sahəni doldurun')}
                            onInput={(e) => e.target.setCustomValidity('')}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Yeni Şifrə</label>
                        <input
                            type="password"
                            value={passwordData.new_password}
                            onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-primary-blue focus:bg-white rounded-xl p-2.5 outline-none transition-all font-bold"
                            required
                            onInvalid={(e) => e.target.setCustomValidity('Zəhmət olmasa bu sahəni doldurun')}
                            onInput={(e) => e.target.setCustomValidity('')}
                            minLength={8}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Təkrar Yeni Şifrə</label>
                        <div className="flex gap-2">
                            <input
                                type="password"
                                value={passwordData.confirm_password}
                                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-primary-blue focus:bg-white rounded-xl p-2.5 outline-none transition-all font-bold"
                                required
                                onInvalid={(e) => e.target.setCustomValidity('Zəhmət olmasa bu sahəni doldurun')}
                                onInput={(e) => e.target.setCustomValidity('')}
                            />
                            <button
                                type="submit"
                                disabled={passMutation.isPending}
                                className="bg-primary-blue text-white px-6 rounded-xl hover:bg-blue-700 transition-all font-bold disabled:opacity-50"
                            >
                                {passMutation.isPending ? '...' : 'Dəyiş'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* 2FA Section */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="font-black text-gray-800 flex items-center gap-3 text-lg tracking-tight">
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><Smartphone size={20} /></div>
                        İki Mərhələli Doğrulama (2FA)
                    </h3>
                    {user?.is_2fa_enabled && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase rounded-full tracking-widest">AKTİVDİR</span>
                    )}
                </div>

                <p className="text-sm text-gray-500 max-w-2xl leading-relaxed font-medium">
                    Hesabınızın təhlükəsizliyini artırmaq üçün 2FA aktivləşdirin. Giriş zamanı mobil tətbiqinizdən gələn kodu daxil etməli olacaqsınız.
                </p>

                {!user?.is_2fa_enabled ? (
                    !is2faSetupOpen ? (
                        <button
                            onClick={() => generate2FAMutation.mutate()}
                            disabled={generate2FAMutation.isPending}
                            className="px-6 py-2.5 bg-primary-blue text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
                        >
                            {generate2FAMutation.isPending ? 'Hazırlanır...' : 'Aktivləşdir'}
                        </button>
                    ) : (
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-6 animate-in fade-in slide-in-from-top-4">
                            <div className="flex flex-col md:flex-row gap-8 items-center">
                                <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(twoFactorData?.provisioning_uri)}`}
                                        alt="2FA QR Code"
                                        className="w-32 h-32"
                                    />
                                </div>
                                <div className="space-y-4 flex-1">
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-gray-700">1. QR kodu skan edin</p>
                                        <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                                            Google Authenticator və ya oxşar tətbiqlə mətni skan edin. QR kodu skan edə bilmirsinizsə, bu kodu əllə daxil edin:
                                            <code className="ml-1 bg-white px-1.5 py-0.5 rounded border border-gray-200 text-primary-blue font-bold">{twoFactorData?.secret}</code>
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-gray-700">2. 6-rəqəmli kodu daxil edin</p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                maxLength={6}
                                                placeholder="000000"
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value)}
                                                className="w-32 bg-white border-2 border-transparent focus:border-primary-blue rounded-xl p-2 text-center font-black tracking-[0.5em] outline-none transition-all"
                                            />
                                            <button
                                                onClick={() => enable2FAMutation.mutate(otpCode)}
                                                disabled={enable2FAMutation.isPending || otpCode.length !== 6}
                                                className="bg-slate-900 text-white px-6 rounded-xl hover:bg-black transition-all font-bold text-sm disabled:opacity-30"
                                            >
                                                Təsdiqlə
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIs2faSetupOpen(false);
                                                    setTwoFactorData(null);
                                                }}
                                                className="text-gray-400 hover:text-gray-600 px-4 font-bold text-sm"
                                            >
                                                Ləğv et
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                ) : (
                    <button
                        onClick={() => {
                            if (confirm('2FA-nı söndürmək istədiyinizə əminsiniz?')) disable2FAMutation.mutate();
                        }}
                        className="px-6 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold text-sm hover:bg-red-100 transition-all"
                    >
                        Söndür
                    </button>
                )}
            </div>

            {/* Active Sessions */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <h3 className="font-black text-gray-800 flex items-center gap-3 text-lg tracking-tight">
                    <div className="p-2 bg-green-50 rounded-lg text-green-600"><LogOut size={20} /></div>
                    Aktiv Sessiyalar
                </h3>
                <div className="space-y-4">
                    {sessionsLoading ? (
                        <div className="text-gray-400 text-center py-4">Sessiyalar yüklənir...</div>
                    ) : sessions.length > 0 ? (
                        sessions.map(s => (
                            <div key={s.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 border border-gray-100">
                                        <Smartphone size={18} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800 text-sm">{s.device}</div>
                                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">
                                            Son fəaliyyət: {new Date(s.created_at).toLocaleString('az-AZ')}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => revokeMutation.mutate(s.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="Sessiyanı sonlandır"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-gray-400 text-center py-4 text-sm font-medium">Aktiv sessiya tapılmadı.</div>
                    )}
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50/30 p-8 rounded-3xl border border-red-100 space-y-6">
                <h3 className="font-black text-red-600 flex items-center gap-3 text-lg tracking-tight">
                    <div className="p-2 bg-red-100 rounded-lg text-red-600"><Trash2 size={20} /></div>
                    Hesabı Sil
                </h3>
                <p className="text-sm text-red-600/70 max-w-2xl leading-relaxed font-medium">
                    Hesabınızı sildiyiniz təqdirdə bütün biznes məlumatlarınız, fakturalarınız və müştəri siyahılarınız <b>daimi olaraq</b> silinəcək. Bu əməliyyat geri qaytarıla bilməz.
                </p>
                <button
                    onClick={() => {
                        if (confirm('Hesabınızı və bütün məlumatlarınızı silmək istədiyinizə əminsiniz?')) {
                            deleteMutation.mutate();
                        }
                    }}
                    className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-200 transition-all font-bold"
                >
                    Hesabı Tamamilə Sil
                </button>
            </div>
        </div>
    );
};

export default SecuritySettings;
