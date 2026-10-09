import { InputAdornment, Stack, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import type { StatusFilter } from '../vehicleUtils';

interface VehicleFiltersProps {
  search: string;
  status: StatusFilter;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: StatusFilter) => void;
}

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Tümü' },
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Pasif' },
];

export function VehicleFilters({ search, status, onSearchChange, onStatusChange }: VehicleFiltersProps) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
      <TextField
        type="search"
        label="Plaka veya ad ara"
        placeholder="ör. 34 ABC veya SRV-01"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        fullWidth
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
      />
      <ToggleButtonGroup
        exclusive
        value={status}
        // Seçili butona tekrar basılınca değer null gelir; filtre boş kalmasın diye yok sayılır.
        onChange={(_e, value: StatusFilter | null) => value && onStatusChange(value)}
        aria-label="Durum filtresi"
        sx={{ flexShrink: 0, '& .MuiToggleButton-root': { flex: { xs: 1, sm: 'none' }, px: 2.5 } }}
      >
        {statusOptions.map((o) => (
          <ToggleButton key={o.value} value={o.value}>
            {o.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
  );
}
