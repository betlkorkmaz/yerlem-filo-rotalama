import { Link, useNavigate, useParams } from 'react-router';
import { Button } from '@mui/material';
import { PageHeader } from '../../../shared/components/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../../shared/components/StateViews';
import { useNotificationStore } from '../../../shared/store/useNotificationStore';
import { useVehicleStore } from '../store/useVehicleStore';
import { useVehicle } from '../hooks/useVehicle';
import { VehicleForm } from '../components/VehicleForm';
import { formatPlate } from '../vehicleUtils';

export function VehicleEditPage() {
  const { id = '' } = useParams();
  return <VehicleEdit key={id} id={id} />;
}

function VehicleEdit({ id }: { id: string }) {
  const navigate = useNavigate();
  const updateVehicle = useVehicleStore((s) => s.updateVehicle);
  const notify = useNotificationStore((s) => s.notify);
  const { vehicle, status, error, retry, notFound } = useVehicle(id);

  const header = <PageHeader title="Aracı düzenle" backTo={{ to: `/vehicles/${id}`, label: 'Araç detayı' }} />;

  // Form, güncel veri gelmeden açılmaz; aksi halde kullanıcı eski veriyi düzenleyip kaydedebilir.
  if (status === 'loading') return <>{header}<LoadingState label="Araç yükleniyor" rows={3} /></>;

  if (notFound) {
    return (
      <>
        {header}
        <EmptyState
          title="Araç bulunamadı"
          action={<Button component={Link} to="/vehicles" variant="contained">Araçlara dön</Button>}
        />
      </>
    );
  }

  if (status === 'error' || !vehicle) {
    return <>{header}<ErrorState message={error?.message ?? 'Araç yüklenemedi.'} onRetry={retry} /></>;
  }

  return (
    <>
      {header}
      <VehicleForm
        initialValues={{
          plate: formatPlate(vehicle.plate),
          name: vehicle.name,
          type: vehicle.type,
          capacity: String(vehicle.capacity),
          isActive: vehicle.isActive,
        }}
        submitLabel="Değişiklikleri kaydet"
        onCancel={() => navigate(`/vehicles/${id}`)}
        onSubmit={async (input) => {
          await updateVehicle(id, input);
          notify('Araç güncellendi.');
          navigate(`/vehicles/${id}`, { replace: true });
        }}
      />
    </>
  );
}
