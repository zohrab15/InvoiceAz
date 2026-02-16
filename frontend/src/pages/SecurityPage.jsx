import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import SecuritySettings from '../components/settings/SecuritySettings';

const SecurityPage = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-6 pb-12 px-4"
        >
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-50 rounded-2xl text-red-600">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Təhlükəsizlik</h2>
                        <p className="text-gray-400 text-sm font-medium mt-1">
                            Hesabınızın təhlükəsizliyini və giriş icazələrini idarə edin
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
                <SecuritySettings />
            </div>
        </motion.div>
    );
};

export default SecurityPage;
