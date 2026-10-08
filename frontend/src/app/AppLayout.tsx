import { NavLink, Outlet, useLocation } from 'react-router';
import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Container,
  Paper,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AltRouteIcon from '@mui/icons-material/AltRoute';

const sections = [
  { to: '/vehicles', label: 'Filo', icon: <LocalShippingIcon /> },
  { to: '/routes', label: 'Rotalama', icon: <AltRouteIcon /> },
];

export function AppLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { pathname } = useLocation();
  const current = sections.find((s) => pathname.startsWith(s.to))?.to ?? false;

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 700, flexGrow: 1 }}>
            Yerlem
          </Typography>
          {/* Masaüstünde üst menü; mobilde aynı bağlantılar alt çubuğa taşınır. */}
          {!isMobile && (
            <Box component="nav" aria-label="Ana menü" sx={{ display: 'flex', gap: 1 }}>
              {sections.map((s) => (
                <Button
                  key={s.to}
                  component={NavLink}
                  to={s.to}
                  color="inherit"
                  startIcon={s.icon}
                  sx={{ '&.active': { bgcolor: 'rgba(255,255,255,0.16)' } }}
                >
                  {s.label}
                </Button>
              ))}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobilde alt gezinme çubuğu içeriğin üstüne binmesin diye alttan boşluk bırakılır. */}
      <Container component="main" maxWidth="lg" sx={{ flexGrow: 1, py: 3, pb: isMobile ? 10 : 3 }}>
        <Outlet />
      </Container>

      {isMobile && (
        <Paper
          component="nav"
          aria-label="Ana menü"
          elevation={8}
          sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: (t) => t.zIndex.appBar }}
        >
          <BottomNavigation showLabels value={current}>
            {sections.map((s) => (
              <BottomNavigationAction
                key={s.to}
                component={NavLink}
                to={s.to}
                value={s.to}
                label={s.label}
                icon={s.icon}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
}
