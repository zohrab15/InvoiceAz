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
            <div className="rounded-2xl w-full max-w-lg overflow-hidden relative" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
                <div className="p-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--color-card-border)' }}>
                    <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>QR / SKU Skaner</h3>
                    <button onClick={onClose} className="p-2 rounded-lg" style={{ color: 'var(--color-text-muted)' }}>
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6">
                    <div id="reader" className="overflow-hidden rounded-xl bg-black shadow-inner"></div>
                    <p className="text-center text-sm mt-4" style={{ color: 'var(--color-text-secondary)' }}>
                        Məhsulun barkodunu və ya QR kodunu kameraya yaxınlaşdırın
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ProductQRScanner;
