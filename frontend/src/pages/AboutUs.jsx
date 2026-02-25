import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { 
    Zap, 
    ArrowLeft, 
    Target, 
    Users, 
    ShieldCheck, 
    Rocket, 
    Sparkles,
    CheckCircle2,
    Globe,
    Coffee
} from 'lucide-react';

const AboutUs = () => {
    const navigate = useNavigate();

    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] -translate-y-1/3 pointer-events-none" />
            <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[150px] pointer-events-none" />

            {/* ══════════ NAVBAR ══════════ */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-4 md:px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center bg-white/5 backdrop-blur-2xl rounded-2xl px-4 md:px-6 py-3 border border-white/10">
                    <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Zap size={16} className="text-white" />
                        </div>
                        <span className="text-xl font-black tracking-tight">InvoiceAZ</span>
                    </div>
                    <button 
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-sm font-bold text-white/60 hover:text-white transition-all group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        Ana Səhifə
                    </button>
                </div>
            </nav>

            {/* ══════════ HERO SECTION ══════════ */}
            <section className="relative pt-40 pb-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div {...fadeIn}>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8">
                            <Sparkles size={14} className="text-blue-400" />
                            <span className="text-xs font-bold text-blue-300 uppercase tracking-widest">Hekayəmiz</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                            Biz sadəcə bir proqram deyil,<br /> 
                            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">Biznes tərəfdaşıyıq</span>
                        </h1>
                        <p className="text-lg md:text-xl text-white/50 leading-relaxed font-medium">
                            Azərbaycandakı hər bir sahibkarın maliyyə işlərini asanlaşdırmaq və rəqəmsallaşdırmaq üçün yola çıxdıq.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ══════════ THE STORY ══════════ */}
            <section className="py-20 px-6 relative">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <motion.div 
                            initial={{ opacity: 0, x: -40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-6"
                        >
                            <h2 className="text-3xl font-black">Ehtiyacdan yaranan innovasiya</h2>
                            <div className="space-y-4 text-white/60 leading-relaxed font-medium">
                                <p>
                                    Hər bir böyük layihə kiçik bir narahatlıqdan başlayır. InvoiceAZ-ın hekayəsi də fərqli deyil. 
                                    2023-cü ildə biz, bir qrup gənc sahibkar, Bakıda kiçik bir ofisdə öz işlərimizi idarə etməyə çalışırdıq. 
                                    Lakin rəqəmsallaşma dövründə yaşamağımıza rəğmən, hər gün kağız fakturaların, Excel cədvəllərindəki 
                                    qarışıq rəqəmlərin və ödənişlərin izlənilməsində yaranan xaosun içində boğulurduq.
                                </p>
                                <p>
                                    Daim özümüzə sual verirdik: <span className="text-blue-400">"Niyə bir azərbaycanlı sahibkar üçün sadə, sürətli və professional bir maliyyə idarəetmə aləti yoxdur?"</span>
                                </p>
                                <p>
                                    Bazardakı mövcud proqramlar ya çox mürəkkəb idi, ya da yerli vergi sistemimizə və biznes mədəniyyətimizə tam uyğun gəlmirdi. 
                                    Beləliklə, qərara gəldik ki, öz hekayəmizi özümüz yazaq. İlk kod sətirləri məhz o zaman yazıldı.
                                </p>
                            </div>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, x: 40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative"
                        >
                            <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/20 to-violet-500/20 rounded-3xl blur-2xl" />
                            <div className="relative aspect-square rounded-3xl border border-white/10 bg-white/5 p-8 flex flex-col justify-center items-center text-center overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Coffee size={120} />
                                </div>
                                <div className="w-20 h-20 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6">
                                    <Rocket size={40} className="text-blue-400" />
                                </div>
                                <h3 className="text-2xl font-black mb-4">Gələcəyə Baxış</h3>
                                <p className="text-sm text-white/40 font-medium leading-relaxed italic">
                                    "Məqsədimiz Azərbaycandakı hər bir biznesin maliyyə dilində professional şəkildə 'danışmasına' kömək etməkdir."
                                </p>
                            </div>
                        </motion.div>
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-16 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 md:p-12"
                    >
                        <p className="text-lg md:text-xl text-white/70 leading-relaxed font-medium text-center italic">
                            "Bu gün InvoiceAZ minlərlə istifadəçiyə vaxt qazandırır, onların kağız israfını azaldır və ən əsası, bizneslərinə peşəkarlıq gətirir. 
                            Bizim hekayəmiz sizin uğurunuzla böyüyür. Çünki biz bilirik ki, sizin hər bir fakturanızın arxasında böyük bir zəhmət və bir hekayə dayanır."
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ══════════ VALUES ══════════ */}
            <section className="py-20 px-6 bg-white/[0.02]">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">Dəyərlərimiz</h2>
                        <p className="text-white/40 font-medium">Bizi fərqləndirən prinsiplərimiz</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { 
                                icon: <Target className="text-blue-400" />, 
                                title: "Müştəri Fokuslu", 
                                desc: "Hər bir yeni funksiyanı istifadəçilərimizin rəyləri əsasında hazırlayırıq." 
                            },
                            { 
                                icon: <ShieldCheck className="text-emerald-400" />, 
                                title: "Maksimum Təhlükəsizlik", 
                                desc: "Biznes məlumatlarınızın gizli və qorunmuş olması bizim 1 nömrəli prioritetimizdir." 
                            },
                            { 
                                icon: <Globe className="text-violet-400" />, 
                                title: "Yerli və Müasir", 
                                desc: "Qlobal texnologiyaları yerli biznes mədəniyyətinə və qanunvericiliyə inteqrasiya edirik." 
                            }
                        ].map((v, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/[0.08] transition-all"
                            >
                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6">
                                    {v.icon}
                                </div>
                                <h4 className="text-xl font-black mb-3">{v.title}</h4>
                                <p className="text-sm text-white/40 leading-relaxed font-medium">{v.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════ STATS ══════════ */}
            <section className="py-20 px-6">
                <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 text-center border-y border-white/5 py-12">
                    {[
                        { label: "Aktiv Biznes", value: "500+" },
                        { label: "Yaradılan Faktura", value: "15,000+" },
                        { label: "Məmnuniyyət", value: "99%" },
                        { label: "Komanda Üzvü", value: "12" }
                    ].map((s, i) => (
                        <div key={i}>
                            <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent mb-2">
                                {s.value}
                            </div>
                            <div className="text-[10px] uppercase tracking-widest font-black text-white/30">{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ══════════ CTA ══════════ */}
            <section className="py-28 px-6 text-center">
                <div className="max-w-2xl mx-auto space-y-8">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight">Hekayəmizin bir hissəsi olun</h2>
                    <p className="text-white/40 font-medium">Bu gün qeydiyyatdan keçin və biznesinizi bizimlə birlikdə rəqəmsallaşdırın.</p>
                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: '0 20px 60px rgba(99,102,241,0.4)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/register')}
                        className="px-10 py-4 bg-gradient-to-r from-blue-500 to-violet-600 rounded-2xl font-black text-lg shadow-xl"
                    >
                        Pulsuz Başlayın
                    </motion.button>
                </div>
            </section>

            {/* ══════════ FOOTER ══════════ */}
            <footer className="py-12 px-6 border-t border-white/5 text-center">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
                            <Zap size={12} />
                        </div>
                        <span className="text-base font-black tracking-tight">InvoiceAZ</span>
                    </div>
                    <p className="text-xs text-white/20 font-medium">© 2026 InvoiceAZ. Bütün hüquqlar qorunur.</p>
                </div>
            </footer>
        </div>
    );
};

export default AboutUs;
