
import React, { useState } from 'react';
import { PackingItem, User } from '../types';
import { generateId } from '../storage';
import { FiCheck, FiTrash2, FiPlus, FiSquare, FiCheckSquare, FiUser, FiMoreVertical } from 'react-icons/fi';

interface PackingListProps {
  title: string;
  subtitle: string;
  items: PackingItem[];
  currentUser: User;
  onUpdateItems: (items: PackingItem[]) => void;
  isShared: boolean;
}

const PackingList: React.FC<PackingListProps> = ({ 
  title, subtitle, items = [], currentUser, onUpdateItems, isShared 
}) => {
  const [newItemName, setNewItemName] = useState('');
  const [category, setCategory] = useState('General');

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const newItem: PackingItem = {
      id: generateId(),
      name: newItemName,
      quantity: 1,
      isPrivate: !isShared,
      category,
      claimedBy: undefined
    };
    onUpdateItems([...items, newItem]);
    setNewItemName('');
  };

  const removeItem = (id: string) => {
    onUpdateItems(items.filter(i => i.id !== id));
  };

  const toggleClaim = (id: string) => {
    onUpdateItems(items.map(i => {
      if (i.id === id) {
        return { ...i, claimedBy: i.claimedBy === currentUser.id ? undefined : currentUser.id };
      }
      return i;
    }));
  };

  const categories = ['General', 'Kitchen', 'Sleep', 'Decor', 'Logistics'];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold">
          {items.length} items
        </div>
      </div>

      <div className="p-6">
        <form onSubmit={addItem} className="flex flex-col sm:flex-row gap-2 mb-6">
          <input 
            type="text" 
            placeholder="Add something..." 
            className="flex-1 px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            value={newItemName}
            onChange={e => setNewItemName(e.target.value)}
          />
          <select 
            className="px-4 py-2 border rounded-xl bg-white text-slate-700 outline-none"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button 
            type="submit"
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center"
          >
            <FiPlus className="mr-1" /> Add
          </button>
        </form>

        <div className="space-y-2">
          {items.length === 0 ? (
            <p className="text-center py-8 text-slate-400 italic">No items yet</p>
          ) : (
            items.map(item => (
              <div 
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${item.claimedBy ? 'bg-indigo-50/30 border-indigo-100' : 'bg-white border-slate-100'}`}
              >
                <div className="flex items-center space-x-3 flex-1">
                  {isShared && (
                    <button 
                      onClick={() => toggleClaim(item.id)}
                      className={`transition-colors ${item.claimedBy === currentUser.id ? 'text-indigo-600' : 'text-slate-300 hover:text-indigo-400'}`}
                    >
                      {item.claimedBy === currentUser.id ? <FiCheckSquare size={20} /> : <FiSquare size={20} />}
                    </button>
                  )}
                  <div>
                    <p className={`font-semibold ${item.claimedBy ? 'text-indigo-900 line-through opacity-60' : 'text-slate-800'}`}>
                      {item.name}
                    </p>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      {item.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {isShared && (
                    <div className="flex items-center space-x-1">
                      {item.claimedBy ? (
                        <div className="flex items-center text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                          <FiUser className="mr-1" /> {item.claimedBy === currentUser.id ? 'You' : 'Claimed'}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unclaimed</span>
                      )}
                    </div>
                  )}
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PackingList;
