import { create } from 'zustand';

interface MattersMfeState {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (state: boolean) => void;
}

const mattersMfeStore = create<MattersMfeState>()((set) => ({
  isSidebarOpen: false,
  setIsSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
}));

export default mattersMfeStore;
