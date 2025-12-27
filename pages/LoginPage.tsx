
import React, { useState, useEffect } from 'react';
import { UserRole, User } from '../types';

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

  const getUsers = (): any[] => {
    const data = localStorage.getItem('peak_stay_registered_users');
    return data ? JSON.parse(data) : [];
  };

  const saveUser = (user: any) => {
    const users = getUsers();
    users.push(user);
    localStorage.setItem('peak_stay_registered_users', JSON.stringify(users));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      // 1. Admin Check (Demo Credentials)
      if (!isSignup && username === 'admin' && password === 'password') {
        onLogin({ id: 'admin-0', username: 'Administrator', role: UserRole.ADMIN });
        setIsLoading(false);
        return;
      }

      const users = getUsers();

      if (isSignup) {
        // 2. Signup Logic
        if (users.find((u: any) => u.username === username)) {
          setError('Username already taken.');
          setIsLoading(false);
          return;
        }
        const newUser = { id: Date.now().toString(), username, password, email, role: UserRole.USER };
        saveUser(newUser);
        onLogin({ id: newUser.id, username: newUser.username, role: UserRole.USER, email: newUser.email });
      } else {
        // 3. Login Logic
        const foundUser = users.find((u: any) => u.username === username && u.password === password);
        if (foundUser) {
          onLogin({ id: foundUser.id, username: foundUser.username, role: foundUser.role, email: foundUser.email });
        } else {
          setError('Invalid credentials. Please check your username/password.');
        }
      }
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-20 animate-fade">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.1)] p-10 md:p-14 border border-gray-100 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl"></div>
          
          <div className="text-center mb-10 relative z-10">
            <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl rotate-3 group-hover:rotate-0 transition-transform">
              <i className={`fa-solid ${isSignup ? 'fa-user-plus' : 'fa-lock'} text-white text-2xl`}></i>
            </div>
            <h1 className="text-3xl font-bold font-serif text-slate-900 mb-2">
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-slate-400 text-sm font-medium tracking-wide">
              {isSignup ? 'Join our exclusive travel community' : 'Access your private sanctuaries'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black border border-red-100 flex items-center gap-3 animate-shake uppercase tracking-widest">
                <i className="fa-solid fa-circle-exclamation"></i>
                {error}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Username / ID</label>
              <div className="relative group">
                <i className="fa-solid fa-user absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors"></i>
                <input 
                  type="text" 
                  required
                  className="w-full pl-12 pr-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-amber-500 outline-none text-sm font-bold text-slate-700 transition-all"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {isSignup && (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Email Address</label>
                <div className="relative group">
                  <i className="fa-solid fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors"></i>
                  <input 
                    type="email" 
                    required
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-amber-500 outline-none text-sm font-bold text-slate-700 transition-all"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Security Key</label>
              <div className="relative group">
                <i className="fa-solid fa-key absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors"></i>
                <input 
                  type="password" 
                  required
                  className="w-full pl-12 pr-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-amber-500 outline-none text-sm font-bold text-slate-700 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-slate-900/10 active:scale-95 flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  Syncing...
                </>
              ) : (
                <>
                  <i className={`fa-solid ${isSignup ? 'fa-user-plus' : 'fa-arrow-right-to-bracket'}`}></i>
                  {isSignup ? 'Create Account' : 'Authenticate'}
                </>
              )}
            </button>
          </form>

          {!isSignup && (
            <div className="mt-8 p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50">
              <p className="text-[9px] font-black text-amber-600 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                <i className="fa-solid fa-shield-halved"></i>
                Demo Admin Access
              </p>
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-600">
                <span>User: <code className="bg-white px-1.5 py-0.5 rounded border border-amber-200 text-amber-700">admin</code></span>
                <span>Pass: <code className="bg-white px-1.5 py-0.5 rounded border border-amber-200 text-amber-700">password</code></span>
              </div>
            </div>
          )}

          <div className="mt-10 pt-10 border-t border-gray-50 text-center">
            <button 
              onClick={() => { setIsSignup(!isSignup); setError(''); }}
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-amber-600 transition-colors"
            >
              {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Create One"}
            </button>
          </div>
        </div>
        
        <p className="mt-10 text-center text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em] opacity-60">
          Peak Stay Destination Security Protocol
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>
    </div>
  );
};

export default LoginPage;
