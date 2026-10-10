import { Link } from 'react-router';
import { Card, CardActionArea, CardContent, Stack, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { Vehicle } from '../../../api/vehicles';
import { vehicleTypeLabels } from '../vehicleUtils';
import { VehicleStatusChip } from './VehicleStatusChip';
import { PlateBadge } from './PlateBadge';
import { VehicleTypeIcon } from './VehicleTypeIcon';

// Küçük ekranda tablo yerine kart: yatay kaydırma olmadan en önemli bilgiler
// (plaka ve durum) üst satırda, ikincil bilgiler altta.
export function VehicleCardList({ vehicles }: { vehicles: Vehicle[] }) {
  return (
    <Stack component="ul" spacing={1.25} sx={{ listStyle: 'none', p: 0, m: 0 }} aria-label="Araç listesi">
      {vehicles.map((v) => (
        <li key={v.id}>
          <Card variant="outlined">
            <CardActionArea component={Link} to={`/vehicles/${v.id}`}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.75, '&:last-child': { pb: 1.75 } }}>
                <VehicleTypeIcon type={v.type} active={v.isActive} />
                <Stack spacing={0.75} sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <PlateBadge plate={v.plate} size="small" />
                    <VehicleStatusChip isActive={v.isActive} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    <Typography component="span" variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {v.name}
                    </Typography>{' '}
                    · {vehicleTypeLabels[v.type]} · {v.capacity} kişi
                  </Typography>
                </Stack>
                <ChevronRightIcon color="action" aria-hidden />
              </CardContent>
            </CardActionArea>
          </Card>
        </li>
      ))}
    </Stack>
  );
}
