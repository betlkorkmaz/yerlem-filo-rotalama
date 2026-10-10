import { Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';

// Durum yalnızca renkle anlatılmaz: ikon ve metin de değişir.
export function VehicleStatusChip({ isActive, size = 'small' }: { isActive: boolean; size?: 'small' | 'medium' }) {
  return isActive ? (
    <Chip
      size={size}
      icon={<CheckCircleIcon />}
      label="Aktif"
      sx={{ bgcolor: '#dcfce7', color: '#166534', '& .MuiChip-icon': { color: '#16a34a' } }}
    />
  ) : (
    <Chip
      size={size}
      icon={<PauseCircleIcon />}
      label="Pasif"
      sx={{ bgcolor: '#f1f5f9', color: '#475569', '& .MuiChip-icon': { color: '#64748b' } }}
    />
  );
}
