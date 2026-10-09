import { Alert, Snackbar } from '@mui/material';
import { useNotificationStore } from '../store/useNotificationStore';

export function NotificationSnackbar() {
  const { open, message, severity, close } = useNotificationStore();

  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={(_e, reason) => reason !== 'clickaway' && close()}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert onClose={close} severity={severity} variant="filled" sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
