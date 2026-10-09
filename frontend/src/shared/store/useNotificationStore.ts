import { create } from 'zustand';

type Severity = 'success' | 'info' | 'warning' | 'error';

interface NotificationState {
  open: boolean;
  message: string;
  severity: Severity;
  notify: (message: string, severity?: Severity) => void;
  close: () => void;
}

// Sadece arayüz durumu: "Araç kaydedildi" gibi kısa bildirimler.
// Sunucu verisi tutmadığı için domain store'larından ayrı duruyor.
export const useNotificationStore = create<NotificationState>((set) => ({
  open: false,
  message: '',
  severity: 'success',
  notify: (message, severity = 'success') => set({ open: true, message, severity }),
  close: () => set({ open: false }),
}));
