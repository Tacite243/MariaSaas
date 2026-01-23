import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginSchema, LoginInput } from '@shared/schemas/authSchema';
import { loginUser, clearAuthError } from '@renderer/app/store/slice/authSlice';
import { RootState, AppDispatch } from '@renderer/app/store/store';


const Login: React.FC = () => {
    // 1. Hooks Architecture
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    
    // 2. Lecture du State Redux
    const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

    // 3. Gestion du Formulaire (Validation Zod)
    const { 
        register, 
        handleSubmit, 
        formState: { errors } 
    } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: 'admin@mariasaas.com', // Pré-rempli pour faciliter tes tests
            password: 'password123'
        }
    });

    // 4. Redirection automatique si succès
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    // 5. Soumission
    const onSubmit = (data: LoginInput) => {
        // Déclenche le Thunk -> IPC -> Backend -> DB
        dispatch(loginUser(data));
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

                    {/* Zone d'erreur globale (venant du Backend) */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <svg className="w-5 h-5 text-red-500 mt-0.5 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-red-800">Erreur de connexion</h4>
                                <p className="text-xs text-red-600 mt-1">{error}</p>
                            </div>
                            <button onClick={() => dispatch(clearAuthError())} className="text-red-400 hover:text-red-600">✕</button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* CHAMP EMAIL */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Email professionnel</label>
                            <div className="relative">
                                <input
                                    {...register('email')}
                                    type="email"
                                    className={`w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-2xl focus:ring-4 focus:ring-sky-500/10 focus:bg-white outline-none transition-all text-slate-900 font-medium ${errors.email ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-sky-500'}`}
                                    placeholder="nom@pharmacie.com"
                                />
                                <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                                </svg>
                            </div>
                            {errors.email && <p className="text-xs text-red-500 font-bold ml-1">{errors.email.message}</p>}
                        </div>

                        {/* CHAMP MOT DE PASSE */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-bold text-slate-700">Mot de passe</label>
                                <button type="button" className="text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors">Oublié ?</button>
                            </div>
                            <div className="relative">
                                <input
                                    {...register('password')}
                                    type="password"
                                    className={`w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-2xl focus:ring-4 focus:ring-sky-500/10 focus:bg-white outline-none transition-all text-slate-900 font-medium ${errors.password ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-sky-500'}`}
                                    placeholder="••••••••"
                                />
                                <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </div>
                            {errors.password && <p className="text-xs text-red-500 font-bold ml-1">{errors.password.message}</p>}
                        </div>

                        <div className="flex items-center gap-2 ml-1 pb-2">
                            <input type="checkbox" id="remember" className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
                            <label htmlFor="remember" className="text-sm font-medium text-slate-500 cursor-pointer">Se souvenir de moi</label>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black rounded-2xl transition-all shadow-xl shadow-sky-600/25 active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
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
                            Développé par Tacite WK
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
