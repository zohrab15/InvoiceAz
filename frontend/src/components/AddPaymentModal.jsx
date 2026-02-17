import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Calendar, CreditCard, Banknote, Landmark, FileText, Check } from 'lucide-react';

const AddPaymentModal = ({ isOpen, onClose, invoice, onAddPayment }) => {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [method, setMethod] = useState('cash');
    const [note, setNote] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (invoice) {
            const balance = (parseFloat(invoice.total) - parseFloat(invoice.paid_amount)).toFixed(2);
            setAmount(balance);
        }
    }, [invoice, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (invoice?.status === 'draft') {
            setError('Qaralama statusunda olan fakturaya ödəniş əlavə etmək olmaz');
            return;
        }

        const numAmount = parseFloat(amount);
        const balance = parseFloat(invoice.total) - parseFloat(invoice.paid_amount);

        if (isNaN(numAmount) || numAmount <= 0) {
            setError('Zəhmət olmasa düzgün məbləğ daxil edin');
            return;
        }

        if (numAmount > balance + 0.01) {
            setError(`Məbləğ qalıq borcdan (${balance.toFixed(2)} AZN) çox ola bilməz`);
            return;
        }

        onAddPayment({
            invoice: invoice.id,
            amount: numAmount,
            payment_date: date,
            payment_method: method,
            reference: note
        });

        // Reset and close
        setAmount('');
        setNote('');
        setError('');
        onClose();
    };

    const methods = [
        { id: 'cash', label: 'Nağd', icon: Banknote, color: 'text-green-600', bg: 'bg-green-50' },
        { id: 'bank_transfer', label: 'Köçürmə', icon: Landmark, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'card', label: 'Kart', icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50' },
        { id: 'online', label: 'Onlayn', icon: DollarSign, color: 'text-orange-600', bg: 'bg-orange-50' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-primary-blue to-blue-700 p-6 text-white">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold">Ödəniş Qeyd Et</h3>
                                    <p className="text-blue-100 text-sm mt-1">{invoice?.invoice_number} • {invoice?.client_name}</p>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Balance Info */}
                            <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center border border-gray-100">
                                <span className="text-gray-500 text-sm">Ümumi Qalıq:</span>
                                <span className="text-lg font-bold text-gray-900">
                                    {(parseFloat(invoice.total) - parseFloat(invoice.paid_amount)).toFixed(2)} AZN
                                </span>
                            </div>

                            {/* Amount Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Məbləğ (AZN)</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        <DollarSign size={18} />
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => {
                                            setAmount(e.target.value);
                                            setError('');
                                        }}
                                        className={`w-full pl-12 pr-4 py-3 bg-white border-2 rounded-xl focus:ring-4 transition-all outline-none ${error ? 'border-red-200 focus:ring-red-100' : 'border-gray-100 focus:border-primary-blue focus:ring-blue-100'
                                            }`}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
                            </div>

                            {/* Date and Method Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tarix</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            <Calendar size={16} />
                                        </div>
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-blue outline-none text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Metod</label>
                                    <select
                                        value={method}
                                        onChange={(e) => setMethod(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-blue outline-none text-sm appearance-none"
                                    >
                                        <option value="cash">Nağd</option>
                                        <option value="bank_transfer">Köçürmə</option>
                                        <option value="card">Kart</option>
                                        <option value="online">Onlayn</option>
                                    </select>
                                </div>
                            </div>

                            {/* Method Selector (Visual) */}
                            <div className="grid grid-cols-4 gap-2">
                                {methods.map((m) => {
                                    const Icon = m.icon;
                                    return (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => setMethod(m.id)}
                                            className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${method === m.id
                                                ? `border-primary-blue ${m.bg}`
                                                : 'border-transparent bg-gray-50 hover:bg-gray-100'
                                                }`}
                                        >
                                            <Icon size={20} className={method === m.id ? m.color : 'text-gray-400'} />
                                            <span className={`text-[10px] mt-1 font-bold ${method === m.id ? 'text-gray-900' : 'text-gray-500'}`}>
                                                {m.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Note Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Qeyd (İxtiyari)</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-4 text-gray-400">
                                        <FileText size={18} />
                                    </div>
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-blue outline-none min-h-[100px] text-sm"
                                        placeholder="Məsələn: Ödəniş tapşırığı №123"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-2 flex space-x-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                                >
                                    Ləğv et
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-3 px-4 bg-primary-blue text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center space-x-2"
                                >
                                    <Check size={20} />
                                    <span>Təsdiqlə</span>
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AddPaymentModal;
