
import React, { useState, useEffect } from 'react';
import { User, Lead, Villa } from '../types';
import { subscribeToLeads } from '../services/leadService';

interface UserDashboardProps {
  user: User;
  villas: Villa[];
  onViewVilla: (id: string) => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, villas, onViewVilla }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToLeads(data => {
      setLeads(data);
      setLoading(false);
    }, user.id);
    return () => unsubscribe();
  }, [user.id]);

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'booked': return 'bg-emerald-500 text-white';
      case 'contacted': return 'bg-amber-500 text-white';
      case 'lost': return 'bg-gray-400 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  const getVillaThumbnail = (villaId: string) => {
    const villa = villas.find(v => v.id === villaId);
    return villa?.imageUrls[0] || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=400';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <span className="text-amber-600 font-black uppercase tracking-[0.4em] text-[10px] mb-2 block">Guest Sanctuary</span>
          <h1 className="text-4xl md:text-5xl font-bold font-serif text-slate-900">Welcome, {user.username}</h1>
          <p className="text-slate-500 mt-2 font-medium">Manage your elite retreats and inquiry history.</p>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-100 flex gap-10">
           <div className="text-center">
             <p className="text-2xl font-bold font-serif text-slate-900">{leads.length}</p>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Inquiries</p>
           </div>
           <div className="text-center">
             <p className="text-2xl font-bold font-serif text-emerald-600">{leads.filter(l => l.status === 'booked').length}</p>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Confirmed</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Bookings Feed */}
        <div className="lg:col-span-2 space-y-8">
          <h2 className="text-2xl font-bold font-serif text-slate-900 flex items-center gap-3">
            <i className="fa-solid fa-clock-rotate-left text-amber-500 text-xl"></i>
            Stay History
          </h2>

          {loading ? (
            <div className="py-20 text-center animate-pulse text-slate-400 text-sm font-black uppercase tracking-widest">Syncing Records...</div>
          ) : leads.length > 0 ? (
            <div className="space-y-4">
              {leads.map(lead => (
                <div key={lead.id} className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8 group hover:shadow-2xl transition-all duration-500">
                  <div className="w-32 h-32 rounded-[2rem] overflow-hidden shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                    <img src={getVillaThumbnail(lead.villaId)} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="flex-grow text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                       <h3 className="text-xl font-bold font-serif text-slate-900">{lead.villaName}</h3>
                       <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusColor(lead.status)}`}>
                         {lead.status === 'new' ? 'Awaiting Contact' : lead.status}
                       </span>
                    </div>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       <span><i className="fa-solid fa-calendar mr-2 text-amber-500"></i>{lead.checkIn || 'TBD'} - {lead.checkOut || 'TBD'}</span>
                       <span><i className="fa-solid fa-paper-plane mr-2 text-amber-500"></i>Requested {new Date(lead.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => onViewVilla(lead.villaId)}
                    className="px-6 py-3 bg-gray-50 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                  >
                    View Villa
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[3rem] border-2 border-dashed border-gray-100 p-20 text-center">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                  <i className="fa-solid fa-bed text-3xl"></i>
               </div>
               <h3 className="text-xl font-bold font-serif text-slate-900 mb-2">No active inquiries</h3>
               <p className="text-slate-400 text-sm mb-8">Start exploring our hand-picked sanctuaries to begin your journey.</p>
               <button className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all shadow-xl">Explore Collection</button>
            </div>
          )}
        </div>

        {/* Account Sidebar */}
        <div className="space-y-8">
           <h2 className="text-2xl font-bold font-serif text-slate-900">Account Details</h2>
           <div className="bg-slate-900 text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <div className="relative z-10 space-y-6">
                 <div className="w-20 h-20 bg-amber-500 rounded-3xl flex items-center justify-center text-slate-900 text-2xl font-black mb-8 shadow-xl">
                   {user.username.charAt(0).toUpperCase()}
                 </div>
                 <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Full Name</label>
                    <p className="text-lg font-bold font-serif">{user.username}</p>
                 </div>
                 <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Electronic Mail</label>
                    <p className="text-sm font-medium opacity-80">{user.email || 'No email provided'}</p>
                 </div>
                 <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Membership Tier</label>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                       <i className="fa-solid fa-crown"></i>
                       Elite Guest
                    </div>
                 </div>
                 <button className="w-full py-4 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-all mt-6">
                    Update Profile
                 </button>
              </div>
           </div>

           {/* Quick Support */}
           <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100">
              <h3 className="font-bold text-slate-900 mb-2">Priority Support</h3>
              <p className="text-xs text-slate-600 mb-6 leading-relaxed">Need help with your current inquiries? Our concierge is on standby.</p>
              <a href="https://wa.me/+919157928471" className="flex items-center justify-center gap-3 w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                <i className="fa-brands fa-whatsapp text-lg"></i>
                Concierge Chat
              </a>
           </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
