import { createTheme, type Theme } from '@mui/material/styles';

// İki renk şeması aynı markayı taşır: camgöbeği/turkuaz vurgu. Koyu şema kurumsal sitedeki tarza
// uyar (siyah yerine gece mavisi); açık şema gün ışığında, sahada okunurluk içindir.
// Tüm metin/zemin çiftleri WCAG AA kontrastını (normal metin için en az 4.5:1) sağlar.
export const brand = {
  dark: {
    primary: '#38bdf8',
    secondary: '#2dd4bf',
    bg: '#0b1120',
    paper: '#111a2e',
    text: '#e2e8f0',
    muted: '#94a3b8',
    border: 'rgba(148, 163, 184, 0.16)',
  },
  light: {
    primary: '#0369a1', // açık zeminde yeterli kontrast için camgöbeğinin koyu tonu
    secondary: '#0f766e',
    bg: '#f4f7fb',
    paper: '#ffffff',
    text: '#0f172a',
    muted: '#475569',
    border: 'rgba(15, 23, 42, 0.10)',
  },
};

// Bileşenlerde temaya göre değişen yarı saydam renkler için: ör. tint(t, 'success', 0.14).
// CSS değişkeni kullanıldığı için şema değişince sayfa yeniden çizilmeden renkler güncellenir.
type ColorName = 'primary' | 'secondary' | 'success' | 'warning' | 'error';
export const tint = (t: Theme, color: ColorName, opacity: number) =>
  t.alpha((t.vars ?? t).palette[color].main, opacity);

export const theme = createTheme({
  // Renkler CSS değişkeni olarak üretilir; şema değiştirmek tek bir HTML özelliğini değiştirir.
  cssVariables: { colorSchemeSelector: 'data-color-scheme' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: brand.light.primary },
        secondary: { main: brand.light.secondary },
        success: { main: '#15803d' },
        warning: { main: '#b45309' },
        error: { main: '#dc2626' },
        text: { primary: brand.light.text, secondary: brand.light.muted },
        divider: brand.light.border,
        background: { default: brand.light.bg, paper: brand.light.paper },
      },
    },
    dark: {
      palette: {
        primary: { main: brand.dark.primary, contrastText: '#06111f' },
        secondary: { main: brand.dark.secondary },
        success: { main: '#4ade80' },
        warning: { main: '#fbbf24' },
        error: { main: '#f87171' },
        text: { primary: brand.dark.text, secondary: brand.dark.muted },
        divider: brand.dark.border,
        background: { default: brand.dark.bg, paper: brand.dark.paper },
      },
    },
  },
  shape: { borderRadius: 14 },
  typography: {
    // Yazı tipi paketle birlikte gelir (dış bağlantı yok); yüklenemezse sistem yazı tipine düşer.
    fontFamily: '"Inter Variable", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    // Büyük ve ince sayfa başlıkları: şirketin kurumsal sitesindeki sade, ferah görünüme uyum.
    h5: { fontWeight: 300, fontSize: 'clamp(1.75rem, 1.4rem + 1.5vw, 2.4rem)', letterSpacing: '-0.02em' },
    h6: { fontWeight: 600, letterSpacing: '-0.01em' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: (t) => ({
        body: {
          WebkitFontSmoothing: 'antialiased',
          // Üst kısımda hafif vurgu ışıması; içerik okunurluğunu etkilemeyecek kadar silik.
          backgroundImage: `radial-gradient(1200px 500px at 50% -10%, ${tint(t, 'primary', 0.1)}, transparent 70%)`,
          backgroundAttachment: 'fixed',
        },
      }),
    },
    // Dokunmatik kullanımda yeterli hedef alanı için butonlar en az 44px yüksekliğinde.
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: ({ theme: t }) => ({
          minHeight: 44,
          borderRadius: 999,
          paddingInline: 20,
          variants: [
            {
              props: { variant: 'contained', color: 'primary' },
              style: {
                backgroundImage: `linear-gradient(135deg, ${brand.light.primary} 0%, ${brand.light.secondary} 100%)`,
                color: '#fff',
                boxShadow: `0 8px 24px -10px ${tint(t, 'primary', 0.8)}`,
                '&:hover': { filter: 'brightness(1.08)' },
                '&.Mui-disabled': { backgroundImage: 'none', boxShadow: 'none' },
                ...t.applyStyles('dark', {
                  backgroundImage: `linear-gradient(135deg, ${brand.dark.primary} 0%, ${brand.dark.secondary} 100%)`,
                  color: '#06111f',
                }),
              },
            },
            {
              props: { variant: 'outlined' },
              style: {
                borderColor: tint(t, 'primary', 0.4),
                '&:hover': { borderColor: (t.vars ?? t).palette.primary.main },
              },
            },
          ],
        }),
      },
    },
    MuiIconButton: { styleOverrides: { root: { minWidth: 44, minHeight: 44 } } },
    // Klavye ile gezinmede odaklanılan öğe her zaman görünür olsun.
    MuiButtonBase: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          '&.Mui-focusVisible': { outline: `3px solid ${tint(t, 'primary', 0.6)}`, outlineOffset: 2 },
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        // Koyu şemada MUI'nin otomatik açıklaştırma katmanı kapatılır; renkler tek elden yönetilir.
        root: { backgroundImage: 'none' },
        outlined: ({ theme: t }) => ({
          borderColor: (t.vars ?? t).palette.divider,
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -16px rgba(15, 23, 42, 0.15)',
          ...t.applyStyles('dark', {
            boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset, 0 12px 32px -16px rgba(0,0,0,0.6)',
          }),
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { transition: 'transform .15s ease, box-shadow .15s ease, border-color .15s ease' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          backgroundColor: (t.vars ?? t).palette.background.paper,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: (t.vars ?? t).palette.divider },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: tint(t, 'primary', 0.5) },
          ...t.applyStyles('dark', { backgroundColor: 'rgba(11, 17, 32, 0.6)' }),
        }),
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 600, borderRadius: 8 } } },
    MuiAlert: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          borderRadius: 12,
          alignItems: 'center',
          border: `1px solid ${(t.vars ?? t).palette.divider}`,
        }),
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: ({ theme: t }) => ({
          color: (t.vars ?? t).palette.text.secondary,
          fontWeight: 600,
          fontSize: 12,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          backgroundColor: (t.vars ?? t).palette.action.hover,
        }),
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: ({ theme: t }) => ({ '&.MuiTableRow-hover:hover': { backgroundColor: tint(t, 'primary', 0.05) } }),
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          '&.Mui-selected': { backgroundColor: tint(t, 'primary', 0.14), color: (t.vars ?? t).palette.primary.main },
        }),
      },
    },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 18 } } },
    MuiBottomNavigation: { styleOverrides: { root: { backgroundColor: 'transparent' } } },
  },
});
