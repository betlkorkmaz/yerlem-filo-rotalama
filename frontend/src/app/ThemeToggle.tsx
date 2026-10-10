import { IconButton, Tooltip } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import LightModeIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined';

// Seçim MUI tarafından tarayıcıya (localStorage) kaydedilir; sayfa yeniden açıldığında hatırlanır.
// Ayrı bir store'a gerek yok: bu, sunucu verisi değil tarayıcıya özgü bir görünüm tercihi.
export function ThemeToggle() {
  const { mode, systemMode, setMode } = useColorScheme();
  // İlk çizimde mode henüz bilinmeyebilir; düğme yer kaplasın ama boş kalsın.
  if (!mode) return null;

  const current = mode === 'system' ? systemMode : mode;
  const next = current === 'dark' ? 'light' : 'dark';
  const label = next === 'light' ? 'Açık temaya geç' : 'Koyu temaya geç';

  return (
    <Tooltip title={label}>
      <IconButton onClick={() => setMode(next)} aria-label={label} sx={{ color: 'text.secondary' }}>
        {next === 'light' ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
}
