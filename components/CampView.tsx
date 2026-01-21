
import React, { useState, useRef } from 'react';
import { Camp, User, PackingItem, CampObject } from '../types';
import PackingList from './PackingList';
import LayoutPlanner from './LayoutPlanner';
import supabaseApi from '../supabaseApi';
import { FiArrowLeft, FiGrid, FiList, FiSettings, FiUser, FiInfo, FiPlus, FiCamera, FiUpload } from 'react-icons/fi';

interface CampViewProps {
  camp: Camp;
  user: User;
  allUsers: User[];
  onUpdateCamp: (camp: Camp) => void;
  personalItems: PackingItem[];
  onUpdatePersonalItems: (items: PackingItem[]) => void;
  onBack: () => void;
}

const CampView: React.FC<CampViewProps> = ({ 
  camp, user, allUsers, onUpdateCamp, personalItems, onUpdatePersonalItems, onBack 
}) => {
  const [activeTab, setActiveTab] = useState<'layout' | 'packing' | 'settings'>('packing');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateSharedPackingList = (items: PackingItem[]) => {
    onUpdateCamp({ ...camp, sharedPackingList: items });
  };

  const updateLayout = (objects: CampObject[]) => {
    onUpdateCamp({ ...camp, objects });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateCamp({ ...camp, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const inviteUser = async (email: string) => {
    const cleaned = (email || '').trim().toLowerCase();
    if (!cleaned) return;
    const found = allUsers.find(u => u.email.toLowerCase() === cleaned);
    if (found && !camp.members.includes(found.id)) {
      onUpdateCamp({ ...camp, members: [...camp.members, found.id] });
      // Also notify the user by creating an invitation record and attempting to send an email
      try {
        const inviteResult: any = await supabaseApi.createInvitation(user.id, cleaned, camp.id);
        if (inviteResult?.emailSent) {
          setToast({ message: `Added ${found.name} and sent email notification.`, type: 'success' });
        } else if (inviteResult?.emailError) {
          setToast({ message: `Added ${found.name} but failed to send email: ${inviteResult.emailError}`, type: 'info' });
        } else {
          setToast({ message: `Added ${found.name} to the camp.`, type: 'success' });
        }
      } catch (e: any) {
        console.warn('Failed to create/send notification invite for existing user', e);
        setToast({ message: `Added ${found.name} but failed to send notification.`, type: 'info' });
      }
      setTimeout(() => setToast(null), 4500);
      return;
    } else if (found) {
      setToast({ message: 'User is already in the camp.', type: 'info' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    // Not found locally — create an invitation row and attempt to send an email
    try {
      const invite: any = await supabaseApi.createInvitation(user.id, cleaned, camp.id);
      const link = invite?.link;
      const emailSent = invite?.emailSent === true;
      const emailError = invite?.emailError as string | undefined | null;

      if (link) {
        try {
          await navigator.clipboard.writeText(link);
        } catch (e) {
          // ignore clipboard failures
        }
      }

      if (emailSent) {
        setToast({ message: 'Invite created and email sent successfully.', type: 'success' });
        setTimeout(() => setToast(null), 4000);
      } else if (emailError) {
        // Invitation created but email failed
        setToast({ message: `Invite created but failed to send email: ${emailError}`, type: 'error' });
        setTimeout(() => setToast(null), 7000);
      } else {
        // No email attempted (EmailJS not configured) — show success with link copy note
        setToast({ message: 'Invite created. Share the invite link with the recipient.', type: 'success' });
        setTimeout(() => setToast(null), 4000);
      }
    } catch (err: any) {
      console.error('Invite error', err);
      setToast({ message: 'Failed to create invitation. Please try again.', type: 'error' });
      setTimeout(() => setToast(null), 5000);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {toast && (
        <div className="fixed top-6 right-6 z-50">
          <div className={`px-4 py-3 rounded-lg shadow-md text-sm ${toast.type === 'success' ? 'bg-emerald-600 text-white' : toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'}`}>
            {toast.message}
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <button onClick={onBack} className="text-slate-500 hover:text-emerald-600 flex items-center transition-colors">
          <FiArrowLeft className="mr-2" /> Back to Dashboard
        </button>
        <div className="flex space-x-1 bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
          <button 
            onClick={() => setActiveTab('packing')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center space-x-2 ${activeTab === 'packing' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <FiList /> <span>Packing</span>
          </button>
          <button 
            onClick={() => setActiveTab('layout')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center space-x-2 ${activeTab === 'layout' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <FiGrid /> <span>Layout</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center space-x-2 ${activeTab === 'settings' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <FiSettings /> <span>Settings</span>
          </button>
        </div>
      </div>

      <div className="flex-1">
        {activeTab === 'packing' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <PackingList 
                title="Shared Camp Items"
                subtitle="Group resources in feet of storage!"
                items={camp.sharedPackingList}
                currentUser={user}
                onUpdateItems={updateSharedPackingList}
                isShared={true}
              />
              <PackingList 
                title="Personal Gear"
                subtitle="Your private inventory."
                items={personalItems}
                currentUser={user}
                onUpdateItems={onUpdatePersonalItems}
                isShared={false}
              />
            </div>
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <FiInfo className="mr-2 text-emerald-500" /> Camp Info
                </h4>
                
                {camp.imageUrl ? (
                  <div className="mb-4 relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <img src={camp.imageUrl} alt="Camp" className="w-full h-40 object-cover rounded-2xl shadow-inner border border-slate-100" />
                    <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                      <FiUpload className="mr-1" /> Change Picture
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="mb-4 w-full h-32 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-emerald-300 hover:bg-emerald-50 transition-all"
                  >
                    <FiCamera size={24} className="mb-1" />
                    <span className="text-xs font-bold">Add Camp Photo</span>
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Festival</span>
                    <span className="font-semibold text-slate-800">{camp.festivalName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Date</span>
                    <span className="font-semibold text-slate-800">{new Date(camp.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Dimensions</span>
                    <span className="font-semibold text-slate-800">{camp.dimensions.width}ft x {camp.dimensions.height}ft</span>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-900 text-white p-6 rounded-3xl shadow-sm">
                <h4 className="font-bold text-emerald-200 mb-2 flex items-center">
                  <FiGrid className="mr-2" /> Pro Tip
                </h4>
                <p className="text-sm leading-relaxed opacity-90">
                  Planning in feet makes it easier to match your tent's 
                  specs. A standard 4-person tent is usually 8x9 ft. 
                  Leave 2ft between tents for guy lines!
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'layout' && (
          <LayoutPlanner 
            camp={camp} 
            user={user} 
            allUsers={allUsers.filter(u => camp.members.includes(u.id))}
            onUpdateObjects={updateLayout}
            onUpdateDimensions={(dim) => onUpdateCamp({ ...camp, dimensions: dim })}
          />
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold mb-6">Manage Members</h3>
              <div className="space-y-4 mb-6">
                {camp.members.map(memberId => {
                  const m = allUsers.find(u => u.id === memberId);
                  return (
                    <div key={memberId} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center font-bold text-emerald-600">
                          {m?.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{m?.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{m?.email}</p>
                        </div>
                      </div>
                      {memberId === user.id && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">You</span>}
                    </div>
                  );
                })}
              </div>
              <div className="flex space-x-2">
                <input
                  type="email"
                  id="inviteEmail"
                  placeholder="Enter email to invite..."
                  disabled={inviteLoading}
                  className="flex-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={async () => {
                    const input = document.getElementById('inviteEmail') as HTMLInputElement;
                    if (!input) return;
                    setInviteLoading(true);
                    try {
                      await inviteUser(input.value);
                      input.value = '';
                    } finally {
                      setInviteLoading(false);
                    }
                  }}
                  disabled={inviteLoading}
                  className="bg-emerald-600 disabled:opacity-50 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                >
                  {inviteLoading ? 'Inviting...' : 'Invite'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampView;
