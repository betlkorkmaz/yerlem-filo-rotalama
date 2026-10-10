import { Link } from 'react-router';
import { Box, Card, CardActionArea, CardContent, Chip, Stack, Typography } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { RoutePlanSummary } from '../../../api/routePlans';
import { formatDateTime, formatPlate } from '../../fleet/vehicleUtils';
import { formatDistance, formatDuration } from '../routeUtils';

export function RoutePlanCardList({ plans }: { plans: RoutePlanSummary[] }) {
  return (
    <Box
      component="ul"
      aria-label="Rota planları"
      sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}
    >
      {plans.map((plan) => (
        <li key={plan.id}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardActionArea component={Link} to={`/routes/${plan.id}`} sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography sx={{ fontWeight: 700 }}>{plan.name}</Typography>
                  <Chip size="small" label="Taslak" variant="outlined" />
                </Stack>

                {/* Araç bilgisi plandan değil, araç kaydından (ilişkiden) gelir; pasifse açıkça belirtilir. */}
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
                  <Typography color="text.secondary">
                    {formatPlate(plan.vehicle.plate)} · {plan.vehicle.name}
                  </Typography>
                  {!plan.vehicle.isActive && (
                    <Chip size="small" color="warning" icon={<WarningAmberIcon />} label="Araç pasif" />
                  )}
                </Stack>

                <Typography variant="body2">
                  {plan.stopCount} durak ·{' '}
                  {plan.distanceM == null
                    ? 'Rota hesaplanmadı'
                    : `${formatDistance(plan.distanceM)} · ${formatDuration(plan.durationS)}`}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Güncellendi: {formatDateTime(plan.updatedAt)}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </li>
      ))}
    </Box>
  );
}
