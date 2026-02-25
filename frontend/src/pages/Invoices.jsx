import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { API_URL } from '../config';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import clientApi from '../api/client';
import { useToast } from '../components/Toast';
import { Plus, Trash2, Send, Save, Eye, MessageSquare, List, ArrowLeft, Download, Edit2, CheckCircle, FileText, Check, Search, Filter, X, Lock, QrCode } from 'lucide-react';
import UpgradeModal from '../components/UpgradeModal';
import AddPaymentModal from '../components/AddPaymentModal';
import ProductQRScanner from '../components/ProductQRScanner';
import { translateError } from '../api/translateErrors';
import * as XLSX from 'xlsx';
import usePlanLimits from '../hooks/usePlanLimits';
import useAuthStore from '../store/useAuthStore';

const UNIT_CHOICES = [
    { value: 'ədəd', label: 'Ədəd' },
    { value: 'kq', label: 'Kq' },
    { value: 'qram', label: 'Qram' },
    { value: 'litr', label: 'Litr' },
    { value: 'metr', label: 'Metr' },
    { value: 'm2', label: 'm²' },
    { value: 'm3', label: 'm³' },
    { value: 'qutu', label: 'Qutu' },
    { value: 'saat', label: 'Saat' },
    { value: 'gün', label: 'Gün' },
    { value: 'ay', label: 'Ay' },
    { value: 'xidmət', label: 'Xidmət' }
];

const THEME_CHOICES = [
    { value: 'modern', label: 'Müasir' },
    { value: 'classic', label: 'Klassik' },
    { value: 'minimal', label: 'Minimal' }
];

const CURRENCY_SYMBOLS = {
    'AZN': '₼',
    'USD': '$',
    'EUR': '€',
    'TRY': '₺',
    'RUB': '₽',
    'GBP': '£'
};

const CURRENCY_CHOICES = [
    { value: 'AZN', label: 'AZN (₼)' },
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'TRY', label: 'TRY (₺)' },
    { value: 'RUB', label: 'RUB (₽)' },
    { value: 'GBP', label: 'GBP (£)' }
];

