import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Clock, ChevronRight, BookOpen, ArrowRight } from 'lucide-react';
import { məqalələr, kateqoriyalar } from '../data/akademiya';
import useAuthStore from '../store/useAuthStore';

const kateqoriyaReng = {
  'Faktura': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'Mühasibat': 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  'Vergi': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  'Biznes': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Rehbər': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

const Akademiya = () => {
  const navigate = useNavigate();
  const token = useAuthStore(state => state.token);
  const [aktifKateqoriya, setAktifKateqoriya] = useState('Hamısı');

  useEffect(() => {
    document.title = 'Akademiya | InvoiceAZ';
    document.querySelector('meta[name="description"]')?.setAttribute(
      'content',
      'InvoiceAZ Akademiyası - Faktura yaratma, mühasibat, ƏDV hesablama və biznes idarəetmə üzrə pulsuz məqalələr.'
    );
  }, []);

  const filtrelenmişMəqalələr = aktifKateqoriya === 'Hamısı'
    ? məqalələr
    : məqalələr.filter(m => m.kateqoriya === aktifKateqoriya);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ══════════ NAVBAR ══════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center bg-white/5 backdrop-blur-2xl rounded-2xl px-4 md:px-6 py-3 border border-white/10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 md:w-9 md:h-9 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center">
              <Zap size={14} className="text-white md:hidden" />
              <Zap size={18} className="text-white hidden md:block" />
            </div>
            <span className="text-base md:text-xl font-black tracking-tight">InvoiceAZ</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/akademiya" className="text-sm font-semibold text-white/90 transition-colors">Akademiya</Link>
            <Link to="/help" className="text-sm font-semibold text-white/60 hover:text-white transition-colors">Yardım</Link>
          </div>
          <div className="flex items-center gap-3">
            {!token ? (
              <button
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-blue-500 to-violet-600 text-white px-4 md:px-5 py-2.5 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-all"
              >
                Pulsuz Başla
              </button>
            ) : (
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gradient-to-r from-blue-500 to-violet-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm"
              >
                Panelə Keç
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ══════════ HERO ══════════ */}
      <section className="relative pt-36 pb-16 px-6">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-violet-600/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/[0.1] rounded-full px-4 py-1.5 mb-6">
              <BookOpen size={14} className="text-blue-400" />
              <span className="text-xs font-semibold text-white/70 tracking-wide uppercase">Pulsuz Bilgi Mərkəzi</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Akademiya
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
              Faktura yaratma, mühasibat, vergi hesablaması və biznes idarəetmə üzrə praktiki məqalələr — Azərbaycan dilində, pulsuz.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ══════════ KATEQORİYA FİLTER ══════════ */}
      <section className="px-6 pb-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-2 justify-center">
            {kateqoriyalar.map((kat) => (
              <button
                key={kat}
                onClick={() => setAktifKateqoriya(kat)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  aktifKateqoriya === kat
                    ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-white/[0.04] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                {kat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ MƏQALƏ KARTLARI ══════════ */}
      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtrelenmişMəqalələr.map((məqalə, idx) => (
              <motion.div
                key={məqalə.slug}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
              >
                <Link
                  to={`/akademiya/${məqalə.slug}`}
                  className="group block h-full bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.07] hover:border-white/[0.15] transition-all duration-300"
                >
                  {/* Kateqoriya badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border ${kateqoriyaReng[məqalə.kateqoriya] || 'bg-white/10 text-white/60 border-white/20'}`}>
                      {məqalə.kateqoriya}
                    </span>
                    <div className="flex items-center gap-1.5 text-white/40 text-xs">
                      <Clock size={12} />
                      <span>{məqalə.oxumaMuddeti}</span>
                    </div>
                  </div>

                  {/* Başlıq */}
                  <h2 className="text-lg font-bold text-white mb-3 leading-snug group-hover:text-blue-300 transition-colors">
                    {məqalə.baslig}
                  </h2>

                  {/* Açıqlama */}
                  <p className="text-sm text-white/50 leading-relaxed mb-5 line-clamp-3">
                    {məqalə.acıqlama}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/30">{məqalə.tarix}</span>
                    <span className="flex items-center gap-1 text-sm font-semibold text-blue-400 group-hover:gap-2 transition-all">
                      Oxu <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {filtrelenmişMəqalələr.length === 0 && (
            <div className="text-center py-20 text-white/30">
              <BookOpen size={40} className="mx-auto mb-4 opacity-40" />
              <p>Bu kateqoriyada hələ məqalə yoxdur.</p>
            </div>
          )}
        </div>
      </section>

      {/* ══════════ CTA ══════════ */}
      <section className="px-6 pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-blue-500/10 to-violet-600/10 border border-white/[0.08] rounded-2xl p-10 text-center">
            <h2 className="text-2xl md:text-3xl font-black mb-3">
              Bilikdən Praktikaya Keçin
            </h2>
            <p className="text-white/60 mb-6">
              InvoiceAZ ilə faktura yaratmağa, xərclərə nəzarət etməyə və maliyyənizi idarə etməyə başlayın.
            </p>
            <button
              onClick={() => navigate(token ? '/dashboard' : '/register')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-violet-600 text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-blue-500/30 transition-all"
            >
              İndi Pulsuz Başla
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="border-t border-white/[0.06] px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-black text-sm">InvoiceAZ</span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <Link to="/terms" className="hover:text-white transition-colors">İstifadə Qaydaları</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Məxfilik</Link>
            <Link to="/help" className="hover:text-white transition-colors">Yardım</Link>
          </div>
          <p className="text-xs text-white/30">© 2026 InvoiceAZ. Bütün hüquqlar qorunur.</p>
        </div>
      </footer>
    </div>
  );
};

export default Akademiya;
