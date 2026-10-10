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
    <Box sx={{ flex: 1, minWidth: 0, p: { xs: 1, sm: 1.5 }, borderRadius: 2.5, bgcolor: 'action.hover' }}>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: 'primary.main', mb: 0.5 }}>
        <Box aria-hidden sx={{ display: 'flex', '& svg': { fontSize: 18 } }}>
          {icon}
        </Box>
        <Typography variant="caption" color="text.secondary" noWrap>
          {label}
        </Typography>
      </Stack>
      <Typography sx={{ fontWeight: 800, fontSize: { xs: 18, sm: 22 }, letterSpacing: '-0.02em' }} noWrap>
        {value}
      </Typography>
    </Box>
  );
}

export function RouteSummary({ route, stopCount, calculating, error }: RouteSummaryProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      {/* Hesaplama sonucu değiştiğinde ekran okuyucu yeni değerleri okur. */}
      <Stack direction="row" spacing={1} aria-live="polite" aria-busy={calculating}>
        <Metric icon={<StraightenIcon />} label="Mesafe" value={calculating ? '…' : formatDistance(route?.distanceM ?? null)} />
        <Metric icon={<ScheduleIcon />} label="Süre" value={calculating ? '…' : formatDuration(route?.durationS ?? null)} />
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
