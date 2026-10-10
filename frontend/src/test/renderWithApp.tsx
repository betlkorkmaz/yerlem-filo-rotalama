import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { ThemeProvider } from '@mui/material';
import { theme } from '../app/theme';
import { NotificationSnackbar } from '../shared/components/NotificationSnackbar';

function CurrentPath() {
  return <p data-testid="current-path">{useLocation().pathname}</p>;
}

// Sayfayı gerçek uygulamadaki gibi tema + yönlendirici içinde çizer.
// Başka bir adrese yönlendirme olursa ekranda o adres yazar; test bunu okuyarak yönlendirmeyi doğrular.
export function renderAt(path: string, routePath: string, page: ReactElement) {
  return render(
    <ThemeProvider theme={theme} defaultMode="light">
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={routePath} element={page} />
          <Route path="*" element={<CurrentPath />} />
        </Routes>
        <NotificationSnackbar />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

// fetch'i taklit eder: her çağrıda sıradaki cevabı döner. Testler gerçek sunucuya gitmez.
export function mockFetch(...responses: { status: number; body: unknown }[]) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const queue = [...responses];
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const next = queue.shift() ?? { status: 500, body: { error: { message: 'Beklenmeyen istek' } } };
    return new Response(JSON.stringify(next.body), {
      status: next.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
  return calls;
}
