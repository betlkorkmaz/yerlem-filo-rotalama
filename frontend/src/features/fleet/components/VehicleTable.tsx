import { Link } from 'react-router';
import {
  Box,
  IconButton,
  Link as MuiLink,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/EditOutlined';
import type { Vehicle } from '../../../api/vehicles';
import { formatPlate, vehicleTypeLabels } from '../vehicleUtils';
import { VehicleStatusChip } from './VehicleStatusChip';
import { PlateBadge } from './PlateBadge';
import { VehicleTypeIcon } from './VehicleTypeIcon';
import { visuallyHidden } from '../../../shared/a11y';

export function VehicleTable({ vehicles }: { vehicles: Vehicle[] }) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table aria-label="Araç listesi">
        <TableHead>
          <TableRow>
            <TableCell>Araç</TableCell>
            <TableCell>Plaka</TableCell>
            <TableCell>Tip</TableCell>
            <TableCell align="right">Kapasite</TableCell>
            <TableCell>Durum</TableCell>
            <TableCell align="right">
              <Box component="span" sx={visuallyHidden}>
                İşlemler
              </Box>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {vehicles.map((v) => (
            <TableRow key={v.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
              <TableCell>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <VehicleTypeIcon type={v.type} active={v.isActive} />
                  {/* Satırın tamamı yerine araç adı bağlantı: klavye ve ekran okuyucu ile erişilebilir. */}
                  <MuiLink
                    component={Link}
                    to={`/vehicles/${v.id}`}
                    underline="hover"
                    sx={{ fontWeight: 700, color: 'text.primary' }}
                    aria-label={`${v.name}, ${formatPlate(v.plate)} detayı`}
                  >
                    {v.name}
                  </MuiLink>
                </Stack>
              </TableCell>
              <TableCell>
                <PlateBadge plate={v.plate} size="small" />
              </TableCell>
              <TableCell>{vehicleTypeLabels[v.type]}</TableCell>
              <TableCell align="right">
                <Typography component="span" sx={{ fontWeight: 600 }}>
                  {v.capacity}
                </Typography>{' '}
                <Typography component="span" variant="body2" color="text.secondary">
                  kişi
                </Typography>
              </TableCell>
              <TableCell>
                <VehicleStatusChip isActive={v.isActive} />
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Düzenle">
                  <IconButton
                    component={Link}
                    to={`/vehicles/${v.id}/edit`}
                    aria-label={`${formatPlate(v.plate)} aracını düzenle`}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
