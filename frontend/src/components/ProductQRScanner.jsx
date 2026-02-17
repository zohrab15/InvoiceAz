import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, CameraOff, RefreshCw } from 'lucide-react';

const ProductQRScanner = ({ onScan, onClose }) => {
    const [error, setError] = useState(null);
    const [isCameraReady, setIsCameraReady] = useState(false);

    useEffect(() => {
        const html5QrCode = new Html5Qrcode("reader");
        const qrConfig = { fps: 10, qrbox: { width: 250, height: 250 } };

        const startScanner = async () => {
            try {
                // Prefer back camera (environment)
                await html5QrCode.start(
                    { facingMode: "environment" },
                    qrConfig,
                    (decodedText) => {
                        onScan(decodedText);
                        stopScanner();
                    },
                    (errorMessage) => {
                        // ignore constant scanning errors
                    }
                );
                setIsCameraReady(true);
                setError(null);
            } catch (err) {
                console.error("Camera start error:", err);
                setIsCameraReady(false);
                if (err?.name === 'NotAllowedError') {
                    setError("Kamera icazəsi rədd edildi. Zəhmət olmasa brauzer tənzimləmələrindən icazə verin.");
                } else if (err?.name === 'NotFoundError') {
                    setError("Cihazda kamera tapılmadı.");
                } else {
                    setError("Kamera açılarkən xəta baş verdi. HTTPS bağlantısını yoxlayın.");
                }
            }
        };

        const stopScanner = async () => {
            if (html5QrCode.isScanning) {
                try {
                    await html5QrCode.stop();
                } catch (e) {
                    console.warn("Stop scanner error", e);
                }
            }
        };

        startScanner();

        return () => {
            stopScanner();
        };
    }, [onScan]);

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="rounded-[2.5rem] w-full max-w-lg overflow-hidden relative shadow-2xl" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
                <div className="p-6 flex justify-between items-center" style={{ borderBottom: '1px solid var(--color-card-border)' }}>
                    <div>
                        <h3 className="font-black text-xl" style={{ color: 'var(--color-text-primary)' }}>Məhsul Skaneri</h3>
                        <p className="text-[10px] uppercase font-black tracking-widest opacity-50" style={{ color: 'var(--color-text-secondary)' }}>QR və ya Barkod</p>
                    </div>
                    <button onClick={onClose} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors" style={{ color: 'var(--color-text-muted)' }}>
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8">
                    <div className="relative aspect-square w-full max-w-[320px] mx-auto overflow-hidden rounded-3xl bg-slate-900 shadow-2xl border-2 border-white/5">
                        <div id="reader" className="w-full h-full"></div>

                        {!isCameraReady && !error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900 text-white">
                                <RefreshCw className="animate-spin opacity-40" size={32} />
                                <span className="text-xs font-bold tracking-widest uppercase opacity-40">Kamera işə düşür...</span>
                            </div>
                        )}

                        {error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-900">
                                <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4">
                                    <CameraOff size={32} />
                                </div>
                                <p className="text-sm font-bold text-white mb-2">Xəta baş verdi</p>
                                <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
                            </div>
                        )}

                        {isCameraReady && (
                            <div className="absolute inset-0 pointer-events-none border-[3px] border-blue-500/30 rounded-3xl">
                                <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan-line"></div>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500 shrink-0">
                            <RefreshCw size={16} />
                        </div>
                        <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                            Kodu çərçivənin mərkəzinə gətirin. Avtomatik tanınma bir neçə saniyə çəkə bilər.
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes scan-line {
                    0% { top: 0% }
                    100% { top: 100% }
                }
                .animate-scan-line {
                    animation: scan-line 2.5s ease-in-out infinite alternate;
                }
                #reader video {
                    object-fit: cover !important;
                    width: 100% !important;
                    height: 100% !important;
                }
            `}</style>
        </div>
    );
};

export default ProductQRScanner;
