import { Avatar } from '@mui/material';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import AirportShuttleIcon from '@mui/icons-material/AirportShuttle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import type { VehicleType } from '../../../api/vehicles';

const icons: Record<VehicleType, React.ReactNode> = {
  bus: <DirectionsBusIcon fontSize="small" />,
  midibus: <DirectionsBusIcon fontSize="small" />,
  minibus: <AirportShuttleIcon fontSize="small" />,
  van: <LocalShippingIcon fontSize="small" />,
};

// Süs amaçlı: tip bilgisi yanında yazıyla da verildiği için ekran okuyucudan gizlenir.
export function VehicleTypeIcon({ type, active = true }: { type: VehicleType; active?: boolean }) {
  return (
    <Avatar
      aria-hidden
      variant="rounded"
      sx={{
        width: 40,
        height: 40,
        borderRadius: 2.5,
        bgcolor: active ? 'rgba(79,70,229,.1)' : '#f1f5f9',
        color: active ? 'primary.main' : 'text.secondary',
      }}
    >
      {icons[type]}
    </Avatar>
  );
}
