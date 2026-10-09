import type { ReactNode } from 'react';
import { Alert, AlertTitle, Box, Button, Paper, Skeleton, Stack, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

// Yükleniyor, hata ve boş durumları her ekranda aynı görünsün diye ortak bileşenler.

export function LoadingState({ label = 'Yükleniyor', rows = 4 }: { label?: string; rows?: number }) {
  return (
    <Stack spacing={1.5} role="status" aria-live="polite" aria-label={label}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} variant="rounded" height={72} />
      ))}
    </Stack>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Bir sorun oluştu', message, onRetry }: ErrorStateProps) {
  return (
    <Alert
      severity="error"
      role="alert"
      action={
        onRetry && (
          <Button color="inherit" startIcon={<RefreshIcon />} onClick={onRetry}>
            Tekrar dene
          </Button>
        )
      }
    >
      <AlertTitle>{title}</AlertTitle>
      {message}
    </Alert>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Paper variant="outlined" sx={{ py: 6, px: 3, textAlign: 'center' }}>
      {icon && <Box sx={{ color: 'text.secondary', mb: 1, '& svg': { fontSize: 48 } }}>{icon}</Box>}
      <Typography variant="h6" component="h2" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography color="text.secondary" sx={{ mb: action ? 3 : 0 }}>
          {description}
        </Typography>
      )}
      {action}
    </Paper>
  );
}
