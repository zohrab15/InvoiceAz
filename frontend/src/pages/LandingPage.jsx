import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    FileText,
    TrendingUp,
    ArrowRight,
    CheckCircle2,
    Wallet,
    Bell,
    Zap,
    BarChart3,
    Shield,
    Globe,
    Users,
    Star,
    ChevronRight,
    Play,
    Sparkles,
    Receipt,
    PieChart,
    Clock,
    QrCode
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

/* ─────────────── Animated Counter ─────────────── */
const Counter = ({ end, suffix = '', duration = 2000 }) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (!isInView) return;
        let start = 0;
        const step = end / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= end) { setCount(end); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
    }, [isInView, end, duration]);

    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

/* ─────────────── Main Component ─────────────── */
const LandingPage = () => {
    const navigate = useNavigate();
    const token = useAuthStore(state => state.token);

    const goRegister = () => navigate(token ? '/dashboard' : '/register');
    const goLogin = () => navigate('/login');

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ══════════ NAVBAR ══════════ */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center bg-white/5 backdrop-blur-2xl rounded-2xl px-6 py-3 border border-white/10">
                    <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center">
                            <Zap size={18} className="text-white" />
                        </div>
                        <span className="text-xl font-black tracking-tight">InvoiceAZ</span>
                    </div>
                    <div className="hidden md:flex items-center gap-6">
                        <a href="#features" className="text-sm font-semibold text-white/60 hover:text-white transition-colors">Özəlliklər</a>
                        <a href="#how" className="text-sm font-semibold text-white/60 hover:text-white transition-colors">Necə işləyir</a>
                        <a href="#pricing" className="text-sm font-semibold text-white/60 hover:text-white transition-colors">Qiymət</a>
                        <a href="#reviews" className="text-sm font-semibold text-white/60 hover:text-white transition-colors">Rəylər</a>
                    </div>
                    <div className="flex items-center gap-3">
                        {!token ? (
                            <button onClick={goLogin} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-all">
                                Pulsuz Qeydiyyat
                            </button>
                        ) : (
                            <button onClick={() => navigate('/dashboard')} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm">Panelə Keç</button>
                        )}
                    </div>
                </div>
            </nav>

            {/* ══════════ HERO ══════════ */}
            <section className="relative pt-40 pb-28 px-6 min-h-screen flex items-center">
                {/* Gradient orbs */}
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[150px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px]" />

                <div className="max-w-7xl mx-auto w-full relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        {/* Left - Text */}
                        <div className="flex-1 text-center lg:text-left">
                            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8">
                                    <Sparkles size={14} className="text-blue-400" />
                                    <span className="text-xs font-bold text-blue-300 uppercase tracking-widest">Azərbaycanın #1 Faktura Platforması</span>
                                </div>

                                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] mb-8 tracking-tight">
                                    Biznesinizi{' '}
                                    <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                                        Rəqəmsal
                                    </span>
                                    <br />Gələcəyə Daşıyın
                                </h1>

                                <p className="text-lg md:text-xl text-white/50 max-w-xl mb-10 leading-relaxed font-medium">
                                    Faktura yaratmaq, xərcləri izləmək və pul axınını nəzarətdə saxlamaq üçün lazım olan tək platforma. Sadə qeydiyyat, anında nəticə.
                                </p>

                                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                                    <motion.button
                                        whileHover={{ scale: 1.03, boxShadow: '0 20px 60px rgba(99,102,241,0.4)' }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={goLogin}
                                        className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-violet-600 rounded-2xl font-black text-lg flex items-center justify-center gap-3 group shadow-xl shadow-blue-500/20"
                                    >
                                        Pulsuz Qeydiyyat
                                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => navigate('/demo-login')}
                                        className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-white/10 transition-all font-roboto"
                                    >
                                        <Play size={18} className="fill-white text-white" />
                                        Demoya Bax
                                    </motion.button>
                                </div>

                                {/* Trust badges */}
                                <div className="mt-12 flex items-center gap-6 justify-center lg:justify-start">
                                    <div className="flex -space-x-2">
                                        {['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'].map((bg, i) => (
                                            <div key={i} className={`w-8 h-8 rounded-full ${bg} border-2 border-[#0a0a0f] flex items-center justify-center text-[10px] font-bold`}>
                                                {String.fromCharCode(65 + i)}
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1 mb-0.5">
                                            {[...Array(5)].map((_, i) => <Star key={i} size={12} className="fill-amber-400 text-amber-400" />)}
                                        </div>
                                        <span className="text-xs text-white/40 font-semibold">500+ aktiv istifadəçi</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Right - Dashboard Preview */}
                        <motion.div
                            initial={{ opacity: 0, x: 60 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="flex-1 relative"
                        >
                            <div className="relative">
                                {/* Glow behind card */}
                                <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/20 to-violet-500/20 rounded-[3rem] blur-2xl" />

                                {/* Main dashboard card */}
                                <div className="relative bg-[#12121a] rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl">
                                    {/* Browser bar */}
                                    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/5">
                                        <div className="flex gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                                        </div>
                                        <div className="mx-auto bg-white/5 px-4 py-1 rounded-lg text-[10px] text-white/30 font-mono">invoiceaz.app/dashboard</div>
                                    </div>

                                    {/* Dashboard content */}
                                    <div className="p-6 space-y-5">
                                        {/* Stats row */}
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { label: 'Gəlir', value: '12,450 ₼', change: '+18%', color: 'emerald' },
                                                { label: 'Xərclər', value: '3,280 ₼', change: '-5%', color: 'red' },
                                                { label: 'Mənfəət', value: '9,170 ₼', change: '+24%', color: 'blue' }
                                            ].map((s, i) => (
                                                <div key={i} className="bg-white/5 rounded-xl p-3.5 border border-white/5">
                                                    <div className="text-[10px] text-white/30 font-semibold mb-1">{s.label}</div>
                                                    <div className="text-sm font-black text-white">{s.value}</div>
                                                    <div className={`text-[10px] font-bold mt-1 ${s.color === 'red' ? 'text-red-400' : `text-${s.color}-400`}`}>{s.change}</div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Chart */}
                                        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                            <div className="text-[10px] text-white/30 font-semibold mb-3">Aylıq Gəlir Trendi</div>
                                            <div className="h-32 flex items-end gap-2 px-1">
                                                {[35, 55, 40, 70, 50, 85, 65, 90, 75, 95, 80, 100].map((h, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${h}%` }}
                                                        transition={{ duration: 0.8, delay: 0.5 + i * 0.08 }}
                                                        className="flex-1 rounded-t-md bg-gradient-to-t from-blue-500 to-violet-500 opacity-80"
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Recent invoices */}
                                        <div className="space-y-2">
                                            {[
                                                { name: 'Araz Market', amount: '2,400 ₼', status: 'Ödənilib', statusColor: 'text-emerald-400 bg-emerald-400/10' },
                                                { name: 'TechCorp LLC', amount: '5,800 ₼', status: 'Gözləyir', statusColor: 'text-amber-400 bg-amber-400/10' },
                                            ].map((inv, i) => (
                                                <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                                                    <div>
                                                        <div className="text-xs font-bold text-white/80">{inv.name}</div>
                                                        <div className="text-[10px] text-white/30 font-medium">INV-{1000 + i}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xs font-black text-white">{inv.amount}</div>
                                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${inv.statusColor}`}>{inv.status}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Floating notification */}
                                <motion.div
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="absolute -top-4 -right-4 bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-3 rounded-2xl shadow-xl shadow-emerald-500/30"
                                >
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 size={16} />
                                        <div>
                                            <div className="text-[10px] font-black">Ödəniş alındı!</div>
                                            <div className="text-[9px] opacity-80">+2,400 ₼</div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Floating badge */}
                                <motion.div
                                    animate={{ y: [0, 6, 0] }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                    className="absolute -bottom-3 -left-4 bg-[#12121a] border border-white/10 px-4 py-3 rounded-2xl shadow-xl"
                                >
                                    <div className="flex items-center gap-2">
                                        <TrendingUp size={16} className="text-blue-400" />
                                        <div>
                                            <div className="text-[10px] font-black text-white">+42% artım</div>
                                            <div className="text-[9px] text-white/40">Bu ay</div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ══════════ STATS BAR ══════════ */}
            <section className="py-16 px-6 border-y border-white/5">
                <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
                    {[
                        { value: 500, suffix: '+', label: 'Aktiv İstifadəçi' },
                        { value: 15000, suffix: '+', label: 'Yaradılan Faktura' },
                        { value: 99, suffix: '%', label: 'Müştəri Məmnuniyyəti' },
                        { value: 24, suffix: '/7', label: 'Dəstək Xidməti' },
                    ].map((stat, i) => (
                        <div key={i}>
                            <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                                <Counter end={stat.value} suffix={stat.suffix} />
                            </div>
                            <div className="text-sm text-white/40 font-semibold mt-2">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ══════════ FEATURES ══════════ */}
            <section id="features" className="py-28 px-6 relative">
                <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[150px] -translate-y-1/2" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-20">
                        <span className="text-blue-400 text-xs font-black uppercase tracking-[0.3em] mb-4 block">Güclü Özəlliklər</span>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                            Hər şey <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">bir yerdə</span>
                        </h2>
                        <p className="text-lg text-white/40 font-medium max-w-2xl mx-auto">Biznesinizin maliyyə idarəçiliyini tam avtomatlaşdırmaq üçün lazım olan bütün alətlər.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: <FileText size={24} />, title: 'Professional Fakturalar', desc: 'Saniyələr içində fərdiləşdirilmiş PDF fakturalar yaradın, müştərilərinizə bir klik ilə göndərin.', gradient: 'from-blue-500 to-cyan-500' },
                            { icon: <Wallet size={24} />, title: 'Xərc İdarəetmə', desc: 'Biznes xərclərinizi kateqoriyalar üzrə qruplaşdırın, büdcə limitləri təyin edin.', gradient: 'from-rose-500 to-orange-500' },
                            { icon: <BarChart3 size={24} />, title: 'Canlı Analitika', desc: 'Real-vaxt qrafiklər, gəlir/xərc trendləri və AI ilə gələcək proqnozlaşdırma.', gradient: 'from-violet-500 to-purple-500' },
                            { icon: <Bell size={24} />, title: 'Ağıllı Bildirişlər', desc: 'Ödəniş vaxtı yaxınlaşanda və büdcə limiti aşılanda anında xəbərdar olun.', gradient: 'from-amber-500 to-yellow-500' },
                            { icon: <Shield size={24} />, title: 'Təhlükəsiz İnfrastruktur', desc: 'Bütün məlumatlarınız şifrələnmiş serverdə saxlanılır. Tam məxfilik.', gradient: 'from-emerald-500 to-teal-500' },
                            { icon: <QrCode size={24} />, title: 'QR ilə Ödəniş', desc: 'Fakturalara avtomatik QR kod əlavə olunur, müştəriləriniz mobil bankçılıq ilə anında ödəniş etsin.', gradient: 'from-blue-500 to-indigo-500' },
                        ].map((f, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-8 transition-all duration-300"
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg`}>
                                    {f.icon}
                                </div>
                                <h4 className="text-lg font-black mb-3">{f.title}</h4>
                                <p className="text-sm text-white/40 leading-relaxed font-medium">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════ HOW IT WORKS ══════════ */}
            <section id="how" className="py-28 px-6 bg-white/[0.02]">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-20">
                        <span className="text-violet-400 text-xs font-black uppercase tracking-[0.3em] mb-4 block">Sadə Proses</span>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                            3 addımda <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">başlayın</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { step: '01', title: 'Qeydiyyat', desc: 'E-poçtunuzla 30 saniyə içində pulsuz hesab yaradın. Bank kartı tələb olunmur.', icon: <Users size={28} /> },
                            { step: '02', title: 'Biznesinizi əlavə edin', desc: 'Şirkət adınızı, loqonuzu və bank rekvizitlərinizi daxil edin. Sadə və sürətli.', icon: <Receipt size={28} /> },
                            { step: '03', title: 'Faktura yaradın', desc: 'İlk professional fakturanızı yaradın, PDF olaraq yükləyin və ya birbaşa göndərin!', icon: <FileText size={28} /> },
                        ].map((s, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.2 }}
                                className="relative text-center p-8 group"
                            >
                                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center mb-6 text-violet-400">
                                    {s.icon}
                                </div>
                                <h4 className="text-xl font-black mb-3">{s.title}</h4>
                                <p className="text-sm text-white/40 leading-relaxed font-medium">{s.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════ REVIEWS ══════════ */}
            <section id="reviews" className="py-28 px-6 relative">
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px]" />

                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="text-center mb-20">
                        <span className="text-cyan-400 text-xs font-black uppercase tracking-[0.3em] mb-4 block">Müştəri Rəyləri</span>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                            Onlar artıq <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">istifadə edir</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { name: 'Orxan Məmmədov', role: 'CEO, DigiTech', text: 'InvoiceAZ istifadə etməyə başlayandan bəri mühasibat işləri 70% azalıb. Vaxtıma qənaət edirəm.', avatar: 'O' },
                            { name: 'Aygün Həsənova', role: 'Sahibkar', text: 'Çox sadə interfeys, bütün fakturalarımı burada yaradıram. Müştərilərim professional PDF-lərdən çox razıdır.', avatar: 'A' },
                            { name: 'Rəşad Quliyev', role: 'Mühasib, Caspian Group', text: 'Xərc analitikası əla işləyir. Hər kateqoriya üzrə xərcləri izləmək çox rahatdır. Tövsiyə edirəm!', avatar: 'R' },
                        ].map((r, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15 }}
                                className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8"
                            >
                                <div className="flex items-center gap-1 mb-5">
                                    {[...Array(5)].map((_, j) => <Star key={j} size={14} className="fill-amber-400 text-amber-400" />)}
                                </div>
                                <p className="text-sm text-white/60 leading-relaxed mb-6 font-medium">"{r.text}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center font-black text-sm">
                                        {r.avatar}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold">{r.name}</div>
                                        <div className="text-xs text-white/30 font-medium">{r.role}</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════ PRICING ══════════ */}
            <section id="pricing" className="py-28 px-6 bg-white/[0.02] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[200px] -translate-y-1/3" />

                <div className="max-w-5xl mx-auto relative z-10">
                    <div className="text-center mb-20">
                        <span className="text-emerald-400 text-xs font-black uppercase tracking-[0.3em] mb-4 block">Qiymətləndirmə</span>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                            Şəffaf <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">qiymətlər</span>
                        </h2>
                        <p className="text-lg text-white/40 font-medium">Gizli ödəniş yoxdur. İstədiyiniz zaman ləğv edin.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Free */}
                        <motion.div whileHover={{ y: -8 }} className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8 flex flex-col">
                            <div className="mb-6">
                                <h4 className="text-xl font-black mb-1">Başlanğıc</h4>
                                <p className="text-sm text-white/30 font-medium">Fərdi sahibkarlar üçün.</p>
                            </div>
                            <div className="text-4xl font-black mb-8">Pulsuz</div>
                            <ul className="space-y-4 mb-10 flex-1">
                                {['Ayda 5 faktura', '3 aylıq tarixçə', 'Sadə hesabatlar', '1 biznes profili'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-white/50 font-semibold">
                                        <CheckCircle2 size={18} className="text-white/20" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={goLogin} className="w-full py-3.5 bg-white/5 border border-white/10 rounded-2xl font-black text-sm hover:bg-white/10 transition-all">
                                Pulsuz Qeydiyyat
                            </button>
                        </motion.div>

                        {/* Pro */}
                        <motion.div whileHover={{ y: -8 }} className="relative bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-blue-500/20 rounded-3xl p-8 flex flex-col">
                            <div className="absolute -top-3 right-8 bg-gradient-to-r from-blue-500 to-violet-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                                Populyar
                            </div>
                            <div className="mb-6">
                                <h4 className="text-xl font-black mb-1">Professional</h4>
                                <p className="text-sm text-white/40 font-medium">Böyüyən bizneslər üçün.</p>
                            </div>
                            <div className="text-4xl font-black mb-8">19.99 ₼ <span className="text-lg text-white/30">/ay</span></div>
                            <ul className="space-y-4 mb-10 flex-1">
                                {['Ayda 100 faktura', 'Özəl faktura dizaynları', 'Tam analitika + AI proqnoz', 'Limitsiz bildirişlər', 'PDF və Excel eksport', 'QR ödəniş inteqrasiyası', '7/24 prioritet dəstək'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-white/70 font-bold">
                                        <Zap size={18} className="text-blue-400" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={goLogin} className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-violet-600 rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all">
                                Pro-ya Keçin
                            </button>
                        </motion.div>

                        {/* Premium - COMING SOON */}
                        <motion.div
                            whileHover={{ y: -8 }}
                            className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8 flex flex-col relative overflow-hidden opacity-75"
                        >
                            <div className="absolute top-0 right-0 bg-amber-500 text-black font-black text-[10px] px-8 py-1 rotate-45 translate-x-8 translate-y-4 shadow-lg">
                                TEZLİKLƏ
                            </div>
                            <div className="mb-6">
                                <h4 className="text-xl font-black mb-1">Premium</h4>
                                <p className="text-sm text-white/30 font-medium">Limitsiz imkanlar.</p>
                            </div>
                            <div className="text-4xl font-black mb-8">49.99 ₼ <span className="text-lg text-white/30">/ay</span></div>
                            <ul className="space-y-4 mb-10 flex-1">
                                {['Limitsiz faktura', 'VIP Dəstək', 'API inteqrasiyası', 'Komanda (Qrup) üzvləri', 'Fərdiləşdirilə bilən Faktura Temaları', 'Limitsiz biznes profili', 'Tam ağ etiket (White-label)'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-white/50 font-semibold">
                                        <CheckCircle2 size={18} className="text-amber-500/50" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <button disabled className="w-full py-3.5 bg-white/5 border border-white/10 rounded-2xl font-black text-sm text-white/40 cursor-not-allowed">
                                Tezliklə
                            </button>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ══════════ FINAL CTA ══════════ */}
            <section className="py-28 px-6">
                <div className="max-w-4xl mx-auto text-center relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-violet-600/20 rounded-[3rem] blur-3xl" />
                    <div className="relative bg-gradient-to-br from-white/[0.04] to-white/[0.02] border border-white/[0.08] rounded-[3rem] p-14 md:p-20">
                        <Sparkles className="text-blue-400 mx-auto mb-6" size={40} />
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                            İndi başlamağın<br />
                            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">ən yaxşı vaxtıdır</span>
                        </h2>
                        <p className="text-lg text-white/40 font-medium mb-10 max-w-2xl mx-auto">
                            Minlərlə azərbaycanlı sahibkar artıq InvoiceAZ ilə zamanına qənaət edir. Pulsuz Qeydiyyat ilə cəmi 30 saniyədə başlayın.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: '0 30px 80px rgba(99,102,241,0.5)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={goLogin}
                            className="px-12 py-5 bg-gradient-to-r from-blue-500 to-violet-600 rounded-2xl font-black text-xl shadow-2xl shadow-blue-500/30"
                        >
                            Pulsuz Qeydiyyat
                        </motion.button>
                    </div>
                </div>
            </section>

            {/* ══════════ FOOTER ══════════ */}
            <footer className="py-16 px-6 border-t border-white/5">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-10">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
                                <Zap size={16} />
                            </div>
                            <span className="text-lg font-black tracking-tight">InvoiceAZ</span>
                        </div>
                        <p className="text-sm text-white/30 font-medium max-w-xs">Azərbaycanın ilk tam rəqəmsal faktura və maliyyə idarəetmə platforması.</p>
                        <p className="text-xs text-white/20 font-medium mt-4">© 2026 InvoiceAZ. Bütün hüquqlar qorunur.</p>
                    </div>
                    <div className="flex gap-16">
                        <div className="flex flex-col gap-3">
                            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Məhsul</h5>
                            <a href="#features" className="text-sm font-medium text-white/30 hover:text-white transition-colors">Özəlliklər</a>
                            <a href="#pricing" className="text-sm font-medium text-white/30 hover:text-white transition-colors">Qiymətlər</a>
                            <a href="#how" className="text-sm font-medium text-white/30 hover:text-white transition-colors">Necə İşləyir</a>
                        </div>
                        <div className="flex flex-col gap-3">
                            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Şirkət</h5>
                            <a href="#" className="text-sm font-medium text-white/30 hover:text-white transition-colors">Haqqımızda</a>
                            <a href="#reviews" className="text-sm font-medium text-white/30 hover:text-white transition-colors">Rəylər</a>
                            <a href="#" className="text-sm font-medium text-white/30 hover:text-white transition-colors">Əlaqə</a>
                        </div>
                        <div className="flex flex-col gap-3">
                            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Hüquqi</h5>
                            <a href="#" className="text-sm font-medium text-white/30 hover:text-white transition-colors">Qaydalar</a>
                            <a href="#" className="text-sm font-medium text-white/30 hover:text-white transition-colors">Məxfilik</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
