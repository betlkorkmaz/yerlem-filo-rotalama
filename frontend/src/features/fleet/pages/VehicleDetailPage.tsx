import { useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import { ApiError } from '../../../api/client';
import { PageHeader } from '../../../shared/components/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../../shared/components/StateViews';
import { useNotificationStore } from '../../../shared/store/useNotificationStore';
import { useVehicleStore } from '../store/useVehicleStore';
import { useVehicle } from '../hooks/useVehicle';
import { VehicleStatusChip } from '../components/VehicleStatusChip';
import { formatDateTime, formatPlate, vehicleTypeLabels } from '../vehicleUtils';

export function VehicleDetailPage() {
  const { id = '' } = useParams();
  return <VehicleDetail key={id} id={id} />;
}

function VehicleDetail({ id }: { id: string }) {
  const { vehicle, status, error, retry, notFound } = useVehicle(id);
  const updateVehicle = useVehicleStore((s) => s.updateVehicle);
  const notify = useNotificationStore((s) => s.notify);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  const backTo = { to: '/vehicles', label: 'Araçlar' };

  if (!vehicle && status === 'loading') {
    return <><PageHeader title="Araç detayı" backTo={backTo} /><LoadingState label="Araç yükleniyor" rows={2} /></>;
  }

  if (notFound) {
    return (
      <>
        <PageHeader title="Araç detayı" backTo={backTo} />
        <EmptyState
          title="Araç bulunamadı"
          description="Bu adreste kayıtlı bir araç yok."
          action={<Button component={Link} to="/vehicles" variant="contained">Araçlara dön</Button>}
        />
      </>
    );
  }

  if (!vehicle) {
    return (
      <>
        <PageHeader title="Araç detayı" backTo={backTo} />
        <ErrorState message={error?.message ?? 'Araç yüklenemedi.'} onRetry={retry} />
      </>
    );
  }

  const setActive = async (isActive: boolean) => {
    setToggling(true);
    try {
      await updateVehicle(vehicle.id, { isActive });
      notify(isActive ? 'Araç aktif yapıldı.' : 'Araç pasif yapıldı.');
      setConfirmOpen(false);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Durum değiştirilemedi.', 'error');
    } finally {
      setToggling(false);
    }
  };

  const details: [string, string][] = [
    ['Ad / Kod', vehicle.name],
    ['Araç tipi', vehicleTypeLabels[vehicle.type]],
    ['Yolcu kapasitesi', `${vehicle.capacity} kişi`],
    ['Eklenme', formatDateTime(vehicle.createdAt)],
    ['Son güncelleme', formatDateTime(vehicle.updatedAt)],
  ];

  return (
    <>
      <PageHeader
        title={formatPlate(vehicle.plate)}
        subtitle={<VehicleStatusChip isActive={vehicle.isActive} size="medium" />}
        backTo={backTo}
        actions={
          <>
            <Button component={Link} to={`/vehicles/${vehicle.id}/edit`} variant="outlined" startIcon={<EditIcon />}>
              Düzenle
            </Button>
            {vehicle.isActive ? (
              // Pasif yapmak yeni planları etkilediği için onay istenir; aktif yapmak zararsızdır.
              <Button variant="outlined" color="warning" startIcon={<PauseCircleIcon />} onClick={() => setConfirmOpen(true)}>
                Pasif yap
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                disabled={toggling}
                startIcon={toggling ? <CircularProgress size={18} color="inherit" /> : <PlayCircleIcon />}
                onClick={() => setActive(true)}
              >
                Aktif yap
              </Button>
            )}
          </>
        }
      />

      {status === 'error' && (
        <Box sx={{ mb: 2 }}>
          <ErrorState title="Güncel bilgi alınamadı" message={error?.message ?? ''} onRetry={retry} />
        </Box>
      )}

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <Box
          component="dl"
          sx={{
            m: 0,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '200px 1fr' },
            rowGap: { xs: 0.5, sm: 2 },
            '& dt': { color: 'text.secondary' },
            '& dd': { m: 0, mb: { xs: 1.5, sm: 0 }, fontWeight: 500 },
          }}
        >
          {details.map(([label, value]) => (
            <Box key={label} sx={{ display: 'contents' }}>
              <Typography component="dt">{label}</Typography>
              <Typography component="dd">{value}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      <Dialog open={confirmOpen} onClose={() => !toggling && setConfirmOpen(false)}>
        <DialogTitle>Araç pasif yapılsın mı?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {formatPlate(vehicle.plate)} yeni rota planlarında seçilemeyecek. Bu araçla hazırlanmış mevcut planlar
            silinmez, araç bilgisiyle birlikte görünmeye devam eder.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={toggling}>
            Vazgeç
          </Button>
          <Button
            color="warning"
            variant="contained"
            disabled={toggling}
            startIcon={toggling ? <CircularProgress size={18} color="inherit" /> : undefined}
            onClick={() => setActive(false)}
          >
            Pasif yap
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
