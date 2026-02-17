import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

const ProductQRScanner = ({ onScan, onClose }) => {
    const scannerRef = useRef(null);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner('reader', {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        });

        scanner.render((result) => {
            onScan(result);
            scanner.clear();
        }, (error) => {
            // console.warn(error);
        });

        return () => {
            scanner.clear().catch(err => console.error("Failed to clear scanner", err));
        };
    }, [onScan]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden relative">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-white font-bold">QR / SKU Skaner</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-white/50">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6">
                    <div id="reader" className="overflow-hidden rounded-xl bg-black shadow-inner"></div>
                    <p className="text-center text-white/40 text-sm mt-4">
                        Məhsulun barkodunu və ya QR kodunu kameraya yaxınlaşdırın
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ProductQRScanner;
