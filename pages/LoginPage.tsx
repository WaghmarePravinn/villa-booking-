
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

  const isRlsError = error.toLowerCase().includes('rls') || error.toLowerCase().includes('security policy');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isSignup) {
        const isAvailable = await checkUsernameAvailability(username);
        if (!isAvailable) {
          setError('Username already taken.');
          setIsLoading(false);
          return;
        }
        const newUser = await signupUser(username, password, email);
        onLogin(newUser);
      } else {
        const user = await loginUser(username, password);
        if (user) {
          onLogin(user);
        } else {
          setError('Invalid credentials. Check username/password.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-20 animate-fade bg-sky-50/30">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-[3rem] shadow-xl p-10 md:p-14 border border-sky-100 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl"></div>
          
          <div className="text-center mb-10 relative z-10">
            <div className="w-20 h-20 bg-sky-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl rotate-3 transition-transform border border-sky-500">
              <i className={`fa-solid ${isSignup ? 'fa-user-plus' : 'fa-lock'} text-white text-2xl`}></i>
            </div>
            <h1 className="text-3xl font-bold font-serif text-sky-900 mb-2">
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-sky-400 text-sm font-medium tracking-wide">
              {isSignup ? 'Join our exclusive travel community' : 'Access your private sanctuaries'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {error && (
              <div className={`p-5 rounded-2xl border flex flex-col gap-2 animate-shake ${isRlsError ? 'bg-sky-50 border-sky-200 text-sky-900' : 'bg-red-50 border-red-100 text-red-600'}`}>
                <div className="flex items-center gap-3">
                  <i className={`fa-solid ${isRlsError ? 'fa-database' : 'fa-circle-exclamation'} text-sm`}></i>
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {isRlsError ? 'Database Setup Required' : 'Authentication Error'}
                  </span>
                </div>
                <p className="text-[11px] font-bold leading-relaxed">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-sky-400 uppercase tracking-widest mb-3 px-1">Username / ID</label>
              <div className="relative group">
                <i className="fa-solid fa-user absolute left-5 top-1/2 -translate-y-1/2 text-sky-200 group-focus-within:text-sky-600 transition-colors"></i>
                <input 
                  type="text" 
                  required
                  className="w-full pl-12 pr-6 py-4 bg-sky-50/50 rounded-2xl border border-sky-50 focus:ring-2 focus:ring-sky-500 outline-none text-sm font-bold text-sky-900 transition-all"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-sky-400 uppercase tracking-widest mb-3 px-1">Security Key</label>
              <div className="relative group">
                <i className="fa-solid fa-key absolute left-5 top-1/2 -translate-y-1/2 text-sky-200 group-focus-within:text-sky-600 transition-colors"></i>
                <input 
                  type="password" 
                  required
                  className="w-full pl-12 pr-6 py-4 bg-sky-50/50 rounded-2xl border border-sky-50 focus:ring-2 focus:ring-sky-500 outline-none text-sm font-bold text-sky-900 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-sky-900/10 active:scale-95 flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest disabled:opacity-50"
            >
              {isLoading ? 'Authenticating...' : (isSignup ? 'Create Account' : 'Authenticate')}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-sky-50 text-center">
            <button 
              onClick={() => { setIsSignup(!isSignup); setError(''); }}
              className="text-[10px] font-black text-sky-400 uppercase tracking-widest hover:text-sky-600 transition-colors"
            >
              {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Create One"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
