
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface PackingItem {
  id: string;
  name: string;
  quantity: number;
  claimedBy?: string; // User ID
  isPrivate: boolean;
  category: string;
}

export interface CampObject {
  id: string;
  type: 'tent' | 'canopy' | 'car' | 'table' | 'custom' | 'cooler' | 'chair' | 'flagpole' | 'wagon' | 'speaker';
  name: string;
  ownerId?: string;
  x: number; // in feet
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface Camp {
  id: string;
  name: string;
  festivalName: string;
  date: string;
  dimensions: { width: number; height: number }; // in feet
  members: string[]; // User IDs
  objects: CampObject[];
  sharedPackingList: PackingItem[];
  imageUrl?: string;
}

export interface LocalState {
  currentUser: User | null;
  camps: Camp[];
  personalLists: Record<string, Record<string, PackingItem[]>>; // userId -> campId -> items
  users: User[];
}
