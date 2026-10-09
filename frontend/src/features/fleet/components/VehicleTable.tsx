import { Link } from 'react-router';
import {
  Box,
  IconButton,
  Link as MuiLink,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import type { Vehicle } from '../../../api/vehicles';
import { formatPlate, vehicleTypeLabels } from '../vehicleUtils';
import { VehicleStatusChip } from './VehicleStatusChip';
import { visuallyHidden } from '../../../shared/a11y';

export function VehicleTable({ vehicles }: { vehicles: Vehicle[] }) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table aria-label="Araç listesi">
        <TableHead>
          <TableRow>
            <TableCell>Plaka</TableCell>
            <TableCell>Ad / Kod</TableCell>
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
            <TableRow key={v.id} hover>
              <TableCell>
                {/* Satırın tamamı yerine plaka bağlantı: klavye ve ekran okuyucu ile erişilebilir. */}
                <MuiLink component={Link} to={`/vehicles/${v.id}`} sx={{ fontWeight: 700 }}>
                  {formatPlate(v.plate)}
                </MuiLink>
              </TableCell>
              <TableCell>{v.name}</TableCell>
              <TableCell>{vehicleTypeLabels[v.type]}</TableCell>
              <TableCell align="right">{v.capacity} kişi</TableCell>
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
