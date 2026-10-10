import { StrictMode } from 'react';
import '@fontsource-variable/inter';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from './app/theme';
import { AppRoutes } from './app/AppRoutes';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Varsayılan koyu şema (kurumsal kimlik); kullanıcı üst çubuktan açığa geçebilir. */}
    <ThemeProvider theme={theme} defaultMode="dark">
      <CssBaseline />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
