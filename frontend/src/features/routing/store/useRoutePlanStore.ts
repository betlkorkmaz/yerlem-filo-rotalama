import { create } from 'zustand';
import * as routePlansApi from '../../../api/routePlans';
import type { RoutePlanSummary } from '../../../api/routePlans';
import { ApiError } from '../../../api/client';

type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

interface RoutePlanState {
  // Kayıtlı planların özet listesi (sunucu verisi). Düzenlenen taslak burada değil,
  // useRouteEditorStore'da tutulur.
  plans: RoutePlanSummary[];
  status: LoadStatus;
  error: ApiError | null;
  fetchPlans: () => Promise<void>;
}

let latestRequest = 0;

export const useRoutePlanStore = create<RoutePlanState>((set) => ({
  plans: [],
  status: 'idle',
  error: null,

  fetchPlans: async () => {
    const requestId = ++latestRequest;
    set({ status: 'loading', error: null });
    try {
      const plans = await routePlansApi.listRoutePlans();
      if (requestId === latestRequest) set({ plans, status: 'success' });
    } catch (err) {
      if (requestId === latestRequest) {
        set({
          status: 'error',
          error: err instanceof ApiError ? err : new ApiError(0, 'UNKNOWN', 'Planlar yüklenemedi.'),
        });
      }
    }
  },
}));
