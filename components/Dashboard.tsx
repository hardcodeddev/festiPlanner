
import React, { useState, useEffect } from 'react';
import { Camp } from '../types';
import { FiCalendar, FiMapPin, FiUsers, FiPlus, FiClock } from 'react-icons/fi';
import supabaseApi from '../supabaseApi';

interface PendingInvite {
  id: number;
  email: string;
  token: string;
  created_at: string;
}

interface DashboardProps {
  camps: Camp[];
  onCreateCamp: (name: string, festival: string, date: string) => void;
  onSelectCamp: (id: string) => void;
  currentUserId?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ camps, onCreateCamp, onSelectCamp, currentUserId }) => {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [festival, setFestival] = useState('');
  const [date, setDate] = useState('');
  const [pending, setPending] = useState<PendingInvite[]>([]);
  const [resendLoading, setResendLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUserId) return;
    let mounted = true;
    (async () => {
      try {
        const invites = await supabaseApi.fetchPendingInvitationsForInviter(currentUserId);
        if (!mounted) return;
        setPending(invites || []);
      } catch (e) {
        console.warn('Failed to load pending invites', e);
      }
    })();
    return () => { mounted = false; };
  }, [currentUserId]);

  const getDaysLeft = (targetDate: string) => {
    const diff = new Date(targetDate).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Your Camps</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 text-white px-6 py-2 rounded-xl flex items-center space-x-2 hover:bg-emerald-700 transition-colors shadow-md"
        >
          <FiPlus /> <span>New Camp</span>
        </button>
      </div>

      {camps.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
          <div className="max-w-xs mx-auto">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiMapPin size={40} />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No camps yet</h3>
            <p className="text-slate-500 mb-6">Create your first camp to start planning your music festival layout and packing list.</p>
            <button 
              onClick={() => setShowModal(true)}
              className="text-emerald-600 font-bold hover:underline"
            >
              Start Planning →
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {camps.map(camp => (
            <div 
              key={camp.id}
              onClick={() => onSelectCamp(camp.id)}
              className="bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between overflow-hidden"
            >
              {/* Camp Image */}
              {camp.imageUrl ? (
                <div className="w-full h-40 overflow-hidden">
                  <img 
                    src={camp.imageUrl} 
                    alt={camp.name}
                    className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center group-hover:from-emerald-200 group-hover:to-emerald-100 transition-colors">
                  <FiMapPin size={40} className="text-emerald-400" />
                </div>
              )}
              
              {/* Camp Info */}
              <div className="p-6 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-emerald-100 text-emerald-600 p-3 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <FiCalendar size={24} />
                    </div>
                    <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center">
                      <FiClock className="mr-1" /> {getDaysLeft(camp.date)} Days Left
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{camp.name}</h3>
                  <p className="text-slate-500 font-medium mb-4">{camp.festivalName}</p>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex -space-x-2">
                    {camp.members.map((_, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                        U{i+1}
                      </div>
                    ))}
                    {camp.members.length > 5 && (
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                        +{camp.members.length - 5}
                      </div>
                    )}
                  </div>
                  <div className="text-slate-400 text-sm flex items-center">
                    <FiUsers className="mr-1" /> {camp.members.length} members
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pending.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold mb-3">Pending Invites</h3>
          <div className="space-y-2">
            {pending.map(inv => (
              <div key={inv.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100">
                <div>
                  <div className="text-sm font-semibold">{inv.email}</div>
                  <div className="text-xs text-slate-400">Sent {new Date(inv.created_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={async () => {
                      setResendLoading(inv.id);
                      try {
                        const res: any = await supabaseApi.resendInvitation(inv.id);
                        if (res.emailSent) {
                          setToast('Invite resent successfully');
                        } else {
                          setToast(res.emailError || 'Invite created; email not sent');
                        }
                      } catch (e: any) {
                        setToast('Failed to resend invite');
                      } finally {
                        setResendLoading(null);
                        setTimeout(() => setToast(null), 4500);
                      }
                    }}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-xl disabled:opacity-50"
                    disabled={resendLoading === inv.id}
                  >
                    {resendLoading === inv.id ? 'Resending...' : 'Resend'}
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const res: any = await supabaseApi.resendInvitation(inv.id);
                        await navigator.clipboard.writeText(res.link);
                        setToast('Invite link copied to clipboard');
                        setTimeout(() => setToast(null), 3500);
                      } catch (e) {
                        setToast('Failed to copy invite link');
                        setTimeout(() => setToast(null), 3500);
                      }
                    }}
                    className="px-3 py-2 border rounded-xl"
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            ))}
          </div>
          {toast && <div className="mt-3 text-sm text-slate-700">{toast}</div>}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold mb-6">Create New Camp</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Camp Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border rounded-xl" 
                  placeholder="The Shady Glade" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Festival Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border rounded-xl" 
                  placeholder="Coachella 2025" 
                  value={festival} 
                  onChange={e => setFestival(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Festival Date</label>
                <input 
                  type="date" 
                  className="w-full px-4 py-2 border rounded-xl" 
                  value={date} 
                  onChange={e => setDate(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-8 flex space-x-3">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 px-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  onCreateCamp(name, festival, date);
                  setShowModal(false);
                  setName(''); setFestival(''); setDate('');
                }}
                className="flex-1 py-3 px-4 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700"
              >
                Create Camp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
