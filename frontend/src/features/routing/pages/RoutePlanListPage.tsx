import { useEffect } from 'react';
import { Link } from 'react-router';
import { Alert, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import { useShallow } from 'zustand/react/shallow';
import { PageHeader } from '../../../shared/components/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../../shared/components/StateViews';
import { useRoutePlanStore } from '../store/useRoutePlanStore';
import { RoutePlanCardList } from '../components/RoutePlanCardList';

export function RoutePlanListPage() {
  const { plans, status, error, fetchPlans } = useRoutePlanStore(
    useShallow((s) => ({ plans: s.plans, status: s.status, error: s.error, fetchPlans: s.fetchPlans })),
  );

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const newPlanButton = (
    <Button component={Link} to="/routes/new" variant="contained" startIcon={<AddIcon />}>
      Yeni rota planı
    </Button>
  );

  const renderContent = () => {
    if (plans.length === 0 && (status === 'idle' || status === 'loading')) {
      return <LoadingState label="Rota planları yükleniyor" />;
    }
    if (plans.length === 0 && status === 'error') {
      return <ErrorState title="Planlar yüklenemedi" message={error?.message ?? ''} onRetry={fetchPlans} />;
    }
    if (plans.length === 0) {
      return (
        <EmptyState
          icon={<AltRouteIcon />}
          title="Henüz rota planı yok"
          description="Filodaki aktif araçlardan birini seçip duraklardan oluşan ilk planı hazırlayın."
          action={newPlanButton}
        />
      );
    }
    return <RoutePlanCardList plans={plans} />;
  };

  return (
    <>
      <PageHeader title="Rota Planları" subtitle="Taslak planlar, son güncellenen en üstte." actions={newPlanButton} />
      {status === 'error' && plans.length > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" onClick={fetchPlans}>
              Tekrar dene
            </Button>
          }
        >
          Liste güncellenemedi, son yüklenen veriler gösteriliyor.
        </Alert>
      )}
      {renderContent()}
    </>
  );
}
