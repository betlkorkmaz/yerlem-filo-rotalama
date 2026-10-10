import { useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { List, ListItemButton, ListItemText, Paper, Skeleton, Typography } from '@mui/material';
import { useShallow } from 'zustand/react/shallow';
import { ErrorState } from '../../../shared/components/StateViews';
import { formatDateTime } from '../../fleet/vehicleUtils';
import { useRoutePlanStore } from '../store/useRoutePlanStore';
import { formatDistance } from '../routeUtils';

// Araç detayında, bu aracı kullanan planlar. Planlar ayrı bir istekle değil, rotalamanın
// ortak plan listesinden süzülerek gösterilir; pasif araçta da geçmiş planlar burada görünür.
export function VehicleRoutePlans({ vehicleId }: { vehicleId: string }) {
  const { plans, status, error, fetchPlans } = useRoutePlanStore(
    useShallow((s) => ({ plans: s.plans, status: s.status, error: s.error, fetchPlans: s.fetchPlans })),
  );

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const vehiclePlans = useMemo(() => plans.filter((p) => p.vehicle.id === vehicleId), [plans, vehicleId]);

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mt: 2 }}>
      <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
        Bu aracı kullanan rota planları
      </Typography>

      {status === 'error' && plans.length === 0 ? (
        <ErrorState message={error?.message ?? 'Planlar yüklenemedi.'} onRetry={fetchPlans} />
      ) : status !== 'success' && plans.length === 0 ? (
        <Skeleton variant="rounded" height={56} aria-label="Planlar yükleniyor" />
      ) : vehiclePlans.length === 0 ? (
        <Typography color="text.secondary">Bu araç henüz bir rota planında kullanılmadı.</Typography>
      ) : (
        <List disablePadding>
          {vehiclePlans.map((p) => (
            <ListItemButton key={p.id} component={Link} to={`/routes/${p.id}`} sx={{ borderRadius: 1 }}>
              <ListItemText
                primary={p.name}
                secondary={`${p.stopCount} durak · ${p.distanceM == null ? 'rota hesaplanmadı' : formatDistance(p.distanceM)} · ${formatDateTime(p.updatedAt)}`}
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </Paper>
  );
}
