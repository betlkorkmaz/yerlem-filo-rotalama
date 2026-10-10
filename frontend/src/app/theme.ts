import { alpha, createTheme } from '@mui/material/styles';

// Renkler WCAG AA kontrastını (normal metin için 4.5:1) beyaz zemin üzerinde sağlayacak şekilde seçildi.
const brand = {
  primary: '#4f46e5', // indigo
  primaryDark: '#3730a3',
  secondary: '#0d9488', // teal
  ink: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  surface: '#f6f7fb',
};

export const theme = createTheme({
  palette: {
    primary: { main: brand.primary, dark: brand.primaryDark },
    secondary: { main: brand.secondary },
    text: { primary: brand.ink, secondary: brand.muted },
    divider: brand.border,
    background: { default: brand.surface, paper: '#ffffff' },
  },
  shape: { borderRadius: 12 },
  typography: {
    // Yazı tipi paketle birlikte gelir (dış bağlantı yok); yüklenemezse sistem yazı tipine düşer.
    fontFamily: '"Inter Variable", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    h5: { fontWeight: 800, letterSpacing: '-0.02em' },
    h6: { fontWeight: 700, letterSpacing: '-0.01em' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { WebkitFontSmoothing: 'antialiased' },
      },
    },
    // Dokunmatik kullanımda yeterli hedef alanı için butonlar en az 44px yüksekliğinde.
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          minHeight: 44,
          borderRadius: 10,
          paddingInline: 18,
          variants: [
            {
              props: { variant: 'contained', color: 'primary' },
              style: {
                backgroundImage: `linear-gradient(135deg, ${brand.primary} 0%, #6366f1 100%)`,
                boxShadow: `0 6px 16px -6px ${alpha(brand.primary, 0.6)}`,
                '&:hover': { backgroundImage: `linear-gradient(135deg, ${brand.primaryDark} 0%, ${brand.primary} 100%)` },
                '&.Mui-disabled': { backgroundImage: 'none', boxShadow: 'none' },
              },
            },
            { props: { variant: 'outlined' }, style: { backgroundColor: '#fff' } },
          ],
        },
      },
    },
    MuiIconButton: { styleOverrides: { root: { minWidth: 44, minHeight: 44 } } },
    // Klavye ile gezinmede odaklanılan öğe her zaman görünür olsun.
    MuiButtonBase: {
      styleOverrides: {
        root: {
          '&.Mui-focusVisible': { outline: `3px solid ${alpha(brand.primary, 0.45)}`, outlineOffset: 2 },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        outlined: {
          borderColor: brand.border,
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px -8px rgba(15, 23, 42, 0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { transition: 'transform .15s ease, box-shadow .15s ease, border-color .15s ease' },
      },
    },
    MuiCardActionArea: {
      styleOverrides: {
        root: { '&:hover .MuiCardActionArea-focusHighlight': { opacity: 0.02 } },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#fff',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: brand.border },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
        },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 600, borderRadius: 8 } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 12, alignItems: 'center' } } },
    MuiTableCell: {
      styleOverrides: {
        head: { color: brand.muted, fontWeight: 600, fontSize: 13, backgroundColor: '#f8fafc' },
        root: { borderColor: brand.border },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          backgroundColor: '#fff',
          borderColor: brand.border,
          '&.Mui-selected': { backgroundColor: alpha(brand.primary, 0.1), color: brand.primary },
        },
      },
    },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 16 } } },
    MuiTooltip: { styleOverrides: { tooltip: { backgroundColor: brand.ink, fontSize: 12 } } },
  },
});
