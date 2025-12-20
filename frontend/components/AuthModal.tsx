import React, { useState } from 'react';
import { auth, setToken } from '../services/api';

interface AuthModalProps {
    onSuccess: (user: any) => void;
    onClose: () => void; // Usually can't close if forced, but for design consistency
}

const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                // Form Data for OAuth2
                const response = await auth.login({ username, password });
                setToken(response.access_token);
                const user = await auth.me();
                onSuccess(user);
            } else {
                await auth.register({ username, password, email });
                // Auto login after register
                const response = await auth.login({ username, password });
                setToken(response.access_token);
                const user = await auth.me();
                onSuccess(user);
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                            {isLogin ? 'Welcome Back' : 'Join MediMnemonic'}
                        </h2>
                        <p className="text-slate-500">
                            {isLogin
                                ? 'Sign in to access your memory palace.'
                                : 'Create an account to start learning faster.'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                                placeholder="Enter your username"
                            />
                        </div>

                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                                    placeholder="Enter your email"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-500">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-teal-600 font-semibold hover:underline focus:outline-none"
                        >
                            {isLogin ? 'Sign up' : 'Log in'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
