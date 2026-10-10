import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Alert, Button, Typography, useMediaQuery, useTheme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { useShallow } from 'zustand/react/shallow';
import { PageHeader } from '../../../shared/components/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../../shared/components/StateViews';
import { useVehicleStore } from '../store/useVehicleStore';
import { filterVehicles, type StatusFilter } from '../vehicleUtils';
import { VehicleFilters } from '../components/VehicleFilters';
import { VehicleTable } from '../components/VehicleTable';
import { VehicleCardList } from '../components/VehicleCardList';
import { FleetStats } from '../components/FleetStats';

const STATUS_VALUES: StatusFilter[] = ['all', 'active', 'inactive'];

export function VehicleListPage() {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down('md'));

  // Filtreler adres çubuğunda tutulur: sayfa yenilense veya geri gelinse de korunur, link paylaşılabilir.
  // Bu yüzden store'a konmadı; store sadece sunucu verisini tutar.
  const [params, setParams] = useSearchParams();
  const search = params.get('q') ?? '';
  const statusParam = params.get('status') as StatusFilter | null;
  const status = statusParam && STATUS_VALUES.includes(statusParam) ? statusParam : 'all';

  const updateParam = (key: string, value: string, defaultValue: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === defaultValue) next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true },
    );

  const { vehicles, listStatus, listError, fetchVehicles } = useVehicleStore(
    useShallow((s) => ({
      vehicles: s.vehicles,
      listStatus: s.listStatus,
      listError: s.listError,
      fetchVehicles: s.fetchVehicles,
    })),
  );

  // Sayfa her açıldığında güncel liste istenir; elde veri varsa beklerken o gösterilir.
  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const filtered = useMemo(() => filterVehicles(vehicles, search, status), [vehicles, search, status]);
  const hasFilters = search !== '' || status !== 'all';
  const firstLoad = listStatus !== 'success' && listStatus !== 'error' && vehicles.length === 0;

  const newVehicleButton = (
    <Button component={Link} to="/vehicles/new" variant="contained" startIcon={<AddIcon />}>
      Yeni araç
    </Button>
  );

  const renderContent = () => {
    if (firstLoad) return <LoadingState label="Araçlar yükleniyor" />;

    if (listStatus === 'error' && vehicles.length === 0) {
      return (
        <ErrorState
          title="Araçlar yüklenemedi"
          message={listError?.message ?? 'Bilinmeyen hata.'}
          onRetry={fetchVehicles}
        />
      );
    }

    if (vehicles.length === 0) {
      return (
        <EmptyState
          icon={<LocalShippingIcon />}
          title="Henüz araç eklenmemiş"
          description="Filoya ilk aracı ekleyerek başlayın. Eklenen araçlar rota planlarında seçilebilir."
          action={newVehicleButton}
        />
      );
    }

    if (filtered.length === 0) {
      return (
        <EmptyState
          icon={<SearchOffIcon />}
          title="Sonuç bulunamadı"
          description="Aramanızla veya seçtiğiniz durumla eşleşen araç yok."
          action={
            <Button variant="outlined" onClick={() => setParams({}, { replace: true })}>
              Filtreleri temizle
            </Button>
          }
        />
      );
    }

    return isCompact ? <VehicleCardList vehicles={filtered} /> : <VehicleTable vehicles={filtered} />;
  };

  return (
    <>
      <PageHeader title="Araçlar" subtitle="Filo ve rotalama aynı araç listesini kullanır." actions={newVehicleButton} />

      {vehicles.length > 0 && <FleetStats vehicles={vehicles} />}

      <VehicleFilters
        search={search}
        status={status}
        onSearchChange={(v) => updateParam('q', v, '')}
        onStatusChange={(v) => updateParam('status', v, 'all')}
      />

      {/* Elde eski liste varken yenileme başarısız olursa liste gizlenmez, uyarı gösterilir. */}
      {listStatus === 'error' && vehicles.length > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" onClick={fetchVehicles}>
              Tekrar dene
            </Button>
          }
        >
          Liste güncellenemedi, son yüklenen veriler gösteriliyor. {listError?.message}
        </Alert>
      )}

      {!firstLoad && vehicles.length > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }} role="status" aria-live="polite">
          {hasFilters ? `${vehicles.length} araçtan ${filtered.length} tanesi gösteriliyor` : `${vehicles.length} araç`}
        </Typography>
      )}

      {renderContent()}
    </>
  );
}
