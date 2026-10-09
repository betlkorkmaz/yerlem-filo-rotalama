import { useNavigate } from 'react-router';
import { PageHeader } from '../../../shared/components/PageHeader';
import { useNotificationStore } from '../../../shared/store/useNotificationStore';
import { useVehicleStore } from '../store/useVehicleStore';
import { VehicleForm } from '../components/VehicleForm';
import { emptyVehicleForm } from '../vehicleValidation';
import { formatPlate } from '../vehicleUtils';

export function VehicleCreatePage() {
  const navigate = useNavigate();
  const createVehicle = useVehicleStore((s) => s.createVehicle);
  const notify = useNotificationStore((s) => s.notify);

  return (
    <>
      <PageHeader title="Yeni araç" backTo={{ to: '/vehicles', label: 'Araçlar' }} />
      <VehicleForm
        initialValues={emptyVehicleForm}
        submitLabel="Aracı kaydet"
        onCancel={() => navigate('/vehicles')}
        onSubmit={async (input) => {
          const vehicle = await createVehicle(input);
          notify(`${formatPlate(vehicle.plate)} plakalı araç eklendi.`);
          // replace: geri tuşu kullanıcıyı tekrar boş forma (ve yinelenen kayıt riskine) götürmesin.
          navigate(`/vehicles/${vehicle.id}`, { replace: true });
        }}
      />
    </>
  );
}
