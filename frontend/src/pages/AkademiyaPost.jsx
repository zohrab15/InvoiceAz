import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useParams, useNavigate, Navigate } from 'react-router-dom';
import { Zap, Clock, ArrowLeft, ChevronRight, BookOpen, Tag } from 'lucide-react';
import { məqaləSluglaGetir, məqalələr } from '../data/akademiya';
import useAuthStore from '../store/useAuthStore';

const kateqoriyaReng = {
  'Faktura': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'Mühasibat': 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  'Vergi': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  'Biznes': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Rehbər': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

const AkademiyaPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore(state => state.token);
  const [oxumaIrəliləyişi, setOxumaIrəliləyişi] = useState(0);

  const məqalə = məqaləSluglaGetir(slug);

  // Reading progress bar
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setOxumaIrəliləyişi(Math.min(progress, 100));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Set page title + meta
  useEffect(() => {
    if (!məqalə) return;
    document.title = `${məqalə.baslig} | InvoiceAZ Akademiya`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', məqalə.acıqlama);
  }, [məqalə]);

  // JSON-LD Article schema injection
  useEffect(() => {
    if (!məqalə) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'article-schema';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': məqalə.baslig,
      'description': məqalə.acıqlama,
      'datePublished': məqalə.tarix,
      'author': { '@type': 'Organization', 'name': 'InvoiceAZ' },
      'publisher': {
        '@type': 'Organization',
        'name': 'InvoiceAZ',
        'logo': { '@type': 'ImageObject', 'url': '/vite.svg' }
      },
      'inLanguage': 'az',
      'url': `https://invoiceaz.az/akademiya/${məqalə.slug}`,
    });
    document.head.appendChild(script);
    return () => {
      document.getElementById('article-schema')?.remove();
    };
  }, [məqalə]);

  if (!məqalə) return <Navigate to="/akademiya" replace />;

  // Other articles (excluding current)
  const digərMəqalələr = məqalələr
    .filter(m => m.slug !== slug)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ══════════ READING PROGRESS BAR ══════════ */}
      <div
        className="fixed top-0 left-0 z-[9999] h-[3px] bg-gradient-to-r from-blue-500 to-violet-600 transition-all duration-150"
        style={{ width: `${oxumaIrəliləyişi}%` }}
      />

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
            <Link to="/akademiya" className="text-sm font-semibold text-white/60 hover:text-white transition-colors">Akademiya</Link>
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

      {/* ══════════ ARTICLE HEADER ══════════ */}
      <section className="relative pt-36 pb-12 px-6">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 right-1/3 w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-3xl mx-auto relative z-10">
          {/* Back button */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link
              to="/akademiya"
              className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-8 group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Akademiyaya qayıt
            </Link>
          </motion.div>

          {/* Meta */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${kateqoriyaReng[məqalə.kateqoriya] || 'bg-white/10 text-white/60 border-white/20'}`}>
                <Tag size={11} />
                {məqalə.kateqoriya}
              </span>
              <div className="flex items-center gap-1.5 text-white/40 text-sm">
                <Clock size={13} />
                <span>{məqalə.oxumaMuddeti}</span>
              </div>
              <span className="text-white/30 text-sm">{məqalə.tarix}</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black leading-tight mb-5">
              {məqalə.baslig}
            </h1>
            <p className="text-lg text-white/60 leading-relaxed">
              {məqalə.acıqlama}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ══════════ DIVIDER ══════════ */}
      <div className="max-w-3xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* ══════════ ARTICLE CONTENT ══════════ */}
      <section className="px-6 py-12">
        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div
            className="akademiya-content"
            dangerouslySetInnerHTML={{ __html: məqalə.content }}
          />
        </motion.div>
      </section>

      {/* ══════════ CTA ══════════ */}
      <section className="px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-blue-500/10 to-violet-600/10 border border-white/[0.08] rounded-2xl p-8 text-center">
            <h2 className="text-xl md:text-2xl font-black mb-2">Bilikdən Praktikaya Keçin</h2>
            <p className="text-white/60 mb-5 text-sm">
              InvoiceAZ ilə peşəkar fakturalar yaradın, xərclərə nəzarət edin.
            </p>
            <button
              onClick={() => navigate(token ? '/dashboard' : '/register')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-violet-600 text-white px-7 py-3 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-blue-500/30 transition-all"
            >
              İndi Pulsuz Başla
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ══════════ DİGƏR MƏQALƏLƏR ══════════ */}
      {digərMəqalələr.length > 0 && (
        <section className="px-6 pb-24">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <BookOpen size={18} className="text-white/40" />
              <h2 className="text-lg font-bold text-white/80">Digər Məqalələr</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {digərMəqalələr.map((m) => (
                <Link
                  key={m.slug}
                  to={`/akademiya/${m.slug}`}
                  className="group block bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 hover:bg-white/[0.07] hover:border-white/[0.15] transition-all"
                >
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border mb-2 ${kateqoriyaReng[m.kateqoriya] || 'bg-white/10 text-white/60 border-white/20'}`}>
                    {m.kateqoriya}
                  </span>
                  <h3 className="text-sm font-bold text-white leading-snug mb-2 group-hover:text-blue-300 transition-colors line-clamp-2">
                    {m.baslig}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-white/40">
                    <Clock size={11} />
                    {m.oxumaMuddeti}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

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

      {/* ══════════ ARTICLE STYLES ══════════ */}
      <style>{`
        .akademiya-content h2 {
          font-size: 1.5rem;
          font-weight: 800;
          color: #fff;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .akademiya-content h3 {
          font-size: 1.15rem;
          font-weight: 700;
          color: rgba(255,255,255,0.9);
          margin-top: 2rem;
          margin-bottom: 0.75rem;
        }
        .akademiya-content p {
          color: rgba(255,255,255,0.65);
          line-height: 1.85;
          margin-bottom: 1.1rem;
          font-size: 1rem;
        }
        .akademiya-content ul, .akademiya-content ol {
          color: rgba(255,255,255,0.65);
          padding-left: 1.5rem;
          margin-bottom: 1.25rem;
          line-height: 1.85;
        }
        .akademiya-content li {
          margin-bottom: 0.4rem;
        }
        .akademiya-content strong {
          color: rgba(255,255,255,0.9);
          font-weight: 700;
        }
        .akademiya-content a {
          color: #60a5fa;
          text-decoration: underline;
          text-decoration-color: rgba(96,165,250,0.35);
          text-underline-offset: 3px;
        }
        .akademiya-content a:hover {
          color: #93c5fd;
        }
        .akademiya-content blockquote {
          border-left: 3px solid rgba(96,165,250,0.5);
          padding: 0.75rem 1.25rem;
          margin: 1.5rem 0;
          background: rgba(96,165,250,0.05);
          border-radius: 0 0.75rem 0.75rem 0;
          color: rgba(255,255,255,0.6);
          font-style: italic;
        }
        .akademiya-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
          font-size: 0.9rem;
        }
        .akademiya-content th {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.85);
          font-weight: 700;
          padding: 0.6rem 1rem;
          border: 1px solid rgba(255,255,255,0.08);
          text-align: left;
        }
        .akademiya-content td {
          color: rgba(255,255,255,0.6);
          padding: 0.6rem 1rem;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .akademiya-content tr:nth-child(even) td {
          background: rgba(255,255,255,0.02);
        }
        .akademiya-content .callout {
          background: rgba(99,102,241,0.08);
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 0.75rem;
          padding: 1rem 1.25rem;
          margin: 1.5rem 0;
          color: rgba(255,255,255,0.7);
        }
        .akademiya-content .callout-tip {
          background: rgba(16,185,129,0.07);
          border: 1px solid rgba(16,185,129,0.2);
          border-radius: 0.75rem;
          padding: 1rem 1.25rem;
          margin: 1.5rem 0;
          color: rgba(255,255,255,0.7);
        }
      `}</style>
    </div>
  );
};

export default AkademiyaPost;
