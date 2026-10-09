import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../../api/client';
import { useVehicleStore } from '../store/useVehicleStore';

type Status = 'loading' | 'success' | 'error';

// Detay ve düzenleme sayfaları için tek araç. Araç store'da varsa hemen gösterilir,
// arka planda sunucudan güncel hali çekilip store'a yazılır (başka sekmede değişmiş olabilir).
// Kullanan bileşen key={id} ile çizilir; id değişince durum sıfırdan başlar.
export function useVehicle(id: string) {
  const vehicle = useVehicleStore((s) => s.vehicles.find((v) => v.id === id));
  const fetchVehicle = useVehicleStore((s) => s.fetchVehicle);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<ApiError | null>(null);

  const load = useCallback(
    () =>
      fetchVehicle(id).then(
        () => setStatus('success'),
        (err: unknown) => {
          setError(err instanceof ApiError ? err : new ApiError(0, 'UNKNOWN', 'Araç yüklenemedi.'));
          setStatus('error');
        },
      ),
    [fetchVehicle, id],
  );

  useEffect(() => {
    load();
  }, [load]);

  const retry = () => {
    setStatus('loading');
    setError(null);
    load();
  };

  return { vehicle, status, error, retry, notFound: error?.status === 404 };
}
