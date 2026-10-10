import { useId, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { ApiError } from '../../../api/client';
import { searchPlaces, type Place } from '../../../api/geocoding';

interface StopAddressSearchProps {
  inputId: string;
  disabled: boolean;
  onSelect: (place: Place) => void;
}

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; places: Place[] }
  | { status: 'error'; message: string };

// Arama yalnızca "Ara" ya da Enter ile yapılır, her tuş vuruşunda değil: adres servisinin
// (Nominatim) kullanım politikası yazarken otomatik aramayı yasaklıyor ve saniyede 1 istek sınırı var.
export function StopAddressSearch({ inputId, disabled, onSelect }: StopAddressSearchProps) {
  const [query, setQuery] = useState('');
  const [state, setState] = useState<SearchState>({ status: 'idle' });
  const resultsId = useId();

  const handleSearch = async (e?: { preventDefault: () => void }) => {
    e?.preventDefault();
    const text = query.trim();
    if (text.length < 3) {
      setState({ status: 'error', message: 'En az 3 karakter yazın.' });
      return;
    }
    setState({ status: 'loading' });
    try {
      const places = await searchPlaces(text);
      // Tek sonuç varsa seçim beklemeden durağa yazılır; kullanıcı sonuca tıklamayı unutmasın.
      if (places.length === 1) choose(places[0]);
      else setState({ status: 'done', places });
    } catch (err) {
      setState({ status: 'error', message: err instanceof ApiError ? err.message : 'Adres aranamadı.' });
    }
  };

  const choose = (place: Place) => {
    onSelect(place);
    setQuery('');
    setState({ status: 'idle' });
  };

  return (
    <Box>
      <TextField
        id={inputId}
        label="Adres ara"
        placeholder="ör. Kadıköy İskele"
        size="small"
        fullWidth
        value={query}
        disabled={disabled}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSearch(e);
        }}
        slotProps={{
          htmlInput: { 'aria-controls': resultsId, enterKeyHint: 'search' },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="Adresi ara"
                  edge="end"
                  disabled={disabled || state.status === 'loading'}
                  onClick={() => handleSearch()}
                >
                  {state.status === 'loading' ? <CircularProgress size={20} /> : <SearchIcon />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <Box id={resultsId} aria-live="polite">
        {state.status === 'error' && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            {state.message} Haritaya dokunarak veya koordinat girerek de durak ekleyebilirsiniz.
          </Alert>
        )}
        {state.status === 'done' && state.places.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Sonuç bulunamadı. Farklı yazmayı deneyin (ör. semt adıyla birlikte).
          </Typography>
        )}
        {state.status === 'done' && state.places.length > 0 && (
          <Paper variant="outlined" sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ px: 2, pt: 1, fontWeight: 600 }}>
              Doğru yeri seçin:
            </Typography>
            <List dense disablePadding aria-label="Adres sonuçları">
              {state.places.map((p) => (
                <ListItemButton key={`${p.latitude},${p.longitude}`} onClick={() => choose(p)}>
                  <ListItemText
                    primary={p.name}
                    secondary={p.displayName}
                    slotProps={{ secondary: { noWrap: true } }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
