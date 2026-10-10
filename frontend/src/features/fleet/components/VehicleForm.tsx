import { useRef, useState, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import { ApiError, type FieldErrors } from '../../../api/client';
import { VEHICLE_TYPES, type VehicleInput } from '../../../api/vehicles';
import { vehicleTypeLabels } from '../vehicleUtils';
import { toVehicleInput, validateVehicleForm, type VehicleFormValues } from '../vehicleValidation';

interface VehicleFormProps {
  initialValues: VehicleFormValues;
  submitLabel: string;
  onSubmit: (input: VehicleInput) => Promise<void>;
  onCancel: () => void;
}

const FIELD_ORDER = ['plate', 'name', 'type', 'capacity'] as const;
const fieldId = (field: string) => `vehicle-${field}`;

export function VehicleForm({ initialValues, submitLabel, onSubmit, onCancel }: VehicleFormProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // State güncellemesi bir sonraki çizime kadar beklediği için çok hızlı ikinci tıklama
  // butonun kilitlenmesinden önce gelebilir; ref anında güncellenir.
  const submittingRef = useRef(false);

  const setField = <K extends keyof VehicleFormValues>(field: K, value: VehicleFormValues[K]) => {
    setValues((v) => ({ ...v, [field]: value }));
    // Kullanıcı alanı düzeltmeye başlayınca o alanın eski hata mesajı kalkar.
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const focusFirstError = (fieldErrors: FieldErrors) => {
    const first = FIELD_ORDER.find((f) => fieldErrors[f]);
    if (first) document.getElementById(fieldId(first))?.focus();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;

    const clientErrors = validateVehicleForm(values);
    setErrors(clientErrors);
    setFormError(null);
    if (Object.keys(clientErrors).length > 0) {
      focusFirstError(clientErrors);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      await onSubmit(toVehicleInput(values));
      // Başarılı kayıttan sonra kilit açılmaz: sayfa yönlenirken gelen ikinci tıklama yeni istek
      // göndermesin. (Test ile yakalandı: hızlı cevapta çift tıklama iki kayıt isteği gönderiyordu.)
    } catch (err) {
      submittingRef.current = false;
      setSubmitting(false);
      const apiError = err instanceof ApiError ? err : null;
      if (apiError && Object.keys(apiError.fieldErrors).length > 0) {
        setErrors(apiError.fieldErrors);
        focusFirstError(apiError.fieldErrors);
      } else {
        setFormError(apiError?.message ?? 'Kayıt sırasında beklenmeyen bir hata oluştu.');
      }
    }
  };

  // MUI, helperText'i alanla aria-describedby üzerinden ilişkilendirir; error prop'u aria-invalid ekler.
  const fieldProps = (field: (typeof FIELD_ORDER)[number]) => ({
    id: fieldId(field),
    error: Boolean(errors[field]),
    helperText: errors[field],
    fullWidth: true,
    required: true,
    disabled: submitting,
  });

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, maxWidth: 640 }}>
      <Box component="form" noValidate onSubmit={handleSubmit} aria-busy={submitting}>
        <Stack spacing={2.5}>
          {formError && (
            <Alert severity="error" role="alert">
              {formError}
            </Alert>
          )}

          <TextField
            {...fieldProps('plate')}
            label="Plaka"
            placeholder="34 ABC 123"
            value={values.plate}
            onChange={(e) => setField('plate', e.target.value)}
            slotProps={{ htmlInput: { autoCapitalize: 'characters', autoComplete: 'off', maxLength: 15 } }}
          />

          <TextField
            {...fieldProps('name')}
            label="Ad / Kod"
            placeholder="SRV-01"
            value={values.name}
            onChange={(e) => setField('name', e.target.value)}
            slotProps={{ htmlInput: { maxLength: 50 } }}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
            <TextField
              {...fieldProps('type')}
              select
              label="Araç tipi"
              value={values.type}
              onChange={(e) => setField('type', e.target.value as VehicleFormValues['type'])}
            >
              {VEHICLE_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {vehicleTypeLabels[t]}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              {...fieldProps('capacity')}
              type="number"
              label="Yolcu kapasitesi"
              value={values.capacity}
              onChange={(e) => setField('capacity', e.target.value)}
              slotProps={{ htmlInput: { min: 1, max: 100, inputMode: 'numeric' } }}
            />
          </Stack>

          <FormControlLabel
            control={
              <Switch
                checked={values.isActive}
                onChange={(e) => setField('isActive', e.target.checked)}
                disabled={submitting}
              />
            }
            label={values.isActive ? 'Aktif: yeni rota planlarında seçilebilir' : 'Pasif: yeni rota planlarında seçilemez'}
          />

          <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={onCancel} disabled={submitting}>
              Vazgeç
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
            >
              {submitting ? 'Kaydediliyor…' : submitLabel}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
}
