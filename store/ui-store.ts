"use client";

import { create } from "zustand";

interface UIState {
  commandOpen: boolean;
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  commandOpen: false,
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setMobileSidebarOpen: (mobileSidebarOpen) => set({ mobileSidebarOpen }),
}));
