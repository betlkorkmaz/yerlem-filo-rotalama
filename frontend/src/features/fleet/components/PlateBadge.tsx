import { Box } from '@mui/material';
import { formatPlate } from '../vehicleUtils';

// Türk plakası görünümü: solda mavi TR şeridi. Plaka metni gerçek metindir (ekran okuyucu okur).
export function PlateBadge({ plate, size = 'medium' }: { plate: string; size?: 'small' | 'medium' | 'large' }) {
  const fontSize = { small: 13, medium: 15, large: 22 }[size];
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'stretch',
        border: '1.5px solid #0f172a',
        borderRadius: '6px',
        overflow: 'hidden',
        bgcolor: '#fff',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        verticalAlign: 'middle',
      }}
    >
      <Box
        component="span"
        aria-hidden
        sx={{
          bgcolor: '#1d4ed8',
          color: '#fff',
          fontSize: fontSize * 0.55,
          fontWeight: 700,
          px: 0.5,
          display: 'flex',
          alignItems: 'flex-end',
          pb: 0.25,
        }}
      >
        TR
      </Box>
      <Box
        component="span"
        sx={{ px: 1, py: size === 'large' ? 0.75 : 0.5, fontWeight: 800, fontSize, letterSpacing: '0.04em', color: '#0f172a' }}
      >
        {formatPlate(plate)}
      </Box>
    </Box>
  );
}
