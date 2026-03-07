import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Users, Gift, Tag, ExternalLink, Ticket } from 'lucide-react';
import { useToast } from './Toast';
import useReferral from '../hooks/useReferral';

const reasonLabel = {
  referrer_bonus: 'Referral bonusu',
  new_user_bonus: 'Yeni istifadəçi bonusu',
};

const ReferralTab = () => {
  const { referralData, isLoading } = useReferral();
  const showToast = useToast();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(null);

  const copyLink = async () => {
    if (!referralData?.referral_link) return;
    try {
      await navigator.clipboard.writeText(referralData.referral_link);
      setCopiedLink(true);
      showToast('Referral linki kopyalandı!', 'success');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      showToast('Kopyalama uğursuz oldu', 'error');
    }
  };

  const copyCoupon = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCoupon(code);
      showToast(`${code} kopyalandı!`, 'success');
      setTimeout(() => setCopiedCoupon(null), 2000);
    } catch {
      showToast('Kopyalama uğursuz oldu', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const activeCoupons = referralData?.coupons?.filter(c => !c.is_used) || [];
  const usedCoupons = referralData?.coupons?.filter(c => c.is_used) || [];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>Referral Proqramı</h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Dostunuzu dəvət edin — o Pro plana keçdikdə <strong style={{ color: 'var(--color-text-primary)' }}>hər ikiniz</strong> endirim kuponu qazanın.
        </p>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: ExternalLink, title: 'Linki paylaş', desc: 'Öz referral linkini dostuna göndər', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { icon: Users, title: 'Dost qeydiyyat keçir', desc: 'Linkdən qeydiyyat keçir', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
          { icon: Gift, title: 'Hər ikiniz qazan', desc: 'O 10%, sən 20% endirim alırsınız', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
        ].map(({ icon, title, desc, color, bg }) => (
          <div key={title} className={`border rounded-xl p-4 ${bg}`}>
            {React.createElement(icon, { size: 20, className: `${color} mb-2` })}
            <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text-primary)' }}>{title}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* Referral link */}
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <ExternalLink size={16} style={{ color: 'var(--color-text-muted)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Referral linkiniz</span>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 rounded-lg px-3 py-2.5 text-sm font-mono truncate" style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-input-border)', color: 'var(--color-text-secondary)' }}>
            {referralData?.referral_link || '—'}
          </div>
          <button
            onClick={copyLink}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${copiedLink
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
              : 'bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30'
              }`}
          >
            {copiedLink ? <Check size={15} /> : <Copy size={15} />}
            {copiedLink ? 'Kopyalandı' : 'Kopyala'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
          <p className="text-2xl font-black" style={{ color: 'var(--color-text-primary)' }}>{referralData?.referral_count ?? 0}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Uğurlu referral</p>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
          <p className="text-2xl font-black text-emerald-400">{activeCoupons.length}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Aktiv kupon</p>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
          <p className="text-2xl font-black" style={{ color: 'var(--color-text-muted)' }}>{usedCoupons.length}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>İstifadə edilib</p>
        </div>
      </div>

      {/* Coupons */}
      {(referralData?.coupons?.length ?? 0) > 0 ? (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Ticket size={16} style={{ color: 'var(--color-text-muted)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Kuponlarınız</span>
          </div>
          <div className="space-y-2">
            {referralData.coupons.map((coupon) => (
              <motion.div
                key={coupon.code}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${coupon.is_used
                  ? 'opacity-50'
                  : ''
                  }`}
                style={{
                  backgroundColor: 'var(--color-card-bg)',
                  borderColor: 'var(--color-card-border)'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${coupon.is_used ? 'bg-white/10 text-white/30' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                    {coupon.discount_percent}%
                  </div>
                  <div>
                    <p className="text-sm font-bold font-mono" style={{ color: 'var(--color-text-primary)' }}>{coupon.code}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      {reasonLabel[coupon.reason] || coupon.reason}
                      {coupon.is_used && coupon.used_at && (
                        <> · {new Date(coupon.used_at).toLocaleDateString('az-AZ')}</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {coupon.is_used ? (
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>İstifadə edilib</span>
                  ) : (
                    <>
                      <span className="text-xs text-emerald-400 font-semibold">Aktiv</span>
                      <button
                        onClick={() => copyCoupon(coupon.code)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ backgroundColor: 'var(--color-hover-bg)' }}
                      >
                        {copiedCoupon === coupon.code
                          ? <Check size={13} className="text-emerald-400" />
                          : <Copy size={13} style={{ color: 'var(--color-text-muted)' }} />
                        }
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-10" style={{ color: 'var(--color-text-muted)' }}>
          <Tag size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Hələ kuponunuz yoxdur.</p>
          <p className="text-xs mt-1 opacity-70">Referral linkinizi paylaşın və qazanmağa başlayın.</p>
        </div>
      )}
    </div>
  );
};

export default ReferralTab;
