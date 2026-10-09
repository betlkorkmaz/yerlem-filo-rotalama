import { Link } from 'react-router';
import { Card, CardActionArea, CardContent, Stack, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { Vehicle } from '../../../api/vehicles';
import { formatPlate, vehicleTypeLabels } from '../vehicleUtils';
import { VehicleStatusChip } from './VehicleStatusChip';

// Küçük ekranda tablo yerine kart: yatay kaydırma olmadan en önemli bilgiler
// (plaka ve durum) üst satırda, ikincil bilgiler altta.
export function VehicleCardList({ vehicles }: { vehicles: Vehicle[] }) {
  return (
    <Stack component="ul" spacing={1.5} sx={{ listStyle: 'none', p: 0, m: 0 }} aria-label="Araç listesi">
      {vehicles.map((v) => (
        <li key={v.id}>
          <Card variant="outlined">
            <CardActionArea component={Link} to={`/vehicles/${v.id}`}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Stack spacing={0.5} sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>{formatPlate(v.plate)}</Typography>
                    <VehicleStatusChip isActive={v.isActive} />
                  </Stack>
                  <Typography color="text.secondary" noWrap>
                    {v.name} · {vehicleTypeLabels[v.type]} · {v.capacity} kişi
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
