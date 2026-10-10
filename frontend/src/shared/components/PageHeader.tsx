import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Box, Button, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  backTo?: { to: string; label: string };
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, backTo, actions }: PageHeaderProps) {
  return (
    <Box sx={{ mb: 3 }}>
      {backTo && (
        <Button component={Link} to={backTo.to} startIcon={<ArrowBackIcon />} sx={{ mb: 1, ml: -1 }}>
          {backTo.label}
        </Button>
      )}
      {/* Mobilde başlık ve eylemler alt alta, masaüstünde yan yana. */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' } }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" component="h1">
            {title}
          </Typography>
          {/* Metin değilse (ör. rozet ve etiket) <p> içine konmaz; geçersiz HTML iç içeliği olmasın. */}
          {typeof subtitle === 'string' ? (
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          ) : (
            subtitle && <Box sx={{ mt: 1 }}>{subtitle}</Box>
          )}
        </Box>
        {actions && (
          <Stack direction="row" spacing={1} sx={{ '& > *': { flex: { xs: 1, sm: 'none' } } }}>
            {actions}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
