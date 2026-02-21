import { create } from 'zustand';

type ConnectionStatus = 'idle' | 'loading' | 'connected' | 'error';

interface AppState {
    backendStatus: ConnectionStatus;
    backendMessage: string;
    setBackendStatus: (status: ConnectionStatus, message?: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
    backendStatus: 'idle',
    backendMessage: '',
    setBackendStatus: (status, message = '') =>
        set({ backendStatus: status, backendMessage: message }),
}));
