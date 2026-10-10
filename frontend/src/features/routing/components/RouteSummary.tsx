import { Alert, Box, Paper, Stack, Typography } from '@mui/material';
import StraightenIcon from '@mui/icons-material/Straighten';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PlaceIcon from '@mui/icons-material/Place';
import type { RouteResult } from '../../../api/routePlans';
import { formatDistance, formatDuration } from '../routeUtils';

interface RouteSummaryProps {
  route: RouteResult | null;
  stopCount: number;
  calculating: boolean;
  error: string | null;
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flex: 1, minWidth: 0 }}>
      <Box sx={{ color: 'primary.main', display: 'flex' }} aria-hidden>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" component="div">
          {label}
        </Typography>
        <Typography sx={{ fontWeight: 700 }}>{value}</Typography>
      </Box>
    </Stack>
  );
}

export function RouteSummary({ route, stopCount, calculating, error }: RouteSummaryProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      {/* Hesaplama sonucu değiştiğinde ekran okuyucu yeni değerleri okur. */}
      <Stack direction="row" spacing={2} aria-live="polite" aria-busy={calculating}>
        <Metric icon={<StraightenIcon />} label="Toplam mesafe" value={calculating ? '…' : formatDistance(route?.distanceM ?? null)} />
        <Metric icon={<ScheduleIcon />} label="Tahmini süre" value={calculating ? '…' : formatDuration(route?.durationS ?? null)} />
        <Metric icon={<PlaceIcon />} label="Durak" value={String(stopCount)} />
      </Stack>

      {error ? (
        <Alert severity="error" sx={{ mt: 2 }} role="alert">
          {error}
        </Alert>
      ) : (
        !route &&
        !calculating && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Rota henüz hesaplanmadı. Durakları girdikten sonra “Rotayı hesapla”ya basın.
          </Alert>
        )
      )}
    </Paper>
  );
}
