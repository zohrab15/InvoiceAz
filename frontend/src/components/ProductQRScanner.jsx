import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, CameraOff, RefreshCw, AlertTriangle, Video } from 'lucide-react';

const ProductQRScanner = ({ onScan, onClose }) => {
    const [error, setError] = useState(null);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [cameras, setCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState(null);
    const html5QrCode = useRef(null);

    const isSecure = window.isSecureContext;

    useEffect(() => {
        html5QrCode.current = new Html5Qrcode("reader");

        const initScanner = async () => {
            if (!isSecure) {
                setError("Kamera üçün HTTPS bağlantısı tələb olunur. Zəhmət olmasa təhlükəsiz bağlantını yoxlayın.");
                return;
            }

            try {
                const devices = await Html5Qrcode.getCameras();
                if (devices && devices.length > 0) {
                    setCameras(devices);
                    // Selection logic: Look for "back", "rear", or just take the last one
                    const backCamera = devices.find(d =>
                        d.label.toLowerCase().includes('back') ||
                        d.label.toLowerCase().includes('rear') ||
                        d.label.toLowerCase().includes('arxa')
                    );
                    const targetId = backCamera ? backCamera.id : devices[devices.length - 1].id;
                    setSelectedCameraId(targetId);
                    startScanning(targetId);
                } else {
                    setError("Cihazda kamera tapılmadı.");
                }
            } catch (err) {
                console.error("Camera detection error:", err);
                setError("Kamera tapılarkən xəta baş verdi. İcazələri yoxlayın.");
            }
        };

        const currentHtml5QrCode = html5QrCode.current;
        initScanner();

        return () => {
            if (currentHtml5QrCode?.isScanning) {
                currentHtml5QrCode.stop().catch(e => console.warn(e));
            }
        };
    }, [onScan, isSecure]);

    const startScanning = async (cameraId) => {
        if (html5QrCode.current?.isScanning) {
            await html5QrCode.current.stop();
        }

        setIsCameraReady(false);
        try {
            await html5QrCode.current.start(
                cameraId,
                { fps: 15, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    onScan(decodedText);
                    onClose();
                },
                () => { /* ignore constant scanning errors */ }
            );
            setIsCameraReady(true);
            setError(null);
        } catch (err) {
            console.error("Camera start error:", err);
            setError(`Kamera açıla bilmədi: ${err.message || 'Naməlum xəta'}`);
        }
    };

    const handleCameraSwitch = (e) => {
        const id = e.target.value;
        setSelectedCameraId(id);
        startScanning(id);
    };

    return (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
            <div className="rounded-[2.5rem] w-full max-w-lg overflow-hidden relative shadow-2xl"
                style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>

                <div className="p-6 flex justify-between items-center" style={{ borderBottom: '1px solid var(--color-card-border)' }}>
                    <div>
                        <h3 className="font-black text-xl" style={{ color: 'var(--color-text-primary)' }}>Məhsul Skaneri</h3>
                        <div className="flex items-center gap-2 mt-1">
                            {!isSecure && <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold">HTTPS YOXDUR</span>}
                            <span className="text-[10px] uppercase font-black tracking-widest opacity-50" style={{ color: 'var(--color-text-secondary)' }}>QR və ya Barkod</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors" style={{ color: 'var(--color-text-muted)' }}>
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8">
                    <div className="relative aspect-square w-full max-w-[320px] mx-auto overflow-hidden rounded-3xl bg-slate-900 border-4 border-white/5 shadow-2xl">
                        <div id="reader" className="w-full h-full"></div>

                        {!isCameraReady && !error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900 text-white z-10">
                                <RefreshCw className="animate-spin opacity-40" size={32} />
                                <span className="text-xs font-bold tracking-widest uppercase opacity-40">Kamera işə düşür...</span>
                            </div>
                        )}

                        {error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-900 z-20">
                                <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4 animate-pulse">
                                    <AlertTriangle size={32} />
                                </div>
                                <p className="text-sm font-bold text-white mb-2">Skaner işləmir</p>
                                <p className="text-xs text-slate-400 leading-relaxed max-w-[200px]">{error}</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="mt-6 px-6 py-2 bg-white/10 text-white rounded-xl text-xs font-bold hover:bg-white/20 transition-all"
                                >
                                    Səhifəni yenilə
                                </button>
                            </div>
                        )}

                        {isCameraReady && (
                            <div className="absolute inset-0 pointer-events-none z-10">
                                <div className="absolute inset-0 border-[3px] border-blue-500/30 rounded-2xl"></div>
                                <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,1)] animate-scan-line"></div>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 space-y-4">
                        {cameras.length > 1 && (
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                                    <Video size={12} /> Kamera Seçimi
                                </label>
                                <select
                                    className="w-full p-4 rounded-2xl appearance-none font-bold text-sm outline-none transition-all cursor-pointer"
                                    style={{ backgroundColor: 'var(--color-input-bg)', color: 'var(--color-text-primary)' }}
                                    value={selectedCameraId || ''}
                                    onChange={handleCameraSwitch}
                                >
                                    {cameras.map(c => (
                                        <option key={c.id} value={c.id}>{c.label || `Kamera ${cameras.indexOf(c) + 1}`}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 shrink-0">
                                <RefreshCw size={20} className="animate-spin-slow" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-black uppercase tracking-wider text-blue-500">İpucu</p>
                                <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                                    Əgər şəkil hələ də qaranlıqdırsa, yuxarıdan başqa kameranı seçməyə çalışın.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes scan-line {
                    0% { top: 0% }
                    100% { top: 100% }
                }
                .animate-scan-line {
                    animation: scan-line 3s ease-in-out infinite alternate;
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg) }
                    to { transform: rotate(360deg) }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
                #reader video {
                    object-fit: cover !important;
                    width: 100% !important;
                    height: 100% !important;
                    border-radius: 1.5rem;
                }
            `}</style>
        </div>
    );
};

export default ProductQRScanner;
