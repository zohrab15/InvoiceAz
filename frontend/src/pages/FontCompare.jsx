import React from 'react';

const fonts = [
    { name: 'Roboto', family: "'Roboto', sans-serif" },
    { name: 'Inter', family: "'Inter', sans-serif" },
    { name: 'Rubik', family: "'Rubik', sans-serif" },
    { name: 'Nunito Sans', family: "'Nunito Sans', sans-serif" },
    { name: 'Plus Jakarta Sans', family: "'Plus Jakarta Sans', sans-serif" },
    { name: 'Manrope', family: "'Manrope', sans-serif" },
];

const sampleTexts = [
    { label: 'Azerbaycan hərfləri', text: 'Ə ə Ö ö Ü ü Ç ç Ş ş Ğ ğ İ ı' },
    { label: 'Sidebar menyusu', text: 'Fakturalar • Müştərilər • Məhsullar • Anbarlar • Xərclər' },
    { label: 'Başlıq (Bold)', text: 'Ödəniş Analitikası — Həftəlik Hesabat', weight: 700 },
    { label: 'Alt başlıq (SemiBold)', text: 'Stok Hərəkətləri və İnventarizasiya', weight: 600 },
    { label: 'Mətn paraqrafı', text: 'Bu gün 15 faktura yaradılıb, 8-i ödənilib. Ümumi gəlir: ₼12,450.00. Ən çox satılan məhsul: "Şüşə qab dəsti" — 234 ədəd.' },
    { label: 'Kiçik mətn', text: 'Müştəri: "Günəş" MMC • Tarix: 04.03.2026 • Növ: Əlavə xərc', size: 13 },
    { label: 'Rəqəmlər + Valyuta', text: '₼1,234,567.89 • $9,876.54 • €3,210.00 • 12.5%', weight: 600 },
];

const FontCompare = () => {
    return (
        <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{
                fontSize: '28px',
                fontWeight: 800,
                marginBottom: '8px',
                color: 'var(--color-text-primary)',
            }}>
                Font Müqayisəsi — Azerbaycan Dili
            </h1>
            <p style={{
                fontSize: '14px',
                color: 'var(--color-text-muted)',
                marginBottom: '32px',
            }}>
                Hər fontu Azərbaycan hərfləri ilə müqayisə edin. Ən yaxşısını seçin.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {fonts.map((font) => (
                    <div
                        key={font.name}
                        style={{
                            backgroundColor: 'var(--color-card-bg)',
                            border: '1px solid var(--color-card-border)',
                            borderRadius: '16px',
                            padding: '24px',
                            transition: 'box-shadow 0.2s',
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '20px',
                            paddingBottom: '12px',
                            borderBottom: '1px solid var(--color-card-border)',
                        }}>
                            <h2 style={{
                                fontSize: '20px',
                                fontWeight: 700,
                                fontFamily: font.family,
                                color: 'var(--color-brand)',
                                margin: 0,
                            }}>
                                {font.name}
                            </h2>
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: 'var(--color-text-muted)',
                                backgroundColor: 'var(--color-badge-bg)',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}>
                                Variable Font
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {sampleTexts.map((sample, i) => (
                                <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'baseline' }}>
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: 'var(--color-text-muted)',
                                        minWidth: '140px',
                                        textAlign: 'right',
                                        flexShrink: 0,
                                    }}>
                                        {sample.label}
                                    </span>
                                    <span style={{
                                        fontFamily: font.family,
                                        fontWeight: sample.weight || 400,
                                        fontSize: sample.size ? `${sample.size}px` : '16px',
                                        color: 'var(--color-text-primary)',
                                        lineHeight: 1.6,
                                    }}>
                                        {sample.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FontCompare;
