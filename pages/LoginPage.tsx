
import React, { useState } from 'react';
import { UserRole } from '../types';

interface LoginPageProps {
  onLogin: (username: string, role: UserRole) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      onLogin('Admin User', UserRole.ADMIN);
    } else if (username === 'user' && password === 'user') {
      onLogin('John Doe', UserRole.USER);
    } else {
      setError('Invalid credentials. Use admin/admin or user/user.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-10 border border-gray-100">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-hotel text-3xl text-amber-600"></i>
          </div>
          <h1 className="text-3xl font-bold font-serif text-slate-900">Welcome Back</h1>
          <p className="text-slate-500 mt-2">Sign in to manage your villa preferences</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Username</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 outline-none"
              placeholder="e.g. admin or user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 outline-none"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}

          <button 
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg"
          >
            Sign In
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-100 text-center text-sm text-slate-400">
          <p>Demo accounts:</p>
          <p className="mt-1">Admin: <span className="text-slate-900 font-bold">admin / admin</span></p>
          <p>User: <span className="text-slate-900 font-bold">user / user</span></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
