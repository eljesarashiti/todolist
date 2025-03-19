import { create } from 'zustand';

type Task = {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  priority: string | "Low" | "Medium" | "High" | null ;
  dueDate?: string | null;
  category?: string | null;
};


type Store = {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  isAuthenticated: boolean;
  login: (user: { id: number; username: string }) => void;
  logout: () => void;
};

export const useStore = create<Store>((set) => ({
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  isAuthenticated: false,
  login: () => set({ isAuthenticated: true }),
  logout: () => set({ isAuthenticated: false, tasks: [] }),
}));