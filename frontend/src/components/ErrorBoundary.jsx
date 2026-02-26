import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0f] text-white p-6 text-center">
                    <div className="max-w-md space-y-6">
                        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight italic">Xəta Baş Verdi</h1>
                        <p className="text-slate-400 font-medium leading-relaxed">
                            Proqramın bu hissəsi yüklənərkən xəta baş verdi. Zəhmət olmasa səhifəni yeniləyin və ya bir az sonra yenidən cəhd edin.
                        </p>
                        <div className="pt-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                            >
                                Səhifəni Yenilə
                            </button>
                        </div>
                        {import.meta.env.DEV && (
                            <div className="mt-8 p-4 bg-red-500/5 border border-red-500/10 rounded-xl text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-2">Debug Info</p>
                                <p className="text-xs font-mono text-red-300 break-all">{this.state.error?.toString()}</p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
