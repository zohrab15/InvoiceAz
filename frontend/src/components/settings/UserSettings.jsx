import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import client from '../../api/client';
import { useToast } from '../Toast';
import { Save, User, Mail, Phone, Upload, Check } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import PhoneInput from '../common/PhoneInput';

const UserSettings = () => {
    const { user, setAuth, token } = useAuthStore();
    const showToast = useToast();
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                phone: user.phone || '',
            });
            if (user.avatar) {
                setAvatarPreview(user.avatar.startsWith('http') ? user.avatar : `${API_URL}${user.avatar}`);
            }
        }
    }, [user]);

    const mutation = useMutation({
        mutationFn: (data) => {
            const fd = new FormData();
            Object.keys(data).forEach(key => {
                if (data[key] !== null && data[key] !== undefined) {
                    fd.append(key, data[key]);
                }
            });
            if (avatarFile) {
                fd.append('avatar', avatarFile);
            }
            return client.patch('/auth/user/', fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        },
        onSuccess: (response) => {
            showToast('Profil məlumatları yeniləndi!');
            setAuth(response.data, token);
            setAvatarFile(null);
        },
        onError: (error) => {
            console.error('User profile update error:', error);
            showToast('Xəta baş verdi. Yenidən yoxlayın.', 'error');
        }
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAvatarChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
                <div className="flex flex-col items-center pb-6 border-b border-gray-50">
                    <div className="relative group">
                        <div className="w-24 h-24 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 border-2 border-dashed border-gray-200 overflow-hidden group-hover:border-[var(--color-brand)] transition-colors">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <User size={32} />
                            )}
                        </div>
                        <label className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-2 rounded-xl cursor-pointer hover:bg-[var(--color-brand)] transition-colors shadow-lg">
                            <Upload size={16} />
                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                        </label>
                    </div>
                    <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Profil Şəkli</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Ad</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--color-brand)]" size={18} />
                            <input
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-[var(--color-brand)] focus:bg-white rounded-xl p-3 pl-12 outline-none transition-all font-bold"
                                placeholder="Adınız"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Soyad</label>
                        <input
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-[var(--color-brand)] focus:bg-white rounded-xl p-3 outline-none transition-all font-bold"
                            placeholder="Soyadınız"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">E-poçt (Dəyişdirilə bilməz)</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                            <input
                                value={formData.email}
                                disabled
                                className="w-full bg-gray-100 border-2 border-transparent rounded-xl p-3 pl-12 outline-none text-gray-400 font-bold"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <PhoneInput
                            label="Telefon"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={mutation.isPending}
                        className="bg-[var(--color-brand)] text-white px-8 py-3 rounded-xl flex items-center space-x-2 hover:bg-[var(--color-brand-dark)] shadow-xl shadow-[var(--color-brand-shadow)] transition-all font-bold text-sm disabled:opacity-50"
                    >
                        {mutation.isPending ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        ) : mutation.isSuccess ? <Check size={20} /> : <Save size={20} />}
                        <span>
                            {mutation.isPending
                                ? 'Yadda saxlanılır...'
                                : mutation.isSuccess
                                    ? 'Yadda saxlanıldı'
                                    : 'Mənim profilimi yadda saxla'}
                        </span>
                    </motion.button>
                </div>
            </div>
        </form>
    );
};

export default UserSettings;
