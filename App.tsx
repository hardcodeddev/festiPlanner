
import React, { useState, useEffect } from 'react';
import { User, Camp, LocalState } from './types';
import { getStore, saveStore, generateId } from './storage';
import supabaseApi from './supabaseApi';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CampView from './components/CampView';
import { FiLogOut, FiPlus, FiTrash2 } from 'react-icons/fi';
import { clearStore } from './storage';

const App: React.FC = () => {
  const [state, setState] = useState<LocalState>(getStore());
  const [activeCampId, setActiveCampId] = useState<string | null>(null);

  useEffect(() => {
    saveStore(state);
  }, [state]);

  const handleLogin = (user: User) => {
    // Persist profile and load remote data
    (async () => {
      try {
        await supabaseApi.upsertProfile(user);
        const remoteCamps = await supabaseApi.fetchCampsForUser(user.id);
        const profiles = await supabaseApi.fetchProfiles();
        setState(prev => ({
          ...prev,
          currentUser: user,
          // Replace users with remote profiles (avoid keeping stale local users)
          users: (profiles || []).map((p: any) => ({ id: p.id, name: p.full_name, email: p.email })),
          // Always replace camps with remote results (even if empty) to avoid stale local camps
          camps: Array.isArray(remoteCamps) ? remoteCamps : [],
        }));
      } catch (err) {
        // Fallback to local-only behavior
        setState(prev => ({ 
          ...prev, 
          currentUser: user, 
          users: [...prev.users.filter(u => u.id !== user.id), user] 
        }));
      }
    })();
  };

  const handleLogout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
    setActiveCampId(null);
  };

  const createCamp = (name: string, festival: string, date: string) => {
    if (!state.currentUser) return;
    const newCamp: Camp = {
      id: generateId(),
      name,
      festivalName: festival,
      date,
      dimensions: { width: 30, height: 30 }, // Default 30ft x 30ft
      members: [state.currentUser.id],
      objects: [],
      sharedPackingList: [
        { id: generateId(), name: 'Main Canopy', quantity: 1, isPrivate: false, category: 'Logistics' },
        { id: generateId(), name: 'Large Cooler', quantity: 2, isPrivate: false, category: 'Kitchen' },
        { id: generateId(), name: 'First Aid Kit', quantity: 1, isPrivate: false, category: 'General' }
      ]
    };
    setState(prev => ({ ...prev, camps: [...prev.camps, newCamp] }));
    // Persist to Supabase (fire and forget)
    supabaseApi.createCamp(newCamp).catch(() => {/* ignore for now */});
  };

  if (!state.currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const activeCamp = state.camps.find(c => c.id === activeCampId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Header */}
      <header className="bg-emerald-800 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            className="flex items-center space-x-2 cursor-pointer group"
            onClick={() => setActiveCampId(null)}
          >
            <span className="festival-font text-3xl tracking-wider group-hover:text-emerald-200 transition-colors">FESTIVAL</span>
          </div>
          
          <div className="flex items-center space-x-5">
            <div className="flex items-center space-x-3 pr-4 border-r border-emerald-700/50">
              <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs uppercase">
                {state.currentUser.name.charAt(0)}
              </div>
              <span className="hidden sm:inline-block font-bold text-sm">{state.currentUser.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  if (confirm('Clear local cache? This will remove local-only data and reload the app.')) {
                    clearStore();
                    location.reload();
                  }
                }}
                className="p-2 hover:bg-emerald-700 rounded-xl transition-all text-emerald-200 hover:text-white"
                title="Clear Local Cache"
              >
                <FiTrash2 size={18} />
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 hover:bg-emerald-700 rounded-xl transition-all text-emerald-200 hover:text-white"
                title="Logout"
              >
                <FiLogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        {!activeCampId ? (
          <Dashboard 
              camps={state.camps.filter(c => c.members.includes(state.currentUser!.id))}
              onCreateCamp={createCamp}
              onSelectCamp={setActiveCampId}
              currentUserId={state.currentUser!.id}
            />
        ) : activeCamp ? (
          <CampView 
            camp={activeCamp} 
            user={state.currentUser}
            allUsers={state.users}
            onUpdateCamp={(updatedCamp) => {
              setState(prev => ({
                ...prev,
                camps: prev.camps.map(c => c.id === updatedCamp.id ? updatedCamp : c)
              }));
              // persist update
              supabaseApi.updateCamp(updatedCamp).catch(() => {});
            }}
            personalItems={state.personalLists[state.currentUser.id]?.[activeCamp.id] || []}
            onUpdatePersonalItems={(items) => {
              setState(prev => ({
                ...prev,
                personalLists: {
                  ...prev.personalLists,
                  [state.currentUser!.id]: {
                    ...(prev.personalLists[state.currentUser!.id] || {}),
                    [activeCamp.id]: items
                  }
                }
              }));
            }}
            onBack={() => setActiveCampId(null)}
          />
        ) : (
          <div className="text-center py-24">
            <p className="text-slate-400 font-medium">This camp could not be found.</p>
            <button onClick={() => setActiveCampId(null)} className="text-emerald-600 font-bold mt-6 hover:underline">Return to Dashboard</button>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-100 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-300">© 2024 Festival Camp Planner • Premium Edition</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
