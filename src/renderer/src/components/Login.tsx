import React, { useState } from 'react';

interface LoginProps {
    onLogin: (email: string, role: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('admin@mariasaas.com');
    const [password, setPassword] = useState('password123');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            onLogin(email, 'SUPERADMIN');
        }, 800);
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-600/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px]"></div>

            <div className="w-full max-w-[440px] z-10">
                <div className="bg-white rounded-[2.5rem] p-10 md:p-12 shadow-2xl shadow-black/50 border border-white/10 backdrop-blur-sm">
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-20 h-20 bg-sky-600 rounded-3xl flex items-center justify-center text-white font-black text-4xl shadow-2xl shadow-sky-600/40 rotate-3 mb-6">
                            M
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">MariaSaas</h1>
                        <p className="text-slate-500 font-medium mt-2">Gestion de Pharmacie Intelligente</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Email professionnel</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 focus:bg-white outline-none transition-all text-slate-900 font-medium"
                                    placeholder="nom@pharmacie.com"
                                    required
                                />
                                <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                                </svg>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-bold text-slate-700">Mot de passe</label>
                                <button type="button" className="text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors">Oublié ?</button>
                            </div>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 focus:bg-white outline-none transition-all text-slate-900 font-medium"
                                    placeholder="••••••••"
                                    required
                                />
                                <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 ml-1 pb-2">
                            <input type="checkbox" id="remember" className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
                            <label htmlFor="remember" className="text-sm font-medium text-slate-500 cursor-pointer">Se souvenir de moi</label>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-300 text-white font-black rounded-2xl transition-all shadow-xl shadow-sky-600/25 active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    Connexion au Système
                                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path d="M5 12h14m-7-7 7 7-7 7" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-10 border-t border-slate-100">
                        <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                            Propulsé par MariaSaas Cloud
                        </p>
                    </div>
                </div>

                <p className="text-center mt-8 text-slate-500 text-sm font-medium">
                    Pas encore de compte ? <button className="text-sky-400 font-bold hover:underline">Contacter le support</button>
                </p>
            </div>
        </div>
    );
};

export default Login;
