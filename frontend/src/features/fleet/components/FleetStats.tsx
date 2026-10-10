import { Box, Paper, Typography } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import type { Vehicle } from '../../../api/vehicles';

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
      <Box
        aria-hidden
        // Dar ekranda üç kart yan yana sığsın diye ikon gizlenir; sayı ve etiket kalır.
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2.5,
          display: { xs: 'none', sm: 'grid' },
          placeItems: 'center',
          flexShrink: 0,
          color,
          bgcolor: `${color}1a`,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800, fontSize: { xs: 20, sm: 24 }, lineHeight: 1.1, color }}>{value}</Typography>
        <Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: { xs: 12, sm: 14 } }}>
          {label}
        </Typography>
      </Box>
    </Paper>
  );
}

// Filonun hızlı özeti; sayılar mevcut listeden türetilir, ayrı istek yapılmaz.
export function FleetStats({ vehicles }: { vehicles: Vehicle[] }) {
  const active = vehicles.filter((v) => v.isActive).length;
  return (
    <Box
      component="section"
      aria-label="Filo özeti"
      sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: { xs: 1, sm: 2 }, mb: 3 }}
    >
      <StatCard icon={<LocalShippingIcon />} label="Toplam araç" value={vehicles.length} color="#4f46e5" />
      <StatCard icon={<CheckCircleIcon />} label="Aktif" value={active} color="#16a34a" />
      <StatCard icon={<PauseCircleIcon />} label="Pasif" value={vehicles.length - active} color="#64748b" />
    </Box>
  );
}
