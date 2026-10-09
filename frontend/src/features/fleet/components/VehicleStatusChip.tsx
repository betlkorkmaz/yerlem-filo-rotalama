import { Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';

// Durum yalnızca renkle anlatılmaz: ikon ve metin de değişir.
export function VehicleStatusChip({ isActive, size = 'small' }: { isActive: boolean; size?: 'small' | 'medium' }) {
  return isActive ? (
    <Chip size={size} color="success" variant="outlined" icon={<CheckCircleIcon />} label="Aktif" />
  ) : (
    <Chip size={size} variant="outlined" icon={<PauseCircleIcon />} label="Pasif" />
  );
}
