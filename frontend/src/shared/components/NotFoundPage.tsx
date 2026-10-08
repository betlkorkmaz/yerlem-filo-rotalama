import { Link } from 'react-router';
import { Box, Button, Typography } from '@mui/material';

export function NotFoundPage() {
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Sayfa bulunamadı
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Aradığınız sayfa taşınmış veya hiç var olmamış olabilir.
      </Typography>
      <Button component={Link} to="/vehicles" variant="contained">
        Filoya dön
      </Button>
    </Box>
  );
}
