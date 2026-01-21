
import React, { useState, useRef, useEffect } from 'react';
import { Camp, CampObject, User } from '../types';
import { generateId } from '../storage';
import { FiMove, FiPlus, FiTrash2, FiUser, FiMaximize, FiBox, FiMusic, FiWind, FiSun, FiMapPin, FiTruck } from 'react-icons/fi';
import { PiFlagFill, PiSpeakerHighFill, PiChairFill, PiSnowflakeFill } from "react-icons/pi";

interface LayoutPlannerProps {
  camp: Camp;
  user: User;
  allUsers: User[];
  onUpdateObjects: (objects: CampObject[]) => void;
  onUpdateDimensions: (dim: { width: number; height: number }) => void;
}

const LayoutPlanner: React.FC<LayoutPlannerProps> = ({ 
  camp, allUsers, onUpdateObjects, onUpdateDimensions 
}) => {
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Conversion factor: 1 foot = 15 pixels for better fit
  const SCALE = 15;

  const addObject = (type: CampObject['type']) => {
    const defaultSizes = {
      tent: { w: 8, h: 10, c: '#22c55e', label: 'Tent' },
      canopy: { w: 10, h: 10, c: '#3b82f6', label: 'Canopy' },
      car: { w: 6.5, h: 15, c: '#475569', label: 'Vehicle' },
      table: { w: 3, h: 6, c: '#d97706', label: 'Table' },
      cooler: { w: 3, h: 2, c: '#0ea5e9', label: 'Cooler' },
      chair: { w: 2, h: 2, c: '#f59e0b', label: 'Chair' },
      flagpole: { w: 1, h: 1, c: '#ef4444', label: 'Flag' },
      wagon: { w: 2, h: 4, c: '#b91c1c', label: 'Wagon' },
      speaker: { w: 1.5, h: 1.5, c: '#1e293b', label: 'Speaker' },
      custom: { w: 5, h: 5, c: '#ec4899', label: 'Decor' }
    };
    
    const config = defaultSizes[type];
    const newObj: CampObject = {
      id: generateId(),
      type,
      name: config.label,
      x: 2,
      y: 2,
      width: config.w,
      height: config.h,
      color: config.c,
      ownerId: undefined
    };
    onUpdateObjects([...camp.objects, newObj]);
    setSelectedObjectId(newObj.id);
  };

  const updateObject = (id: string, updates: Partial<CampObject>) => {
    onUpdateObjects(camp.objects.map(obj => obj.id === id ? { ...obj, ...updates } : obj));
  };

  const removeObject = (id: string) => {
    onUpdateObjects(camp.objects.filter(obj => obj.id !== id));
    setSelectedObjectId(null);
  };

  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragId || !gridRef.current) return;
    
    const rect = gridRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const relX = (clientX - rect.left) / SCALE;
    const relY = (clientY - rect.top) / SCALE;
    
    // Snap to 0.5 units (half foot)
    const snappedX = Math.max(0, Math.min(camp.dimensions.width - 0.5, Math.round(relX * 2) / 2));
    const snappedY = Math.max(0, Math.min(camp.dimensions.height - 0.5, Math.round(relY * 2) / 2));
    
    updateObject(dragId, { x: snappedX, y: snappedY });
  };

  const selectedObject = camp.objects.find(o => o.id === selectedObjectId);

  const getIcon = (type: CampObject['type']) => {
    switch(type) {
      case 'tent': return <FiSun size={12} />;
      case 'canopy': return <FiWind size={12} />;
      case 'car': return <FiTruck size={12} />;
      case 'speaker': return <PiSpeakerHighFill size={12} />;
      case 'cooler': return <PiSnowflakeFill size={12} />;
      case 'chair': return <PiChairFill size={12} />;
      case 'flagpole': return <PiFlagFill size={12} />;
      case 'wagon': return <FiBox size={12} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Sidebar Controls */}
      <div className="w-full lg:w-72 space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h4 className="font-bold mb-4 flex items-center text-slate-800">
            <FiMusic className="mr-2 text-emerald-600" /> Festival Gear
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {(['tent', 'canopy', 'car', 'table', 'cooler', 'chair', 'flagpole', 'wagon', 'speaker', 'custom'] as const).map(type => (
              <button 
                key={type}
                onClick={() => addObject(type)}
                className="flex flex-col items-center justify-center p-2 border border-slate-100 rounded-xl hover:bg-emerald-50 hover:border-emerald-100 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg mb-1 flex items-center justify-center bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <FiPlus size={14} />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-tight text-slate-500">{type}</span>
              </button>
            ))}
          </div>
        </div>

        {selectedObject && (
          <div className="bg-white p-6 rounded-3xl shadow-lg border-2 border-emerald-500 transform transition-all">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-slate-800">Edit {selectedObject.type}</h4>
              <button onClick={() => removeObject(selectedObject.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                <FiTrash2 />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Name / Camper</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-1 border rounded-lg text-sm"
                  value={selectedObject.name}
                  onChange={e => updateObject(selectedObject.id, { name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Width (ft)</label>
                  <input 
                    type="number" step="0.5"
                    className="w-full px-3 py-1 border rounded-lg text-sm"
                    value={selectedObject.width}
                    onChange={e => updateObject(selectedObject.id, { width: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Length (ft)</label>
                  <input 
                    type="number" step="0.5"
                    className="w-full px-3 py-1 border rounded-lg text-sm"
                    value={selectedObject.height}
                    onChange={e => updateObject(selectedObject.id, { height: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Assign to Member</label>
                <select 
                  className="w-full px-3 py-1 border rounded-lg text-sm bg-white"
                  value={selectedObject.ownerId || ''}
                  onChange={e => updateObject(selectedObject.id, { ownerId: e.target.value || undefined })}
                >
                  <option value="">Community Asset</option>
                  {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="flex flex-wrap gap-1">
                {['#22c55e', '#14532d', '#3b82f6', '#ef4444', '#f59e0b', '#ec4899', '#64748b', '#1e293b'].map(c => (
                  <button 
                    key={c}
                    className={`w-5 h-5 rounded-full border ${selectedObject.color === c ? 'ring-2 ring-emerald-500' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => updateObject(selectedObject.id, { color: c })}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="bg-emerald-900 text-white p-6 rounded-3xl shadow-sm">
          <h4 className="font-bold mb-4 flex items-center">
            <FiMaximize className="mr-2 text-emerald-300" /> Camp Dimensions (ft)
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold uppercase text-emerald-300 mb-1">Width</label>
              <input 
                type="number"
                className="w-full px-3 py-1 bg-emerald-800 border-none rounded-lg text-sm text-white focus:ring-1 focus:ring-emerald-400"
                value={camp.dimensions.width}
                onChange={e => onUpdateDimensions({ ...camp.dimensions, width: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-emerald-300 mb-1">Length</label>
              <input 
                type="number"
                className="w-full px-3 py-1 bg-emerald-800 border-none rounded-lg text-sm text-white focus:ring-1 focus:ring-emerald-400"
                value={camp.dimensions.height}
                onChange={e => onUpdateDimensions({ ...camp.dimensions, height: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <p className="text-[10px] text-emerald-400 mt-4 italic font-medium">Plan for space between tents for guy lines!</p>
        </div>
      </div>

      {/* Planner Canvas */}
      <div 
        className="flex-1 bg-emerald-50 rounded-3xl border-2 border-emerald-100 shadow-inner overflow-auto p-12 relative min-h-[600px] grid-bg select-none grass-pattern"
        onMouseMove={handleDrag}
        onMouseUp={() => setDragId(null)}
        onMouseLeave={() => setDragId(null)}
        onClick={() => setSelectedObjectId(null)}
      >
        <div 
          ref={gridRef}
          className="relative bg-emerald-100/30 border-2 border-emerald-800/20 shadow-xl mx-auto"
          style={{ 
            width: camp.dimensions.width * SCALE, 
            height: camp.dimensions.height * SCALE,
            transition: 'width 0.3s, height 0.3s',
            boxShadow: '0 0 40px rgba(20, 83, 45, 0.1)'
          }}
        >
          {/* Legend/Rulers */}
          <div className="absolute -top-8 left-0 flex text-[10px] text-emerald-800 font-bold w-full justify-between px-1 uppercase tracking-widest opacity-60">
             <span>0'</span>
             <span>{Math.floor(camp.dimensions.width/2)}'</span>
             <span>{camp.dimensions.width}'</span>
          </div>
          <div className="absolute top-0 -left-8 flex flex-col h-full justify-between text-[10px] text-emerald-800 font-bold py-1 uppercase tracking-widest opacity-60">
             <span>0'</span>
             <span>{Math.floor(camp.dimensions.height/2)}'</span>
             <span>{camp.dimensions.height}'</span>
          </div>

          {camp.objects.map(obj => {
            const owner = allUsers.find(u => u.id === obj.ownerId);
            return (
              <div 
                key={obj.id}
                className={`absolute cursor-grab active:cursor-grabbing flex flex-col items-center justify-center text-center p-1 rounded shadow-md border-2 transition-transform ${selectedObjectId === obj.id ? 'border-white z-10 scale-105 shadow-2xl ring-4 ring-emerald-500/20' : 'border-black/5'}`}
                style={{
                  left: obj.x * SCALE,
                  top: obj.y * SCALE,
                  width: obj.width * SCALE,
                  height: obj.height * SCALE,
                  backgroundColor: obj.color,
                  borderRadius: obj.type === 'flagpole' || obj.type === 'speaker' ? '9999px' : '4px',
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setSelectedObjectId(obj.id);
                  setDragId(obj.id);
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="truncate w-full font-black text-[8px] text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] leading-tight">{obj.name}</div>
                {owner && (
                  <div className="text-[7px] font-bold bg-white/30 text-white px-1 rounded-full mt-0.5 flex items-center uppercase">
                    {owner.name}
                  </div>
                )}
                <div className="mt-0.5 text-white opacity-60">
                  {getIcon(obj.type)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LayoutPlanner;
