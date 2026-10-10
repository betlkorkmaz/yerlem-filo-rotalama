import { NavLink, Outlet, useLocation } from 'react-router';
import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import { NotificationSnackbar } from '../shared/components/NotificationSnackbar';
import { brand, tint } from './theme';
import { ThemeToggle } from './ThemeToggle';

const sections = [
  { to: '/vehicles', label: 'Filo', icon: <LocalShippingIcon /> },
  { to: '/routes', label: 'Rotalama', icon: <AltRouteIcon /> },
];

function Brand() {
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', flexGrow: 1 }}>
      {/* Kendi işaretimiz: kurumsal kimlikteki çizgili küre fikrinden esinlenen sade bir çizim (logo kopyası değil). */}
      <Box component="svg" viewBox="0 0 36 36" aria-hidden sx={{ width: 36, height: 36, flexShrink: 0 }}>
        <defs>
          {/* userSpaceOnUse: yatay çizgilerin yüksekliği 0 olduğu için geçiş tüm çizime göre hesaplanır. */}
          <linearGradient id="brand-mark" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="36" y2="36">
            <stop offset="0" stopColor={brand.dark.primary} />
            <stop offset="1" stopColor={brand.light.secondary} />
          </linearGradient>
        </defs>
        <circle cx="18" cy="18" r="16" fill="none" stroke="url(#brand-mark)" strokeWidth="2" />
        {[9, 14, 19, 24, 29].map((y, i) => (
          <line key={y} x1={8 + (i % 2) * 2} x2={28 - (i % 2) * 2} y1={y - 1} y2={y - 1} stroke="url(#brand-mark)" strokeWidth="2.2" strokeLinecap="round" />
        ))}
      </Box>
      <Box sx={{ lineHeight: 1.1 }}>
        <Typography component="span" sx={{ fontWeight: 800, fontSize: 18, display: 'block', letterSpacing: '-0.02em' }}>
          Yerlem
        </Typography>
        <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block', mt: -0.25 }}>
          Filo & Rotalama
        </Typography>
      </Box>
    </Stack>
  );
}

export function AppLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { pathname } = useLocation();
  const current = sections.find((s) => pathname.startsWith(s.to))?.to ?? false;

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Yarı saydam, bulanık arka planlı üst çubuk: içerik altından kayarken bağlam kaybolmaz. */}
      <AppBar
        position="sticky"
        elevation={0}
        color="inherit"
        sx={{
          bgcolor: (t) => t.alpha((t.vars ?? t).palette.background.default, 0.75),
          backdropFilter: 'blur(14px)',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg" disableGutters>
          <Toolbar sx={{ gap: 2, minHeight: { xs: 60, sm: 68 } }}>
            <Brand />
            {/* Masaüstünde üst menü; mobilde aynı bağlantılar alt çubuğa taşınır. */}
            {!isMobile && (
              <Box
                component="nav"
                aria-label="Ana menü"
                sx={{ display: 'flex', gap: 0.5 }}
              >
                {sections.map((s) => (
                  <Button
                    key={s.to}
                    component={NavLink}
                    to={s.to}
                    startIcon={s.icon}
                    sx={{
                      minHeight: 40,
                      color: 'text.secondary',
                      '&:hover': { color: 'text.primary', bgcolor: (t) => tint(t, 'primary', 0.06) },
                      '&.active': { color: 'primary.main', bgcolor: (t) => tint(t, 'primary', 0.12) },
                    }}
                  >
                    {s.label}
                  </Button>
                ))}
              </Box>
            )}
            <ThemeToggle />
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobilde alt gezinme çubuğu içeriğin üstüne binmesin diye alttan boşluk bırakılır. */}
      <Container component="main" maxWidth="lg" sx={{ flexGrow: 1, py: { xs: 2.5, sm: 4 }, pb: isMobile ? 11 : 4 }}>
        <Outlet />
      </Container>

      {isMobile && (
        <Paper
          component="nav"
          aria-label="Ana menü"
          elevation={0}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: (t) => t.zIndex.appBar,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: (t) => t.alpha((t.vars ?? t).palette.background.default, 0.85),
            backdropFilter: 'blur(14px)',
          }}
        >
          <BottomNavigation showLabels value={current} sx={{ bgcolor: 'transparent' }}>
            {sections.map((s) => (
              <BottomNavigationAction
                key={s.to}
                component={NavLink}
                to={s.to}
                value={s.to}
                label={s.label}
                icon={s.icon}
                sx={{ '&.Mui-selected': { fontWeight: 700 } }}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}

      <NotificationSnackbar />
    </Box>
  );
}
