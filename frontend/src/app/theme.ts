import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: { main: '#0d47a1' },
    secondary: { main: '#00897b' },
    background: { default: '#f5f7fa' },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    // Dokunmatik kullanımda yeterli hedef alanı için butonlar en az 44px yüksekliğinde.
    MuiButton: { styleOverrides: { root: { minHeight: 44 } } },
    MuiIconButton: { styleOverrides: { root: { minWidth: 44, minHeight: 44 } } },
    // Klavye ile gezinmede odaklanılan öğe her zaman görünür olsun.
    MuiButtonBase: {
      styleOverrides: {
        root: {
          '&.Mui-focusVisible': { outline: '3px solid #ffb300', outlineOffset: 2 },
        },
      },
    },
  },
});
