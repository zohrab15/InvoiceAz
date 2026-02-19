import React, { useState, useEffect } from 'react';
import { ChevronDown, Phone as PhoneIcon } from 'lucide-react';

const OPERATORS = [
    { code: '050', label: '050 (Azercell)' },
    { code: '051', label: '051 (Azercell)' },
    { code: '055', label: '055 (Bakcell)' },
    { code: '070', label: '070 (Nar)' },
    { code: '077', label: '077 (Nar)' },
    { code: '099', label: '099 (Bakcell)' },
    { code: '010', label: '010 (Azercell)' },
    { code: '060', label: '060 (Nar)' },
    { code: '012', label: '012 (Bakı/Şəhər)' },
];

const PhoneInput = ({ value, onChange, name, label, icon: Icon = PhoneIcon }) => {
    // Parse initial value (e.g. "0501234567" or "+994501234567")
    const parseInitialValue = (val) => {
        if (!val) return { operator: '050', number: '' };

        let clean = val.replace(/\D/g, '');
        if (clean.startsWith('994')) clean = '0' + clean.substring(3);
        else if (!clean.startsWith('0')) clean = '0' + clean;

        const operator = OPERATORS.find(o => clean.startsWith(o.code))?.code || '050';
        const number = clean.substring(operator.length);
        return { operator, number };
    };

    const [phoneState, setPhoneState] = useState(parseInitialValue(value));
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const parsed = parseInitialValue(value);
        setPhoneState(parsed);
    }, [value]);

    const handleNumberChange = (e) => {
        const raw = e.target.value.replace(/\D/g, '').substring(0, 7);
        setPhoneState({ ...phoneState, number: raw });

        // Trigger parent onChange with unified raw format
        const fullNumber = `+994${phoneState.operator.substring(1)}${raw}`;
        onChange({ target: { name, value: fullNumber } });
    };

    const handleOperatorSelect = (op) => {
        const newState = { ...phoneState, operator: op.code };
        setPhoneState(newState);
        setIsMenuOpen(false);

        const fullNumber = `+994${newState.operator.substring(1)}${newState.number}`;
        onChange({ target: { name, value: fullNumber } });
    };

    // Format for display (XXX XX XX)
    const formatDisplay = (num) => {
        if (!num) return '';
        let formatted = '';
        if (num.length > 0) formatted += num.substring(0, 3);
        if (num.length > 3) formatted += ' ' + num.substring(3, 5);
        if (num.length > 5) formatted += ' ' + num.substring(5, 7);
        return formatted;
    };

    const displayMask = `(${phoneState.operator}) ${formatDisplay(phoneState.number)}`;

    return (
        <div className="space-y-1.5">
            {label && (
                <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--color-text-muted)' }}>
                    {label}
                </label>
            )}
            <div className="relative flex group">
                {/* Operator Selector */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="h-full flex items-center gap-1.5 px-2.5 border-2 border-transparent border-r-[var(--color-card-border)] rounded-l-xl transition-colors focus:outline-none"
                        style={{ backgroundColor: 'var(--color-hover-bg)' }}
                    >
                        <span className="font-bold text-xs" style={{ color: 'var(--color-text-primary)' }}>{phoneState.operator}</span>
                        <ChevronDown size={10} className={`transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--color-text-muted)' }} />
                    </button>

                    {isMenuOpen && (
                        <div
                            className="absolute top-full left-0 mt-2 w-48 rounded-xl shadow-2xl border z-50 overflow-hidden py-1"
                            style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-card-border)' }}
                        >
                            <div className="max-h-60 overflow-y-auto">
                                {OPERATORS.map(op => (
                                    <button
                                        key={op.code}
                                        type="button"
                                        onClick={() => handleOperatorSelect(op)}
                                        className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors`}
                                        style={{
                                            backgroundColor: phoneState.operator === op.code ? 'var(--color-brand-light)' : 'transparent',
                                            color: phoneState.operator === op.code ? 'var(--color-brand)' : 'var(--color-text-primary)'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (phoneState.operator !== op.code) e.currentTarget.style.backgroundColor = 'var(--color-hover-bg)';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (phoneState.operator !== op.code) e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                    >
                                        {op.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Field */}
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={formatDisplay(phoneState.number)}
                        onChange={handleNumberChange}
                        placeholder="123 45 67"
                        className="w-full border-2 border-transparent focus:border-[var(--color-brand)] focus:bg-white rounded-r-xl p-2.5 pl-4 outline-none transition-all font-bold text-sm"
                        style={{ backgroundColor: 'var(--color-hover-bg)', color: 'var(--color-text-primary)' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default PhoneInput;
