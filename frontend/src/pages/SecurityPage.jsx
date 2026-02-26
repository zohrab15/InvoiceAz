import React from 'react';
import { motion as Motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import SecuritySettings from '../components/settings/SecuritySettings';

const SecurityPage = () => {
    return (
        <Motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-6 pb-12 px-4"
        >
            <div
                className="p-6 rounded-3xl"
                style={{
                    backgroundColor: 'var(--color-card-bg)',
                    border: '1px solid var(--color-card-border)',
                    boxShadow: 'var(--color-card-shadow)'
                }}
            >
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-500/10 rounded-2xl text-red-600">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--color-text-primary)' }}>Təhlükəsizlik</h2>
                        <p className="text-sm font-medium mt-1" style={{ color: 'var(--color-text-muted)' }}>
                            Hesabınızın təhlükəsizliyini və giriş icazələrini idarə edin
                        </p>
                    </div>
                </div>
            </div>

            <div
                className="rounded-3xl overflow-hidden"
                style={{
                    backgroundColor: 'var(--color-card-bg)',
                    border: '1px solid var(--color-card-border)',
                    boxShadow: 'var(--color-card-shadow)'
                }}
            >
                <SecuritySettings />
            </div>
        </Motion.div>
    );
};

export default SecurityPage;
