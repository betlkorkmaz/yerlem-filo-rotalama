import { Chip } from '@mui/material';
import { tint } from '../../../app/theme';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';

// Durum yalnızca renkle anlatılmaz: ikon ve metin de değişir.
export function VehicleStatusChip({ isActive, size = 'small' }: { isActive: boolean; size?: 'small' | 'medium' }) {
  return isActive ? (
    <Chip
      size={size}
      icon={<CheckCircleIcon />}
      label="Aktif"
      sx={{ bgcolor: (t) => tint(t, 'success', 0.14), color: 'success.main', '& .MuiChip-icon': { color: 'inherit' } }}
    />
  ) : (
    <Chip
      size={size}
      icon={<PauseCircleIcon />}
      label="Pasif"
      sx={{ bgcolor: 'action.selected', color: 'text.secondary', '& .MuiChip-icon': { color: 'inherit' } }}
    />
  );
}
