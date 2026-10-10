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
import { alpha } from '@mui/material/styles';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import { NotificationSnackbar } from '../shared/components/NotificationSnackbar';

const sections = [
  { to: '/vehicles', label: 'Filo', icon: <LocalShippingIcon /> },
  { to: '/routes', label: 'Rotalama', icon: <AltRouteIcon /> },
];

function Brand() {
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', flexGrow: 1 }}>
      <Box
        aria-hidden
        sx={{
          width: 36,
          height: 36,
          borderRadius: 2.5,
          display: 'grid',
          placeItems: 'center',
          color: '#fff',
          background: 'linear-gradient(135deg, #4f46e5 0%, #0d9488 100%)',
          boxShadow: '0 6px 14px -6px rgba(79,70,229,.7)',
        }}
      >
        <AltRouteIcon fontSize="small" />
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
          bgcolor: alpha('#ffffff', 0.8),
          backdropFilter: 'blur(12px)',
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
                sx={{ display: 'flex', gap: 0.5, p: 0.5, borderRadius: 3, bgcolor: '#f1f5f9' }}
              >
                {sections.map((s) => (
                  <Button
                    key={s.to}
                    component={NavLink}
                    to={s.to}
                    startIcon={s.icon}
                    sx={{
                      minHeight: 40,
                      borderRadius: 2.5,
                      color: 'text.secondary',
                      '&.active': {
                        color: 'primary.main',
                        bgcolor: '#fff',
                        boxShadow: '0 1px 3px rgba(15,23,42,.12)',
                      },
                    }}
                  >
                    {s.label}
                  </Button>
                ))}
              </Box>
            )}
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
            bgcolor: alpha('#ffffff', 0.9),
            backdropFilter: 'blur(12px)',
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
