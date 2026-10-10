import { Link } from 'react-router';
import { Box, Card, CardActionArea, CardContent, Chip, Divider, Stack, Typography } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PlaceIcon from '@mui/icons-material/PlaceOutlined';
import StraightenIcon from '@mui/icons-material/Straighten';
import ScheduleIcon from '@mui/icons-material/Schedule';
import type { RoutePlanSummary } from '../../../api/routePlans';
import { formatDateTime } from '../../fleet/vehicleUtils';
import { PlateBadge } from '../../fleet/components/PlateBadge';
import { formatDistance, formatDuration } from '../routeUtils';

function Metric({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary' }}>
      <Box aria-hidden sx={{ display: 'flex', '& svg': { fontSize: 18 } }}>
        {icon}
      </Box>
      <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
        {text}
      </Typography>
    </Stack>
  );
}

export function RoutePlanCardList({ plans }: { plans: RoutePlanSummary[] }) {
  return (
    <Box
      component="ul"
      aria-label="Rota planları"
      sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}
    >
      {plans.map((plan) => (
        <li key={plan.id}>
          <Card
            variant="outlined"
            sx={{
              height: '100%',
              // Sol kenardaki renkli şerit: aracı pasif olan planlar ilk bakışta ayrılsın.
              borderLeft: '4px solid',
              borderLeftColor: plan.vehicle.isActive ? 'primary.main' : 'warning.main',
              '&:hover': { transform: 'translateY(-2px)', borderColor: 'primary.main', boxShadow: '0 16px 32px -16px rgba(56,189,248,.35)' },
            }}
          >
            <CardActionArea component={Link} to={`/routes/${plan.id}`} sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 17 }}>{plan.name}</Typography>
                  <Chip size="small" label="Taslak" variant="outlined" color="primary" />
                </Stack>

                {/* Araç bilgisi plandan değil, araç kaydından (ilişkiden) gelir; pasifse açıkça belirtilir. */}
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2, flexWrap: 'wrap', rowGap: 1 }}>
                  <PlateBadge plate={plan.vehicle.plate} size="small" />
                  <Typography variant="body2" color="text.secondary">
                    {plan.vehicle.name}
                  </Typography>
                  {!plan.vehicle.isActive && (
                    <Chip size="small" color="warning" icon={<WarningAmberIcon />} label="Araç pasif" />
                  )}
                </Stack>

                <Stack direction="row" spacing={2.5} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                  <Metric icon={<PlaceIcon />} text={`${plan.stopCount} durak`} />
                  {plan.distanceM == null ? (
                    <Typography variant="body2" color="text.secondary">
                      Rota hesaplanmadı
                    </Typography>
                  ) : (
                    <>
                      <Metric icon={<StraightenIcon />} text={formatDistance(plan.distanceM)} />
                      <Metric icon={<ScheduleIcon />} text={formatDuration(plan.durationS)} />
                    </>
                  )}
                </Stack>

                <Divider sx={{ my: 1.5 }} />
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
