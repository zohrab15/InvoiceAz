import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { API_URL } from '../config';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import clientApi from '../api/client';
import { useToast } from '../components/Toast';
import { Plus, Trash2, Send, Save, Eye, MessageSquare, List, ArrowLeft, Download, Edit2, CheckCircle, FileText, Check, Search, Filter, X } from 'lucide-react';
import UpgradeModal from '../components/UpgradeModal';
import AddPaymentModal from '../components/AddPaymentModal';
import * as XLSX from 'xlsx';
import usePlanLimits from '../hooks/usePlanLimits';

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

const Invoices = () => {
    const { activeBusiness } = useBusiness();
    const queryClient = useQueryClient();
    const showToast = useToast();
    const { checkLimit, isPro } = usePlanLimits();
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const [view, setView] = useState('list'); // 'list' or 'create'
    const [editInvoice, setEditInvoice] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [showSendModal, setShowSendModal] = useState(false);
    const [savedInvoice, setSavedInvoice] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentInvoice, setPaymentInvoice] = useState(null);
    const [triggerSendModal, setTriggerSendModal] = useState(false);
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

    // Form State
    const [items, setItems] = useState([{ description: '', quantity: 1, unit_price: 0, tax_rate: 18, unit: 'ədəd' }]);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [notes, setNotes] = useState('');

    const handleCreateNew = () => {
        resetForm();
        setView('create');
    };

    const { data: invoices, isLoading: isLoadingInvoices } = useQuery({
        queryKey: ['invoices', activeBusiness?.id],
        queryFn: async () => {
            const res = await clientApi.get('/invoices/');
            return res.data;
        },
        enabled: !!activeBusiness,
    });

    const filteredInvoices = useMemo(() => {
        if (!invoices) return [];
        return invoices.filter(inv => {
            const matchesSearch =
                inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                inv.client_name.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [invoices, searchTerm, statusFilter]);

    const { data: clients } = useQuery({
        queryKey: ['clients', activeBusiness?.id],
        queryFn: async () => {
            const res = await clientApi.get('/clients/');
            return res.data;
        },
        enabled: !!activeBusiness,
    });

    const { data: products } = useQuery({
        queryKey: ['products', activeBusiness?.id],
        queryFn: async () => {
            const res = await clientApi.get('/inventory/');
            return res.data;
        },
        enabled: !!activeBusiness,
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
                setShowUpgradeModal(true);
            } else {
                const detail = data ? JSON.stringify(data) : error.message;
                showToast(`Xəta: ${detail}`, 'error');
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
        }
    });

    const duplicateMutation = useMutation({
        mutationFn: (id) => clientApi.post(`/invoices/${id}/duplicate/`),
        onSuccess: () => {
            queryClient.invalidateQueries(['invoices']);
            showToast('Faktura dublikat edildi!');
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => clientApi.patch(`/invoices/${id}/`, { status }),
        onSuccess: () => queryClient.invalidateQueries(['invoices']),
    });

    const markAsSentMutation = useMutation({
        mutationFn: (id) => clientApi.post(`/invoices/${id}/mark_as_sent/`),
        onSuccess: () => queryClient.invalidateQueries(['invoices']),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => clientApi.delete(`/invoices/${id}/`),
        onSuccess: () => queryClient.invalidateQueries(['invoices']),
    });

    const handleAddPayment = async (paymentData) => {
        try {
            await clientApi.post('/invoices/payments/', paymentData);
            queryClient.invalidateQueries(['invoices']);
            showToast('Ödəniş uğurla qeyd edildi!');
        } catch (error) {
            console.error('Payment error:', error);
            showToast('Ödəniş qeyd edilərkən xəta baş verdi', 'error');
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
            status: editInvoice ? editInvoice.status : (triggerSend ? 'draft' : status),
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

    const calculateSubtotal = () => items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0);
    const calculateTax = () => items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price) * (Number(item.tax_rate) / 100)), 0);
    const calculateTotal = () => calculateSubtotal() + calculateTax();

    const handleDownloadPdf = (id) => {
        const url = `${API_URL}/api/invoices/${id}/pdf/?business_id=${activeBusiness?.id}`;
        window.open(url, '_blank');
    };

    const handleWhatsApp = (inv) => {
        const targetInvoice = inv || editInvoice;
        if (!targetInvoice) return;

        const phone = targetInvoice.client_phone;
        if (!phone) return showToast('Müştərinin telefon nömrəsi yoxdur', 'error');

        const publicUrl = `http://localhost:5173/view/${targetInvoice.share_token}`;
        const text = `Salam! ${activeBusiness?.name} tərəfindən fakturanız hazırdır.\n\nMəbləğ: ${parseFloat(targetInvoice.total).toFixed(2)} ₼\nBaxmaq və ödəmək üçün link: ${publicUrl}`;

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
        if (!targetInvoice) return;

        try {
            await clientApi.post(`/invoices/${targetInvoice.id}/send_email/`);
            showToast('Email uğurla göndərildi!');
            setShowSendModal(false);
        } catch (error) {
            console.error('Email error:', error);
            const detail = error.response?.data?.error || 'Email göndərilərkən xəta baş verdi';
            showToast(detail, 'error');
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
                    <h1 className="text-2xl font-bold text-primary-blue uppercase">{activeBusiness?.name || 'ŞİRKƏT ADI'}</h1>
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
                    <div className="mb-2">
                        <p className="text-xs font-bold uppercase text-gray-400">Tarix</p>
                        <p className="text-sm">{invoiceDate ? new Date(invoiceDate).toLocaleDateString('az-AZ') : '---'}</p>
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
                <div className="flex justify-between text-xs text-gray-500"><span>Cəm:</span><span>{calculateSubtotal().toFixed(2)}</span></div>
                <div className="flex justify-between text-xs text-gray-500"><span>ƏDV (18%):</span><span>{calculateTax().toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-gray-900 pt-2 border-t"><span>YEKUN:</span><span>{calculateTotal().toFixed(2)} ₼</span></div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-100 text-[10px] text-gray-400 italic">
                {notes || activeBusiness?.bank_name ? `Qeyd: ${notes || activeBusiness?.bank_name}` : ''}
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
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight font-roboto">Fakturalar</h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        const data = (invoices || []).map(inv => {
                                            const clientName = clients?.find(c => c.id === inv.client)?.name || 'Naməlum';
                                            return {
                                                'Faktura №': inv.invoice_number,
                                                'Müştəri': clientName,
                                                'Tarix': new Date(inv.invoice_date).toLocaleDateString('az-AZ'),
                                                'Son Tarix': new Date(inv.due_date).toLocaleDateString('az-AZ'),
                                                'Məbləğ': parseFloat(inv.total_amount),
                                                'Valyuta': inv.currency || '₼',
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
                                    className="p-2 bg-white border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-all font-bold text-sm flex items-center gap-2"
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

                        <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white p-4 rounded-xl border shadow-sm items-center">
                            <div className="relative flex-1 group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-blue transition-colors">
                                    <Search size={18} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Faktura # və ya Müştəri axtar..."
                                    className="block w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-0 focus:bg-white focus:border-primary-blue transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
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
                                        className="block w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-0 focus:bg-white focus:border-primary-blue transition-all appearance-none cursor-pointer"
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

                        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                                        <tr>
                                            <th className="px-6 py-4">Faktura #</th>
                                            <th className="px-6 py-4">Müştəri</th>
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
                                                className="hover:bg-blue-50/30 transition-colors group"
                                            >
                                                <td className="px-6 py-4 font-medium text-primary-blue">{inv.invoice_number}</td>
                                                <td className="px-6 py-4 font-medium text-gray-700">{inv.client_name}</td>
                                                <td className="px-6 py-4 text-gray-500">{new Date(inv.invoice_date).toLocaleDateString('az-AZ')}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900">{parseFloat(inv.total).toFixed(2)} ₼</span>
                                                        {parseFloat(inv.paid_amount) > 0 && parseFloat(inv.paid_amount) < parseFloat(inv.total) && (
                                                            <span className="text-[10px] text-orange-500 font-bold">Ödənilib: {parseFloat(inv.paid_amount).toFixed(2)}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${inv.status === 'paid' ? 'bg-green-100 text-green-700 border border-green-200' :
                                                        inv.status === 'viewed' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                                                            inv.status === 'sent' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                                                inv.status === 'overdue' ? 'bg-red-100 text-red-700 border border-red-200' :
                                                                    inv.status === 'cancelled' ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                                                                        'bg-gray-100 text-gray-600 border border-gray-200'
                                                        }`}>
                                                        {inv.status === 'paid' ? 'Ödənilib' :
                                                            inv.status === 'viewed' ? 'Baxıldı' :
                                                                inv.status === 'sent' ? 'Göndərilib' :
                                                                    inv.status === 'overdue' ? 'Gecikir' :
                                                                        inv.status === 'cancelled' ? 'Ləğv edilib' : 'Qaralama'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-1">
                                                    <div className="flex justify-end space-x-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => {
                                                                const canPay = ['sent', 'viewed', 'overdue'].includes(inv.status);
                                                                if (!canPay) return;
                                                                setPaymentInvoice(inv);
                                                                setShowPaymentModal(true);
                                                            }}
                                                            title={inv.status === 'draft' ? "Qaralama statusunda olan fakturaya ödəniş əlavə etmək olmaz" :
                                                                inv.status === 'paid' ? "Bu faktura tam ödənilib" :
                                                                    inv.status === 'cancelled' ? "Ləğv edilmiş fakturaya ödəniş əlavə etmək olmaz" : "Ödəniş Əlavə Et"}
                                                            disabled={!['sent', 'viewed', 'overdue'].includes(inv.status)}
                                                            className={`p-2 rounded-lg transition-colors ${!['sent', 'viewed', 'overdue'].includes(inv.status) ? 'text-gray-300 cursor-not-allowed' : 'text-green-600 hover:bg-green-50'}`}
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

                                                        <button onClick={() => handleDownloadPdf(inv.id)} title="Yüklə" className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><Download size={18} /></button>
                                                        <button onClick={() => duplicateMutation.mutate(inv.id)} title="Kopyala" className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"><List size={18} /></button>
                                                        <button onClick={() => { if (window.confirm('Silinsin?')) deleteMutation.mutate(inv.id); }} title="Sil" className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
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
                        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-3 sm:p-4 rounded-xl border shadow-sm sticky top-4 z-10 gap-4">
                            <div className="flex items-center space-x-3 w-full sm:w-auto">
                                <button onClick={() => setView('list')} className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"><ArrowLeft size={20} className="sm:w-6 sm:h-6" /></button>
                                <h2 className="text-lg sm:text-xl font-bold text-gray-800 truncate">{editInvoice ? 'Faktura Düzəlişi' : 'Yeni Hesab-faktura'}</h2>
                            </div>
                            <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                                <button
                                    onClick={() => setShowPreview(!showPreview)}
                                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-all text-xs sm:text-sm ${showPreview ? 'bg-gray-800 text-white' : 'border hover:bg-gray-50'}`}
                                >
                                    <Eye size={16} />
                                    <span className="whitespace-nowrap">{showPreview ? 'Yazı rejimi' : 'Ön baxış'}</span>
                                </button>
                                {!editInvoice && (
                                    <button onClick={() => handleSave('draft')} className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2 transition-all shadow-sm text-xs sm:text-sm">
                                        <Save size={16} />
                                        <span className="whitespace-nowrap">Qaralama</span>
                                    </button>
                                )}
                                <button onClick={() => handleSave('draft', true)} className="flex-grow sm:flex-none bg-primary-blue text-white px-4 sm:px-6 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-700 shadow-md transform active:scale-95 transition-all text-xs sm:text-sm font-bold">
                                    <Send size={16} />
                                    <span className="whitespace-nowrap">{!editInvoice || editInvoice.status === 'draft' ? 'Yadda saxla və Göndər' : 'Yadda saxla'}</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            <div className={`${showPreview ? 'lg:col-span-7' : 'lg:col-span-8'} space-y-6 transition-all duration-500 order-1`}>
                                <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Müştəri seçimi</label>
                                            <select
                                                className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-primary-blue outline-none transition-all cursor-pointer bg-gray-50 hover:bg-white"
                                                value={selectedClientId}
                                                onChange={(e) => setSelectedClientId(e.target.value)}
                                            >
                                                <option value="">Axtarış...</option>
                                                {clients?.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Tarix</label>
                                                <input type="date" className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-primary-blue outline-none bg-gray-50 hover:bg-white" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Son Tarix</label>
                                                <input type="date" className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-primary-blue outline-none bg-gray-50 hover:bg-white" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
                                    <div className="flex justify-between items-center border-b pb-4">
                                        <h3 className="font-bold text-gray-800 flex items-center gap-2"><List size={18} className="text-primary-blue" /> Məhsul Siyahısı</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <AnimatePresence>
                                            {items.map((item, index) => (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    key={index}
                                                    className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-gray-50/50 p-4 rounded-xl hover:bg-white border border-transparent hover:border-gray-100 transition-all group shadow-sm"
                                                >
                                                    <div className="flex-1 space-y-1">
                                                        <select
                                                            className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-bold focus:border-blue-500 outline-none"
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
                                                            className="w-full bg-transparent border-none rounded-lg p-1 text-sm font-bold focus:ring-0 placeholder:font-normal"
                                                            placeholder="Və ya əllə daxil edin..."
                                                            value={item.description}
                                                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="w-full sm:w-20">
                                                        <label className="sm:hidden text-[10px] font-bold text-gray-400 uppercase mb-1 block">Miqdar</label>
                                                        <input type="number" className="w-full bg-gray-100/50 border-none rounded-lg p-2 text-sm text-center font-bold" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)} />
                                                    </div>
                                                    <div className="w-full sm:w-28">
                                                        <label className="sm:hidden text-[10px] font-bold text-gray-400 uppercase mb-1 block">Vahid</label>
                                                        <select
                                                            className="w-full bg-gray-100/50 border-none rounded-lg p-2 text-xs font-bold"
                                                            value={UNIT_CHOICES.find(u => u.value === item.unit) ? item.unit : 'digər'}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                if (val === 'digər') {
                                                                    updateItem(index, 'unit', '');
                                                                } else {
                                                                    updateItem(index, 'unit', val);
                                                                }
                                                            }}
                                                        >
                                                            {UNIT_CHOICES.map(u => (
                                                                <option key={u.value} value={u.value}>{u.label}</option>
                                                            ))}
                                                        </select>
                                                        {(!UNIT_CHOICES.find(u => u.value === item.unit) || item.unit === 'digər') && (
                                                            <input
                                                                type="text"
                                                                className="w-full mt-1 bg-white border border-gray-200 rounded-lg p-1 text-[10px] font-bold"
                                                                placeholder="Vahid..."
                                                                value={item.unit === 'digər' ? '' : item.unit}
                                                                onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="w-full sm:w-32 relative">
                                                        <label className="sm:hidden text-[10px] font-bold text-gray-400 uppercase mb-1 block">Qiymət</label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-2 text-xs text-gray-400 font-bold">₼</span>
                                                            <input type="number" className="w-full bg-gray-100/50 border-none rounded-lg p-2 pl-10 text-sm font-bold" value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)} />
                                                        </div>
                                                    </div>
                                                    <div className="w-full sm:w-24 text-right font-bold text-primary-blue text-sm flex justify-between items-center sm:block border-t sm:border-t-0 pt-3 sm:pt-0 mt-2 sm:mt-0 italic sm:not-italic">
                                                        <span className="sm:hidden text-gray-400 font-bold uppercase text-[10px]">Cəm:</span>
                                                        <span className="text-base sm:text-sm">{(item.quantity * item.unit_price).toFixed(2)} ₼</span>
                                                    </div>
                                                    <button onClick={() => removeItem(index)} className="p-2 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 self-end sm:self-center mt-2 sm:mt-0"><Trash2 size={20} /></button>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        <button onClick={addItem} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-bold hover:border-primary-blue hover:text-primary-blue transition-all flex justify-center items-center gap-2 active:bg-blue-50">
                                            <Plus size={18} /><span>Yeni sətir</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div ref={previewRef} className={`${showPreview ? 'lg:col-span-5' : 'lg:col-span-4'} space-y-6 order-2`}>
                                {showPreview ? (
                                    <InvoicePreview />
                                ) : (
                                    <>
                                        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                                            <h3 className="font-bold text-gray-800 border-b pb-4">Xülasə</h3>
                                            <div className="space-y-4">
                                                <div className="flex justify-between text-gray-500 font-medium"><span>Cəm:</span><span>{calculateSubtotal().toFixed(2)} ₼</span></div>
                                                <div className="flex justify-between text-gray-500 font-medium"><span>ƏDV (18%):</span><span>{calculateTax().toFixed(2)} ₼</span></div>
                                                <div className="flex justify-between text-2xl font-black border-t-2 border-gray-50 pt-4 text-gray-900 italic"><span>YEKUN:</span><span className="text-primary-blue">{calculateTotal().toFixed(2)} ₼</span></div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                                            <h3 className="font-bold text-gray-800 border-b pb-4 shrink-0 flex items-center gap-2"><List size={18} className="text-primary-blue" /> Sürətli Keçid</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <button
                                                    onClick={() => {
                                                        const target = editInvoice || savedInvoice;
                                                        if (!target) return showToast('Əvvəlcə yadda saxlayın', 'error');
                                                        const url = `http://localhost:5173/view/${target.share_token}`;
                                                        navigator.clipboard.writeText(url);
                                                        showToast('Link kopyalandı!');
                                                    }}
                                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all gap-2 group ${editInvoice || savedInvoice ? 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100' : 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed'}`}
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
                                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all gap-2 group ${editInvoice || savedInvoice ? 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100' : 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed'}`}
                                                >
                                                    <Download size={24} className="group-hover:scale-110 transition-transform" />
                                                    <span className="text-xs font-bold uppercase tracking-tighter">PDF Yüklə</span>
                                                </button>
                                            </div>
                                        </div>

                                        {selectedClient && (
                                            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                                                <h3 className="font-bold text-gray-800 border-b pb-4 shrink-0 flex items-center gap-2"><CheckCircle size={18} className="text-green-500" /> Müştəri Məlumatı</h3>
                                                <div className="space-y-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] uppercase font-bold text-gray-400">Telefon</span>
                                                        <span className="text-sm font-medium text-gray-700">{selectedClient.phone || 'Daxil edilməyib'}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] uppercase font-bold text-gray-400">VÖEN</span>
                                                        <span className="text-sm font-medium text-gray-700">{selectedClient.voen || '---'}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] uppercase font-bold text-gray-400">Ünvan</span>
                                                        <span className="text-sm font-medium text-gray-700 line-clamp-2">{selectedClient.address || '---'}</span>
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-auto max-w-md overflow-hidden"
                        >
                            <div className="p-8 text-center space-y-6">
                                <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <CheckCircle size={40} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900">Faktura Hazırdır!</h3>
                                    <p className="text-slate-500 mt-2">Müştəriyə necə göndərmək istəyirsiniz?</p>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <button
                                        onClick={() => { handleWhatsApp(savedInvoice); setShowSendModal(false); }}
                                        className="flex items-center justify-between p-4 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-all border border-green-100 font-bold"
                                    >
                                        <div className="flex items-center gap-3">
                                            <MessageSquare size={20} />
                                            <span>WhatsApp ilə göndər</span>
                                        </div>
                                        <Plus size={16} className="rotate-45" />
                                    </button>

                                    <button
                                        onClick={() => {
                                            const url = `http://localhost:5173/view/${savedInvoice.share_token}`;
                                            navigator.clipboard.writeText(url);
                                            if (savedInvoice && !savedInvoice.sent_at) {
                                                markAsSentMutation.mutate(savedInvoice.id);
                                            }
                                            showToast('Link kopyalandı!');
                                            setShowSendModal(false);
                                        }}
                                        className="flex items-center justify-between p-4 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-all border border-blue-100 font-bold"
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText size={20} />
                                            <span>Linki Kopyala</span>
                                        </div>
                                        <Plus size={16} className="rotate-45" />
                                    </button>

                                    <button
                                        onClick={() => handleSendEmail(savedInvoice)}
                                        className="flex items-center justify-between p-4 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-all border border-slate-200 font-bold"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Send size={20} />
                                            <span>Email ilə göndər</span>
                                        </div>
                                        <Plus size={16} className="rotate-45" />
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
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                resourceName="Faktura"
                limit={checkLimit('invoices').limit}
            />
        </>
    );
};

export default Invoices;