const Invoices = () => {
    const { activeBusiness } = useBusiness();
    const queryClient = useQueryClient();
    const showToast = useToast();
    const { token, user } = useAuthStore();
    const { checkLimit, isPro, canUseThemes } = usePlanLimits();
    const [upgradeConfig, setUpgradeConfig] = useState({ isOpen: false, title: '', message: '' });

    const isOwnerOrManager = activeBusiness?.user_role === 'OWNER' || activeBusiness?.user_role === 'MANAGER';
    const isAccountant = activeBusiness?.user_role === 'ACCOUNTANT';
    const canManageInvoices = isOwnerOrManager || isAccountant;

    const [view, setView] = useState('list'); // 'list' or 'create'
    const [editInvoice, setEditInvoice] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [showSendModal, setShowSendModal] = useState(false);
    const [savedInvoice, setSavedInvoice] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentInvoice, setPaymentInvoice] = useState(null);
    const [triggerSendModal, setTriggerSendModal] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
    const previewRef = useRef(null);

    useEffect(() => {
        if (showPreview && previewRef.current) {
            // Delay to ensure the section is rendered before scrolling
            const timer = setTimeout(() => {
                previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [showPreview]);

    // Filter & Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);

    // Form State
    const [items, setItems] = useState([{ description: '', quantity: 1, unit_price: 0, tax_rate: 18, unit: 'ədəd' }]);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [notes, setNotes] = useState('');
    const [invoiceTheme, setInvoiceTheme] = useState('modern');
    const [currency, setCurrency] = useState('AZN');

    const handleCreateNew = () => {
        resetForm();
        if (activeBusiness?.default_currency) {
            setCurrency(activeBusiness.default_currency);
        }
        if (activeBusiness?.default_invoice_theme) {
            setInvoiceTheme(activeBusiness.default_invoice_theme);
        }
        setView('create');
    };

    const { data: invoices, isLoading: isLoadingInvoices } = useQuery({
        queryKey: ['invoices', activeBusiness?.id, page, searchTerm, statusFilter],
        queryFn: async () => {
            const res = await clientApi.get('/invoices/', {
                params: {
                    page,
                    search: searchTerm || undefined,
                    // Status filter is currently handled locally in useMemo, 
                    // but we could pass it to backend if needed.
                }
            });
            return res.data;
        },
        enabled: !!activeBusiness,
        retry: false,
    });

    const invoicesData = invoices?.results || (Array.isArray(invoices) ? invoices : []);
    const totalCount = invoices?.count || invoicesData.length || 0;
    const totalPages = Math.ceil(totalCount / 50);

    const handleSearchChange = (val) => {
        setSearchTerm(val);
        setPage(1);
    };

    const filteredInvoices = useMemo(() => {
        if (!invoicesData) return [];
        return invoicesData.filter(inv => {
            const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
            return matchesStatus;
        });
    }, [invoicesData, statusFilter]);

    const { data: clients } = useQuery({
        queryKey: ['clients', 'dropdown', activeBusiness?.id],
        queryFn: async () => {
            const res = await clientApi.get('/clients/all/dropdown/');
            return res.data;
        },
        enabled: !!activeBusiness,
        retry: false,
    });

    const { data: products } = useQuery({
        queryKey: ['products', activeBusiness?.id],
        queryFn: async () => {
            const res = await clientApi.get('/inventory/all/');
            return res.data;
        },
        enabled: !!activeBusiness,
        retry: false,
    });

    const { data: teamMembers } = useQuery({
        queryKey: ['team', token],
        queryFn: async () => {
            const res = await clientApi.get('/users/team/');
            return res.data;
        },
        enabled: !!token && user?.membership === 'Premium',
        retry: false,
    });

    const createMutation = useMutation({
        mutationFn: (data) => clientApi.post('/invoices/', data),
        onSuccess: (res) => {
            queryClient.invalidateQueries(['invoices']);
            showToast('Faktura yaradıldı!');
            const inv = res.data;
            if (triggerSendModal) {
                setSavedInvoice(inv);
                setShowSendModal(true);
                setTriggerSendModal(false);
            }
            setView('list');
            resetForm();
        },
        onError: (error) => {
            console.error("Create Invoice Error:", error);
            const data = error.response?.data;
            if (data?.code === 'plan_limit' || (data?.detail && String(data.detail).includes('limit'))) {
                setUpgradeConfig({
                    isOpen: true,
                    title: 'Faktura limitinə çatdınız! 🚀',
                    message: `Hazırkı planınızda maksimum ${checkLimit('invoices')?.limit} faktura yarada bilərsiniz.`
                });
            } else {
                showToast(translateError(error), 'error');
            }
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data) => clientApi.put(`/invoices/${data.id}/`, data),
        onSuccess: (res) => {
            queryClient.invalidateQueries(['invoices']);
            showToast('Faktura yeniləndi!');
            const inv = res.data;
            if (triggerSendModal) {
                setSavedInvoice(inv);
                setShowSendModal(true);
                setTriggerSendModal(false);
            }
            setView('list');
            resetForm();
        },
        onError: (err) => showToast(translateError(err), 'error')
    });

    const duplicateMutation = useMutation({
        mutationFn: (id) => clientApi.post(`/invoices/${id}/duplicate/`),
        onSuccess: () => {
            queryClient.invalidateQueries(['invoices']);
            showToast('Faktura dublikat edildi!');
        },
        onError: (err) => showToast(translateError(err), 'error')
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => clientApi.patch(`/invoices/${id}/`, { status }),
        onSuccess: () => queryClient.invalidateQueries(['invoices']),
        onError: (err) => showToast(translateError(err), 'error')
    });

    const markAsSentMutation = useMutation({
        mutationFn: (id) => clientApi.post(`/invoices/${id}/mark_as_sent/`),
        onSuccess: () => queryClient.invalidateQueries(['invoices']),
        onError: (err) => showToast(translateError(err), 'error')
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => clientApi.delete(`/invoices/${id}/`),
        onSuccess: () => queryClient.invalidateQueries(['invoices']),
        onError: (err) => showToast(translateError(err), 'error')
    });

    const handleAddPayment = async (paymentData) => {
        try {
            await clientApi.post('/invoices/payments/', paymentData);
            queryClient.invalidateQueries(['invoices']);
            showToast('Ödəniş uğurla qeyd edildi!');
        } catch (error) {
            console.error('Payment error:', error);
            showToast(translateError(error, 'Ödəniş qeyd edilərkən xəta baş verdi'), 'error');
        }
    };

    const handleEdit = (inv) => {
        if (inv.status !== 'draft') {
            showToast('Yalnız qaralama statusunda olan fakturaları redaktə etmək olar', 'error');
            return;
        }
        setEditInvoice(inv);
        setSelectedClientId(inv.client);
        setInvoiceDate(inv.invoice_date);
        setDueDate(inv.due_date);
        setNotes(inv.notes || '');
        setInvoiceTheme(inv.invoice_theme || 'modern');
        setCurrency(inv.currency || 'AZN');
        setItems(inv.items.length > 0 ? inv.items.map(item => ({
            ...item,
            quantity: Number(item.quantity) || 0,
            unit_price: Number(item.unit_price) || 0,
            tax_rate: Number(item.tax_rate) || 0
        })) : [{ description: '', quantity: 1, unit_price: 0, tax_rate: 18, unit: 'pcs' }]);
        setView('create');
    };

    const resetForm = () => {
        setItems([{ description: '', quantity: 1, unit_price: 0, tax_rate: 18, unit: 'ədəd' }]);
        setSelectedClientId('');
        setInvoiceDate(new Date().toISOString().split('T')[0]);
        setDueDate('');
        setNotes('');
        setInvoiceTheme('modern');
        setCurrency(activeBusiness?.default_currency || 'AZN');
        setEditInvoice(null);
        setShowPreview(false);
    };

    const handleSave = (status = 'draft', triggerSend = false) => {
        if (createMutation.isPending || updateMutation.isPending) return;
        if (!selectedClientId) return showToast('Müştəri seçin', 'error');

        // Filter out empty items
        const validItems = items.filter(item => item.description.trim() !== '');

        if (validItems.length === 0) {
            return showToast('Ən azı bir məhsul daxil edilməlidir', 'error');
        }

        setTriggerSendModal(triggerSend);
        const data = {
            id: editInvoice?.id,
            client: selectedClientId,
            invoice_date: invoiceDate,
            due_date: dueDate || invoiceDate,
            notes,
            invoice_theme: invoiceTheme,
            currency,
            status: (triggerSend && (!editInvoice || editInvoice.status === 'draft')) ? 'finalized' : (editInvoice ? editInvoice.status : status),
            items: validItems.map((item, index) => ({
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                tax_rate: item.tax_rate,
                unit: item.unit,
                product: item.product,
                order: index
            })),
        };

        if (editInvoice) {
            updateMutation.mutate(data);
        } else {
            createMutation.mutate(data);
        }
    };

    const addItem = () => setItems([...items, { description: '', quantity: 1, unit_price: 0, tax_rate: 18, unit: 'ədəd', product: null }]);
    const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

    const updateItem = (index, field, value) => {
        const newItems = [...items];

        if (field === 'product_id') {
            const product = products?.find(p => String(p.id) === String(value));
            if (product) {
                newItems[index] = {
                    ...newItems[index],
                    product: product.id,
                    description: product.name,
                    unit_price: parseFloat(product.base_price),
                    unit: product.unit || 'ədəd'
                };
            } else {
                newItems[index].product = null;
            }
        } else {
            newItems[index][field] = value;
        }

        setItems(newItems);
    };

    const handleQRScan = (result) => {
        setIsQRScannerOpen(false);
        const productsData = Array.isArray(products) ? products : (products?.results || []);
        const found = productsData.find(p => p.sku === result);

        if (found) {
            // Find first empty item or create new
            const emptyIndex = items.findIndex(item => !item.description && !item.product);
            if (emptyIndex !== -1) {
                updateItem(emptyIndex, 'product_id', found.id);
            } else {
                setItems([...items, {
                    product: found.id,
                    description: found.name,
                    quantity: 1,
                    unit_price: parseFloat(found.base_price),
                    tax_rate: 18,
                    unit: found.unit || 'ədəd'
                }]);
            }
            showToast(`${found.name} əlavə edildi`);
        } else {
            showToast('Bu SKU kodu ilə məhsul tapılmadı', 'warning');
        }
    };

    const calculateSubtotal = () => items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0);
    const calculateTax = () => items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price) * (Number(item.tax_rate) / 100)), 0);
    const calculateTotal = () => calculateSubtotal() + calculateTax();

    const handleDownloadPdf = (id) => {
        const inv = invoicesData.find(i => i.id === id);
        if (inv && inv.share_token) {
            const url = `${API_URL}/api/invoices/public/${inv.share_token}/pdf/`;
            window.open(url, '_blank');
        } else {
            // Fallback to ID-based if token missing
            const url = `${API_URL}/api/invoices/${id}/pdf/?business_id=${activeBusiness?.id}`;
            window.open(url, '_blank');
        }
    };

    const handleWhatsApp = (inv) => {
        const targetInvoice = inv || editInvoice;
        if (!targetInvoice) return;

        const phone = targetInvoice.client_phone;
        if (!phone) return showToast('Müştərinin telefon nömrəsi yoxdur', 'error');

        const publicUrl = `${window.location.origin}/view/${targetInvoice.share_token}`;
        const currencySymbol = CURRENCY_SYMBOLS[targetInvoice.currency] || '₼';
        const text = `Salam! ${activeBusiness?.name} tərəfindən fakturanız hazırdır.\n\nMəbləğ: ${parseFloat(targetInvoice.total).toFixed(2)} ${currencySymbol}\nBaxmaq və ödəmək üçün link: ${publicUrl}`;

        if (!targetInvoice.sent_at) {
            markAsSentMutation.mutate(targetInvoice.id);
        }

        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) cleanPhone = '994' + cleanPhone.substring(1);
        if (cleanPhone.length === 9) cleanPhone = '994' + cleanPhone;

        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const handleSendEmail = async (inv) => {
        const targetInvoice = inv || savedInvoice;
        if (!targetInvoice || sendingEmail) return;

        setSendingEmail(true);
        try {
            await clientApi.post(`/invoices/${targetInvoice.id}/send_email/`);
            showToast('Email uğurla göndərildi!');
            setShowSendModal(false);
        } catch (error) {
            console.error('Email error:', error);
            const detail = error.response?.data?.error || 'Email göndərilərkən xəta baş verdi';
            showToast(detail, 'error');
        } finally {
            setSendingEmail(false);
        }
    };

    const selectedClient = useMemo(() => clients?.find(c => String(c.id) === String(selectedClientId)), [clients, selectedClientId]);

    const InvoicePreview = () => (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-4 sm:p-8 shadow-2xl rounded-2xl border aspect-auto sm:aspect-[1/1.41] sticky top-8 text-gray-800"
        >
            <div className="flex justify-between border-b pb-6 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-primary-blue uppercase break-words max-w-[300px]">{activeBusiness?.name || 'ŞİRKƏT ADI'}</h1>
                    <p className="text-sm text-gray-500 mt-1">{activeBusiness?.address || 'Ünvan daxil edilməyib'}</p>
                    <p className="text-xs text-gray-400">VÖEN: {activeBusiness?.voen || '---'}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold uppercase tracking-widest text-gray-400">Faktura</h2>
                    <p className="text-sm font-semibold">{editInvoice?.invoice_number || 'YENİ'}</p>
                </div>
            </div>

            <div className="flex justify-between mb-8">
                <div>
                    <h3 className="text-xs font-bold uppercase text-gray-400 mb-1">Müştəri</h3>
                    <p className="font-semibold text-gray-900">{selectedClient?.name || 'Müştəri seçilməyib'}</p>
                    <p className="text-xs text-gray-500">{selectedClient?.address}</p>
                </div>
                <div className="text-right">
                    <div className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid var(--color-card-border)' }}>
                        <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Müddət</p>
                        <p className="text-sm">
                            {(() => {
                                if (!invoiceDate) return '---';
                                const d = new Date(invoiceDate);
                                if (isNaN(d.getTime())) return '---';
                                const m = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek'];
                                return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;
                            })()}
                        </p>
                    </div>
                </div>
            </div>

            <table className="w-full mb-8 text-sm">
                <thead>
                    <tr className="border-b-2 border-gray-100 text-left">
                        <th className="pb-2 py-2">Təsvir</th>
                        <th className="pb-2 text-center w-12">Sayı</th>
                        <th className="pb-2 text-right w-24">Qiymət</th>
                        <th className="pb-2 text-right w-24">Cəm</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {items.map((item, i) => (
                        <tr key={i}>
                            <td className="py-3">{item.description || '...'}</td>
                            <td className="py-3 text-center">{Number(item.quantity)} {item.unit}</td>
                            <td className="py-3 text-right">{Number(item.unit_price).toFixed(2)}</td>
                            <td className="py-3 text-right">{(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="ml-auto w-48 space-y-2 pt-4 border-t-2 border-gray-50">
                <div className="flex justify-between text-xs text-gray-500"><span>Cəm:</span><span>{calculateSubtotal().toFixed(2)} {CURRENCY_SYMBOLS[currency] || '₼'}</span></div>
                <div className="flex justify-between text-xs text-gray-500"><span>ƏDV (18%):</span><span>{calculateTax().toFixed(2)} {CURRENCY_SYMBOLS[currency] || '₼'}</span></div>
                <div className="flex justify-between font-bold text-gray-900 pt-2 border-t"><span>YEKUN:</span><span>{calculateTotal().toFixed(2)} {CURRENCY_SYMBOLS[currency] || '₼'}</span></div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-100 text-[10px] text-gray-400 italic leading-relaxed">
                {notes || activeBusiness?.bank_name ? `Qeyd: ${notes || activeBusiness?.bank_name}` : 'Qeyd: Bu faktura kompyuter vasitəsilə generasiya olunub. Zəhmət olmasa vaxtında ödəniş edin.'}
            </div>
        </motion.div>
    );

    return (
        <>
            <AnimatePresence mode="wait">
                {view === 'list' ? (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                    >
                        <div className="flex justify-between items-center">
                            <h2 className="text-3xl font-black text-[var(--color-text-primary)] tracking-tight font-roboto">Fakturalar</h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        const data = (filteredInvoices || []).map(inv => {
                                            const clientName = clients?.find(c => c.id === inv.client)?.name || 'Naməlum';
                                            return {
                                                'Faktura №': inv.invoice_number,
                                                'Müştəri': clientName,
                                                'Sahibi': inv.created_by_name || 'Owner',
                                                'Tarix': (() => {
                                                    const d = new Date(inv.invoice_date);
                                                    const m = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek'];
                                                    return !isNaN(d) ? `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}` : '';
                                                })(),
                                                'Son Tarix': (() => {
                                                    const d = new Date(inv.due_date);
                                                    const m = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek'];
                                                    return !isNaN(d) ? `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}` : '';
                                                })(),
                                                'Məbləğ': parseFloat(inv.total_amount),
                                                'Valyuta': CURRENCY_SYMBOLS[inv.currency] || '₼',
                                                'Status': inv.status === 'paid' ? 'Ödənilib' :
                                                    inv.status === 'sent' ? 'Göndərilib' :
                                                        inv.status === 'viewed' ? 'Baxılıb' :
                                                            inv.status === 'overdue' ? 'Gecikir' :
                                                                inv.status === 'cancelled' ? 'Ləğv edilib' : 'Qaralama'
                                            };
                                        });
                                        const ws = XLSX.utils.json_to_sheet(data);
                                        const wb = XLSX.utils.book_new();
                                        XLSX.utils.book_append_sheet(wb, ws, "Fakturalar");
                                        XLSX.writeFile(wb, `fakturalar_hesabati_${new Date().toISOString().split('T')[0]}.xlsx`);
                                    }}
                                    className="p-2 bg-[var(--color-card-bg)] border border-[var(--color-card-border)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-hover-bg)] transition-all font-bold text-sm flex items-center gap-2"
                                    title="Excel kimi yüklə"
                                >
                                    <Download size={18} />
                                    <span className="hidden sm:inline">Eksport</span>
                                </button>
                                <button
                                    onClick={handleCreateNew}
                                    className="bg-primary-blue text-white px-6 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 shadow-lg hover:shadow-blue-200 transition-all active:scale-95"
                                >
                                    <Plus size={20} />
                                    <span>Yeni Faktura</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 mb-6 bg-[var(--color-card-bg)] p-4 rounded-xl border border-[var(--color-card-border)] shadow-sm items-center">
                            <div className="relative flex-1 group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-text-muted)] group-focus-within:text-primary-blue transition-colors">
                                    <Search size={18} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Faktura # və ya Müştəri axtar..."
                                    className="block w-full pl-11 pr-4 py-3 bg-[var(--color-input-bg)] border-2 border-[var(--color-input-border)] rounded-xl text-sm placeholder-[var(--color-text-muted)] text-[var(--color-text-primary)] focus:outline-none focus:ring-0 focus:bg-[var(--color-card-bg)] focus:border-primary-blue transition-all"
                                    value={searchTerm}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <div className="relative flex-1 md:w-48 group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-blue transition-colors">
                                        <Filter size={18} />
                                    </div>
                                    <select
                                        className="block w-full pl-11 pr-4 py-3 bg-[var(--color-input-bg)] border-2 border-[var(--color-input-border)] rounded-xl text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-0 focus:bg-[var(--color-card-bg)] focus:border-primary-blue transition-all appearance-none cursor-pointer"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="all">Bütün Statuslar</option>
                                        <option value="paid">Ödənilib</option>
                                        <option value="sent">Göndərilib</option>
                                        <option value="viewed">Baxılıb</option>
                                        <option value="overdue">Gecikir</option>
                                        <option value="cancelled">Ləğv edilib</option>
                                        <option value="draft">Qaralama</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[var(--color-card-bg)] rounded-xl border border-[var(--color-card-border)] shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead className="bg-[var(--color-hover-bg)] text-[var(--color-text-muted)] text-xs uppercase font-semibold">
                                        <tr>
                                            <th className="px-6 py-4">Faktura #</th>
                                            <th className="px-6 py-4">Müştəri / Dəstə</th>
                                            <th className="px-6 py-4">Tarix</th>
                                            <th className="px-6 py-4">Məbləğ</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Əməliyyatlar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {isLoadingInvoices ? (
                                            <tr><td colSpan="6" className="p-12 text-center text-gray-400">Melumat Yuklenir...</td></tr>
                                        ) : filteredInvoices.length === 0 ? (
                                            <tr><td colSpan="6" className="p-12 text-center text-gray-400">Faktura tapılmadı</td></tr>
                                        ) : filteredInvoices.map((inv) => (
                                            <motion.tr
                                                layout
                                                key={inv.id}
                                                className="hover:bg-[var(--color-hover-bg)] transition-colors group"
                                            >
                                                <td className="px-6 py-4 font-medium text-primary-blue">{inv.invoice_number}</td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-[var(--color-text-primary)]">{inv.client_name}</div>
                                                    {user?.membership === 'Premium' && inv.created_by_name && (
                                                        <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5 uppercase font-bold tracking-tight bg-[var(--color-hover-bg)] px-2 py-0.5 rounded max-w-max">
                                                            🧑‍💼 {inv.created_by_name}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-[var(--color-text-secondary)]">
                                                    {(() => {
                                                        const d = new Date(inv.invoice_date);
                                                        if (isNaN(d.getTime())) return '---';
                                                        const m = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek'];
                                                        return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;
                                                    })()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-[var(--color-text-primary)]">{parseFloat(inv.total).toFixed(2)} {CURRENCY_SYMBOLS[inv.currency] || '₼'}</span>
                                                        {parseFloat(inv.paid_amount) > 0 && parseFloat(inv.paid_amount) < parseFloat(inv.total) && (
                                                            <span className="text-[10px] text-orange-500 font-bold">Ödənilib: {parseFloat(inv.paid_amount).toFixed(2)} {CURRENCY_SYMBOLS[inv.currency] || '₼'}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${inv.status === 'paid' ? 'bg-green-100 text-green-700 border border-green-200' :
                                                        inv.status === 'viewed' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                                                            inv.status === 'sent' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                                                inv.status === 'finalized' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' :
                                                                    inv.status === 'overdue' ? 'bg-red-100 text-red-700 border border-red-200' :
                                                                        inv.status === 'cancelled' ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                                                                            'bg-gray-100 text-gray-600 border border-gray-200'
                                                        }`}>
                                                        {inv.status === 'paid' ? 'Ödənilib' :
                                                            inv.status === 'viewed' ? 'Baxıldı' :
                                                                inv.status === 'sent' ? 'Göndərilib' :
                                                                    inv.status === 'finalized' ? 'Təsdiqləndi' :
                                                                        inv.status === 'overdue' ? 'Gecikir' :
                                                                            inv.status === 'cancelled' ? 'Ləğv edilib' : 'Qaralama'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-1">
                                                    <div className="flex justify-end space-x-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => {
                                                                const canPay = ['sent', 'viewed', 'overdue', 'finalized'].includes(inv.status);
                                                                if (!canPay) return;
                                                                setPaymentInvoice(inv);
                                                                setShowPaymentModal(true);
                                                            }}
                                                            title={inv.status === 'draft' ? "Qaralama statusunda olan fakturaya ödəniş əlavə etmək olmaz" :
                                                                inv.status === 'paid' ? "Bu faktura tam ödənilib" :
                                                                    inv.status === 'cancelled' ? "Ləğv edilmiş fakturaya ödəniş əlavə etmək olmaz" : "Ödəniş Əlavə Et"}
                                                            disabled={!['sent', 'viewed', 'overdue', 'finalized'].includes(inv.status)}
                                                            className={`p-2 rounded-lg transition-colors ${!['sent', 'viewed', 'overdue', 'finalized'].includes(inv.status) ? 'text-gray-300 cursor-not-allowed' : 'text-green-600 hover:bg-green-50'}`}
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(inv)}
                                                            title={inv.status !== 'draft' ? "Yalnız qaralama statusunda olan sənədlər redaktə edilə bilər" : "Redaktə"}
                                                            disabled={inv.status !== 'draft'}
                                                            className={`p-2 rounded-lg transition-colors ${inv.status !== 'draft' ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}`}
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>

                                                        {inv.status !== 'draft' && (
                                                            <button
                                                                onClick={() => { setSavedInvoice(inv); setShowSendModal(true); }}
                                                                title="Göndər"
                                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                            >
                                                                <Send size={18} />
                                                            </button>
                                                        )}

                                                        <button onClick={() => window.open(`${API_URL}/api/invoices/${inv.id}/etag_xml/`, '_blank')} title="E-Qaimə XML" className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"><FileText size={18} /></button>
                                                        <button onClick={() => handleDownloadPdf(inv.id)} title="Yüklə" className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><Download size={18} /></button>
                                                        <button onClick={() => duplicateMutation.mutate(inv.id)} title="Kopyala" className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"><List size={18} /></button>
                                                        {canManageInvoices && (
                                                            <button onClick={() => { if (window.confirm('Silinsin?')) deleteMutation.mutate(inv.id); }} title="Sil" className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {totalPages > 1 && (
                                <div className="p-4 border-t border-[var(--color-card-border)] bg-[var(--color-hover-bg)] flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                                        CƏMİ {totalCount} FAKTURA
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="px-4 py-2 rounded-xl font-bold text-sm bg-[var(--color-card-bg)] border border-[var(--color-card-border)] disabled:opacity-50 transition-all hover:border-blue-500 text-[var(--color-text-primary)]"
                                        >
                                            Əvvəlki
                                        </button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let pageNum;
                                                if (totalPages <= 5) pageNum = i + 1;
                                                else if (page <= 3) pageNum = i + 1;
                                                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                                                else pageNum = page - 2 + i;

                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setPage(pageNum)}
                                                        className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${page === pageNum ? 'bg-blue-600 text-white shadow-lg' : 'bg-[var(--color-card-bg)] border border-[var(--color-card-border)] text-[var(--color-text-secondary)] hover:border-blue-500'}`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <button
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                            className="px-4 py-2 rounded-xl font-bold text-sm bg-[var(--color-card-bg)] border border-[var(--color-card-border)] disabled:opacity-50 transition-all hover:border-blue-500 text-[var(--color-text-primary)]"
                                        >
                                            Növbəti
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="create"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-8"
                    >
                        <div className="flex flex-col sm:flex-row justify-between items-center bg-[var(--color-card-bg)] p-3 sm:p-4 rounded-xl border border-[var(--color-card-border)] shadow-sm sticky top-4 z-10 gap-4">
                            <div className="flex items-center space-x-3 w-full sm:w-auto">
                                <button onClick={() => setView('list')} className="p-2 hover:bg-[var(--color-hover-bg)] text-[var(--color-text-primary)] rounded-full transition-colors flex-shrink-0"><ArrowLeft size={20} className="sm:w-6 sm:h-6" /></button>
                                <h2 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)] truncate">{editInvoice ? 'Faktura Düzəlişi' : 'Yeni Hesab-faktura'}</h2>
                            </div>
                            <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                                <button
                                    onClick={() => setShowPreview(!showPreview)}
                                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-all text-xs sm:text-sm ${showPreview ? 'bg-gray-800 text-white' : 'bg-[var(--color-card-bg)] border border-[var(--color-card-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-hover-bg)]'}`}
                                >
                                    <Eye size={16} />
                                    <span className="whitespace-nowrap">{showPreview ? 'Yazı rejimi' : 'Ön baxış'}</span>
                                </button>
                                {!editInvoice && (
                                    <button
                                        onClick={() => handleSave('draft')}
                                        disabled={createMutation.isPending || updateMutation.isPending}
                                        className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-[var(--color-card-bg)] border border-[var(--color-card-border)] text-[var(--color-text-primary)] rounded-lg flex items-center justify-center space-x-2 transition-all shadow-sm text-xs sm:text-sm ${createMutation.isPending || updateMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--color-hover-bg)]'}`}
                                    >
                                        {(createMutation.isPending || updateMutation.isPending) && !triggerSendModal ? (
                                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Save size={16} />
                                        )}
                                        <span className="whitespace-nowrap">Qaralama</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => handleSave('draft', true)}
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className={`flex-grow sm:flex-none bg-primary-blue text-white px-4 sm:px-6 py-2 rounded-lg flex items-center justify-center space-x-2 shadow-md transform active:scale-95 transition-all text-xs sm:text-sm font-bold ${createMutation.isPending || updateMutation.isPending ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                                >
                                    {(createMutation.isPending || updateMutation.isPending) && triggerSendModal ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Send size={16} />
                                    )}
                                    <span className="whitespace-nowrap">{!editInvoice || editInvoice.status === 'draft' ? 'Yadda saxla və Göndər' : 'Yadda saxla'}</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            <div className={`${showPreview ? 'lg:col-span-7' : 'lg:col-span-8'} space-y-6 transition-all duration-500 order-1`}>
                                <div className="bg-[var(--color-card-bg)] p-6 rounded-xl border border-[var(--color-card-border)] space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="md:col-span-1">
                                            <label className="block text-xs font-bold text-[var(--color-text-muted)] uppercase mb-2">Müştəri seçimi</label>
                                            <select
                                                className="w-full border-2 border-[var(--color-input-border)] rounded-xl p-3 focus:border-primary-blue outline-none transition-all cursor-pointer bg-[var(--color-input-bg)] hover:bg-[var(--color-card-bg)] text-sm font-bold text-[var(--color-text-primary)]"
                                                value={selectedClientId}
                                                onChange={(e) => setSelectedClientId(e.target.value)}
                                            >
                                                <option value="">Axtarış...</option>
                                                {clients?.map(c => {
                                                    const assignedRep = teamMembers?.find(m => m.user === c.assigned_to);
                                                    return (
                                                        <option key={c.id} value={c.id}>
                                                            {c.name} {assignedRep ? `(${assignedRep.user_name})` : ''}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                        <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4 text-[var(--color-text-primary)]">
                                            <div>
                                                <label className="block text-xs font-bold text-[var(--color-text-muted)] uppercase mb-2">Tarix</label>
                                                <input type="date" className="w-full border-2 border-[var(--color-input-border)] rounded-xl p-3 focus:border-primary-blue outline-none bg-[var(--color-input-bg)] hover:bg-[var(--color-card-bg)] text-sm font-bold" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-[var(--color-text-muted)] uppercase mb-2">Son Tarix</label>
                                                <input type="date" className="w-full border-2 border-[var(--color-input-border)] rounded-xl p-3 focus:border-primary-blue outline-none bg-[var(--color-input-bg)] hover:bg-[var(--color-card-bg)] text-sm font-bold" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-[var(--color-text-muted)] uppercase mb-2">Valyuta</label>
                                                <select
                                                    className="w-full border-2 border-[var(--color-input-border)] rounded-xl p-3 focus:border-primary-blue outline-none bg-[var(--color-input-bg)] hover:bg-[var(--color-card-bg)] text-sm font-bold"
                                                    value={currency}
                                                    onChange={(e) => setCurrency(e.target.value)}
                                                >
                                                    {CURRENCY_CHOICES.map(c => (
                                                        <option key={c.value} value={c.value}>{c.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-[var(--color-text-muted)] uppercase mb-2 flex items-center gap-2">
                                                    Dizayn
                                                    {!canUseThemes && <Lock size={12} className="text-[var(--color-text-muted)]" />}
                                                </label>
                                                <div className="relative group/theme">
                                                    <select
                                                        disabled={!canUseThemes}
                                                        className={`w-full border-2 border-[var(--color-input-border)] rounded-xl p-3 focus:border-primary-blue outline-none transition-all cursor-pointer bg-[var(--color-input-bg)] hover:bg-[var(--color-card-bg)] text-sm font-bold ${!canUseThemes ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        value={invoiceTheme}
                                                        onChange={(e) => setInvoiceTheme(e.target.value)}
                                                    >
                                                        {THEME_CHOICES.map(t => (
                                                            <option key={t.value} value={t.value}>{t.label}</option>
                                                        ))}
                                                    </select>
                                                    {!canUseThemes && (
                                                        <div onClick={() => setUpgradeConfig({
                                                            isOpen: true,
                                                            title: 'Professional Dizaynlar 🎨',
                                                            message: 'Faktura mövzularını dəyişmək və brendinizə uyğun özəl dizaynlar seçmək üçün Pro plana keçin.'
                                                        })} className="absolute inset-0 cursor-pointer z-10" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[var(--color-card-bg)] p-6 rounded-xl border border-[var(--color-card-border)] space-y-6">
                                    <div className="flex justify-between items-center border-b border-[var(--color-card-border)] pb-4">
                                        <h3 className="font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                                            <List size={18} className="text-primary-blue" /> Məhsul Siyahısı
                                        </h3>
                                        <button
                                            onClick={() => setIsQRScannerOpen(true)}
                                            className="px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-emerald-500/20 transition-all"
                                        >
                                            <QrCode size={16} />
                                            <span>QR Skan</span>
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        <AnimatePresence>
                                            {items.map((item, index) => (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    key={index}
                                                    className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-[var(--color-hover-bg)] p-4 rounded-xl hover:bg-[var(--color-card-bg)] border border-transparent hover:border-[var(--color-card-border)] transition-all group shadow-sm"
                                                >
                                                    <div className="flex-1 space-y-1">
                                                        <select
                                                            className="w-full bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-lg p-2 text-xs font-bold text-[var(--color-text-primary)] focus:border-blue-500 outline-none"
                                                            value={item.product || ''}
                                                            onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                                                        >
                                                            <option value="">-- Məhsul Seçin (Opsional) --</option>
                                                            {products?.map(p => (
                                                                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                                            ))}
                                                        </select>
                                                        <input
                                                            type="text"
                                                            className="w-full bg-transparent border-none rounded-lg p-1 text-sm font-bold text-[var(--color-text-primary)] focus:ring-0 placeholder:[var(--color-text-muted)] placeholder:font-normal"
                                                            placeholder="Və ya əllə daxil edin..."
                                                            value={item.description}
                                                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="w-full sm:w-24">
                                                        <label className="sm:hidden text-[10px] font-bold text-[var(--color-text-muted)] uppercase mb-1 block">Miqdar</label>
                                                        <div className="relative">
                                                            <input min="1" type="number" className="w-full bg-[var(--color-input-bg)] border-none rounded-lg p-2 pr-10 text-sm text-center font-bold text-[var(--color-text-primary)]" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 1)} />
                                                            <span className="absolute right-2 top-2.5 text-[10px] font-black uppercase text-[var(--color-text-muted)] pointer-events-none">
                                                                {item.unit || 'ədəd'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="w-full sm:w-32 relative">
                                                        <label className="sm:hidden text-[10px] font-bold text-[var(--color-text-muted)] uppercase mb-1 block">Qiymət</label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-2 text-xs text-[var(--color-text-muted)] font-bold">{CURRENCY_SYMBOLS[currency] || '₼'}</span>
                                                            <input type="number" className="w-full bg-[var(--color-input-bg)] border-none rounded-lg p-2 pl-10 text-sm font-bold text-[var(--color-text-primary)]" value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)} />
                                                        </div>
                                                    </div>
                                                    <div className="w-full sm:w-24 text-right font-bold text-primary-blue text-sm flex justify-between items-center sm:block border-t sm:border-t-0 pt-3 sm:pt-0 mt-2 sm:mt-0 italic sm:not-italic">
                                                        <span className="sm:hidden text-gray-400 font-bold uppercase text-[10px]">Cəm:</span>
                                                        <span className="text-base sm:text-sm">{(item.quantity * item.unit_price).toFixed(2)} {CURRENCY_SYMBOLS[currency] || '₼'}</span>
                                                    </div>
                                                    <button onClick={() => removeItem(index)} className="p-2 text-[var(--color-text-muted)] hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10 self-end sm:self-center mt-2 sm:mt-0"><Trash2 size={20} /></button>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        <button onClick={addItem} className="w-full py-3 border-2 border-dashed border-[var(--color-card-border)] rounded-xl text-[var(--color-text-secondary)] font-bold hover:border-primary-blue hover:text-primary-blue transition-all flex justify-center items-center gap-2 active:bg-blue-50/10">
                                            <Plus size={18} /><span>Yeni sətir</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-[var(--color-card-bg)] p-6 rounded-xl border border-[var(--color-card-border)] shadow-sm space-y-4">
                                    <h3 className="font-bold text-[var(--color-text-primary)] border-b border-[var(--color-card-border)] pb-4 flex items-center gap-2">
                                        <FileText size={18} className="text-primary-blue" /> Qeydlər
                                    </h3>
                                    <textarea
                                        className="w-full bg-[var(--color-input-bg)] border-2 border-[var(--color-input-border)] rounded-xl p-4 text-sm text-[var(--color-text-primary)] focus:border-primary-blue outline-none transition-all placeholder:[var(--color-text-muted)]"
                                        rows="3"
                                        placeholder="Faktura qeydlərini bura daxil edin (məs: Bank məlumatları, ödəniş sertləri və s.)..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    ></textarea>
                                </div>
                            </div>

                            <div ref={previewRef} className={`${showPreview ? 'lg:col-span-5' : 'lg:col-span-4'} space-y-6 order-2`}>
                                {showPreview ? (
                                    <InvoicePreview />
                                ) : (
                                    <>
                                        <div className="bg-[var(--color-card-bg)] p-6 rounded-xl border border-[var(--color-card-border)] shadow-sm space-y-4">
                                            <h3 className="font-bold text-[var(--color-text-primary)] border-b border-[var(--color-card-border)] pb-4">Xülasə</h3>
                                            <div className="space-y-4">
                                                <div className="flex justify-between text-[var(--color-text-secondary)] font-medium"><span>Cəm:</span><span>{calculateSubtotal().toFixed(2)} {CURRENCY_SYMBOLS[currency] || '₼'}</span></div>
                                                <div className="flex justify-between text-[var(--color-text-secondary)] font-medium"><span>ƏDV (18%):</span><span>{calculateTax().toFixed(2)} {CURRENCY_SYMBOLS[currency] || '₼'}</span></div>
                                                <div className="flex justify-between text-2xl font-black border-t-2 border-[var(--color-hover-bg)] pt-4 text-[var(--color-text-primary)] italic"><span>YEKUN:</span><span className="text-primary-blue">{calculateTotal().toFixed(2)} {CURRENCY_SYMBOLS[currency] || '₼'}</span></div>
                                            </div>
                                        </div>

                                        <div className="bg-[var(--color-card-bg)] p-6 rounded-xl border border-[var(--color-card-border)] shadow-sm space-y-4">
                                            <h3 className="font-bold text-[var(--color-text-primary)] border-b border-[var(--color-card-border)] pb-4 shrink-0 flex items-center gap-2"><List size={18} className="text-primary-blue" /> Sürətli Keçid</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[var(--color-text-primary)]">
                                                <button
                                                    onClick={() => {
                                                        const target = editInvoice || savedInvoice;
                                                        if (!target) return showToast('Əvvəlcə yadda saxlayın', 'error');
                                                        const url = `${window.location.origin}/view/${target.share_token}`;
                                                        navigator.clipboard.writeText(url);
                                                        showToast('Link kopyalandı!');
                                                    }}
                                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all gap-2 group ${editInvoice || savedInvoice ? 'bg-blue-50/10 text-blue-500 border-blue-500/20 hover:bg-blue-50/20' : 'bg-[var(--color-hover-bg)] text-[var(--color-text-muted)] border-[var(--color-card-border)] cursor-not-allowed'}`}
                                                >
                                                    <FileText size={24} className="group-hover:scale-110 transition-transform" />
                                                    <span className="text-xs font-bold uppercase tracking-tighter">Linki Kopyala</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const target = editInvoice || savedInvoice;
                                                        if (!target) return showToast('Əvvəlcə yadda saxlayın', 'error');
                                                        handleDownloadPdf(target.id);
                                                    }}
                                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all gap-2 group ${editInvoice || savedInvoice ? 'bg-indigo-50/10 text-indigo-500 border-indigo-500/20 hover:bg-indigo-50/20' : 'bg-[var(--color-hover-bg)] text-[var(--color-text-muted)] border-[var(--color-card-border)] cursor-not-allowed'}`}
                                                >
                                                    <Download size={24} className="group-hover:scale-110 transition-transform" />
                                                    <span className="text-xs font-bold uppercase tracking-tighter">PDF Yüklə</span>
                                                </button>
                                            </div>
                                        </div>

                                        {selectedClient && (
                                            <div className="bg-[var(--color-card-bg)] p-6 rounded-xl border border-[var(--color-card-border)] shadow-sm space-y-4">
                                                <h3 className="font-bold text-[var(--color-text-primary)] border-b border-[var(--color-card-border)] pb-4 shrink-0 flex items-center gap-2"><CheckCircle size={18} className="text-green-500" /> Müştəri Məlumatı</h3>
                                                <div className="space-y-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Telefon</span>
                                                        <span className="text-sm font-medium text-[var(--color-text-primary)]">{selectedClient.phone || 'Daxil edilməyib'}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">VÖEN</span>
                                                        <span className="text-sm font-medium text-[var(--color-text-primary)]">{selectedClient.voen || '---'}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Ünvan</span>
                                                        <span className="text-sm font-medium text-[var(--color-text-primary)] line-clamp-2">{selectedClient.address || '---'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {showSendModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[var(--color-card-bg)] rounded-2xl shadow-2xl w-full max-auto max-w-md overflow-hidden border border-[var(--color-card-border)]"
                        >
                            <div className="p-8 text-center space-y-6">
                                <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <CheckCircle size={40} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-[var(--color-text-primary)]">Faktura Hazırdır!</h3>
                                    <p className="text-[var(--color-text-secondary)] mt-2">Müştəriyə necə göndərmək istəyirsiniz?</p>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <button
                                        onClick={() => { handleWhatsApp(savedInvoice); setShowSendModal(false); }}
                                        className="flex items-center justify-between p-4 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500/20 transition-all border border-emerald-500/20 font-bold"
                                    >
                                        <div className="flex items-center gap-3">
                                            <MessageSquare size={20} />
                                            <span>WhatsApp ilə göndər</span>
                                        </div>
                                        <Plus size={16} className="rotate-45" />
                                    </button>

                                    <button
                                        onClick={() => {
                                            const url = `${window.location.origin}/view/${savedInvoice.share_token}`;
                                            navigator.clipboard.writeText(url);
                                            if (savedInvoice && !savedInvoice.sent_at) {
                                                markAsSentMutation.mutate(savedInvoice.id);
                                            }
                                            showToast('Link kopyalandı!');
                                            setShowSendModal(false);
                                        }}
                                        className="flex items-center justify-between p-4 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500/20 transition-all border border-blue-500/20 font-bold"
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText size={20} />
                                            <span>Linki Kopyala</span>
                                        </div>
                                        <Plus size={16} className="rotate-45" />
                                    </button>

                                    <button
                                        onClick={() => handleSendEmail(savedInvoice)}
                                        disabled={sendingEmail}
                                        className={`flex items-center justify-between p-4 rounded-xl transition-all border font-bold ${sendingEmail ? 'opacity-50 cursor-not-allowed' : 'bg-[var(--color-hover-bg)] text-[var(--color-text-primary)] hover:bg-[var(--color-card-bg)] border-[var(--color-card-border)]'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {sendingEmail ? (
                                                <div className="w-5 h-5 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Send size={20} />
                                            )}
                                            <span>{sendingEmail ? 'Göndərilir...' : 'Email ilə göndər'}</span>
                                        </div>
                                        {!sendingEmail && <Plus size={16} className="rotate-45" />}
                                    </button>

                                    <button
                                        onClick={() => setShowSendModal(false)}
                                        className="p-4 text-slate-400 text-sm font-medium hover:text-slate-600 transition-colors"
                                    >
                                        Daha sonra
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <AddPaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                invoice={paymentInvoice}
                onAddPayment={handleAddPayment}
            />
            <UpgradeModal
                isOpen={upgradeConfig.isOpen}
                onClose={() => setUpgradeConfig({ ...upgradeConfig, isOpen: false })}
                title={upgradeConfig.title}
                message={upgradeConfig.message}
                resourceName="Faktura"
                limit={checkLimit('invoices').limit}
            />
            {isQRScannerOpen && (
                <ProductQRScanner
                    onScan={handleQRScan}
                    onClose={() => setIsQRScannerOpen(false)}
                />
            )}
        </>
    );
};

export default Invoices;
