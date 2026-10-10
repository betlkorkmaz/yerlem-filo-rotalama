import { Box, Button, Chip, IconButton, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/AddLocationAlt';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import type { FieldErrors } from '../../../api/client';
import type { Place } from '../../../api/geocoding';
import type { EditorStop } from '../store/useRouteEditorStore';
import { StopAddressSearch } from './StopAddressSearch';
import { MAX_STOPS, MIN_STOPS, stopFieldId, stopLabel } from '../routeUtils';

interface StopListEditorProps {
  stops: EditorStop[];
  errors: FieldErrors;
  highlightIndex: number | null; // rota servisinin sorun bildirdiği durak
  disabled: boolean;
  onChange: (key: string, patch: Partial<Omit<EditorStop, 'key'>>) => void;
  onMove: (key: string, direction: -1 | 1) => void;
  onRemove: (key: string) => void;
  onAdd: () => void;
  onSelectPlace: (key: string, place: Place) => void;
}

// Sıralama sürükle-bırak yerine yukarı/aşağı butonlarıyla yapılır: klavye ve ekran okuyucuyla
// da kullanılabilir, küçük ekranda yanlışlıkla sürükleme olmaz.
export function StopListEditor({
  stops,
  errors,
  highlightIndex,
  disabled,
  onChange,
  onMove,
  onRemove,
  onAdd,
  onSelectPlace,
}: StopListEditorProps) {
  const canRemove = stops.length > MIN_STOPS;

  return (
    <Stack spacing={1.5}>
      <Stack component="ol" spacing={1.5} aria-label="Duraklar" sx={{ p: 0, m: 0 }}>
      {stops.map((stop, i) => {
        const label = stopLabel(i, stops.length);
        const err = (field: string) => errors[`stops.${i}.${field}`];
        const locationError = err('location');
        const hasError =
          highlightIndex === i || Boolean(locationError || err('name') || err('latitude') || err('longitude'));

        return (
          <Paper
            key={stop.key}
            component="li"
            variant="outlined"
            aria-label={`${label}${stop.name ? `: ${stop.name}` : ''}`}
            sx={{ p: 1.5, listStyle: 'none', borderColor: hasError ? 'error.main' : undefined, borderWidth: hasError ? 2 : 1 }}
          >
            <Stack direction="row" sx={{ alignItems: 'center', mb: 1, gap: 0.5 }}>
              <Chip
                size="small"
                label={label}
                color={i === 0 ? 'success' : i === stops.length - 1 ? 'error' : 'primary'}
                variant={i === 0 || i === stops.length - 1 ? 'filled' : 'outlined'}
              />
              <Box sx={{ flexGrow: 1 }} />
              <Tooltip title="Yukarı taşı">
                <span>
                  <IconButton aria-label={`Yukarı taşı: ${label}`} disabled={disabled || i === 0} onClick={() => onMove(stop.key, -1)}>
                    <ArrowUpwardIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Aşağı taşı">
                <span>
                  <IconButton
                    aria-label={`Aşağı taşı: ${label}`}
                    disabled={disabled || i === stops.length - 1}
                    onClick={() => onMove(stop.key, 1)}
                  >
                    <ArrowDownwardIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={canRemove ? 'Durağı sil' : `En az ${MIN_STOPS} durak gerekli`}>
                <span>
                  <IconButton aria-label={`Sil: ${label}`} disabled={disabled || !canRemove} onClick={() => onRemove(stop.key)}>
                    <DeleteIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>

            <Stack spacing={1.5}>
              <StopAddressSearch
                inputId={stopFieldId(i, 'search')}
                disabled={disabled}
                onSelect={(place) => onSelectPlace(stop.key, place)}
              />
              {locationError && (
                <Typography color="error" variant="body2" role="alert">
                  {locationError}
                </Typography>
              )}
              <TextField
                id={stopFieldId(i, 'name')}
                label="Durak adı"
                size="small"
                value={stop.name}
                onChange={(e) => onChange(stop.key, { name: e.target.value })}
                error={Boolean(err('name'))}
                helperText={err('name')}
                disabled={disabled}
                fullWidth
                required
                slotProps={{ htmlInput: { maxLength: 100 } }}
              />
              <Stack direction="row" spacing={1.5}>
                {(['latitude', 'longitude'] as const).map((field) => (
                  <TextField
                    key={field}
                    id={stopFieldId(i, field)}
                    label={field === 'latitude' ? 'Enlem' : 'Boylam'}
                    size="small"
                    value={stop[field]}
                    onChange={(e) => onChange(stop.key, { [field]: e.target.value })}
                    error={Boolean(err(field) || locationError)}
                    helperText={err(field)}
                    disabled={disabled}
                    fullWidth
                    required
                    // Telefonda ondalık klavyesi açılsın; virgül de kabul edilir.
                    slotProps={{ htmlInput: { inputMode: 'decimal', autoComplete: 'off' } }}
                  />
                ))}
              </Stack>
            </Stack>
          </Paper>
        );
      })}
      </Stack>

      {errors.stops && (
        <Typography color="error" role="alert" variant="body2">
          {errors.stops}
        </Typography>
      )}

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={onAdd}
        disabled={disabled || stops.length >= MAX_STOPS}
      >
        Ara durak ekle
      </Button>
    </Stack>
  );
}
