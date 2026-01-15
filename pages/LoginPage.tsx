
import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { loginUser, signupUser, checkUsernameAvailability } from '../services/userService';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      if (isSignup) {
        const isAvailable = await checkUsernameAvailability(username);
        if (!isAvailable) { setError('Username already taken.'); setIsLoading(false); return; }
        const newUser = await signupUser(username, password, email);
        onLogin(newUser);
      } else {
        const user = await loginUser(username, password);
        if (user) onLogin(user);
        else setError('Access Denied: Invalid credentials.');
      }
    } catch (err: any) { setError(err.message || 'Authentication sequence failed.'); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-6 py-20 animate-reveal bg-slate-50/20">
      <div className="max-w-xl w-full">
        <div className="bg-white rounded-[4.5rem] soft-shadow p-16 md:p-24 border border-slate-50 relative overflow-hidden">
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-sky-500/5 rounded-full blur-[100px]"></div>
          
          <div className="text-center mb-16 relative z-10">
            <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl rotate-3 group-hover:rotate-0 transition-transform">
              <i className={`fa-solid ${isSignup ? 'fa-user-plus' : 'fa-lock'} text-white text-3xl`}></i>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-serif text-slate-900 mb-4">
              {isSignup ? 'Create Legacy' : 'Sanctuary Access'}
            </h1>
            <p className="text-slate-400 text-sm font-black uppercase tracking-[0.3em]">
              {isSignup ? 'JOIN THE ELITE TRAVELERS' : 'AUTHENTICATE TO CONTINUE'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
            {error && (
              <div className="p-6 rounded-3xl bg-red-50 border border-red-100 flex flex-col gap-3 animate-reveal">
                <div className="flex items-center gap-4">
                  <i className="fa-solid fa-triangle-exclamation text-red-500 text-sm"></i>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-900">SECURITY ALERT</span>
                </div>
                <p className="text-[11px] font-bold text-red-600 leading-relaxed">{error}</p>
              </div>
            )}

            <div className="space-y-8">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] px-2">Identification</label>
                <div className="relative group">
                  <i className="fa-solid fa-user absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-sky-500 transition-colors"></i>
                  <input type="text" required placeholder="User ID / Username" value={username} onChange={e => setUsername(e.target.value)}
                    className="w-full pl-16 pr-8 py-5 bg-slate-50 rounded-3xl border border-transparent focus:bg-white focus:border-sky-100 focus:ring-4 focus:ring-sky-500/5 outline-none text-sm font-black text-slate-800 transition-all placeholder:opacity-30" />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] px-2">Access Key</label>
                <div className="relative group">
                  <i className="fa-solid fa-key absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-sky-500 transition-colors"></i>
                  <input type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full pl-16 pr-8 py-5 bg-slate-50 rounded-3xl border border-transparent focus:bg-white focus:border-sky-100 focus:ring-4 focus:ring-sky-500/5 outline-none text-sm font-black text-slate-800 transition-all placeholder:opacity-30" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full premium-btn py-7 rounded-3xl font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl disabled:opacity-50 border-none">
              {isLoading ? 'VERIFYING...' : (isSignup ? 'REGISTER PROFILE' : 'GRANT ACCESS')}
            </button>
          </form>

          <div className="mt-16 pt-12 border-t border-slate-50 text-center">
            <button onClick={() => { setIsSignup(!isSignup); setError(''); }}
              className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-slate-900 transition-colors">
              {isSignup ? 'RETURNING GUEST? SIGN IN' : "NEW ARRIVAL? CREATE ACCOUNT"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
