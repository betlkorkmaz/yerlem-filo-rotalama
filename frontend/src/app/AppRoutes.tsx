import { Navigate, Route, Routes } from 'react-router';
import { AppLayout } from './AppLayout';
import { VehicleListPage } from '../features/fleet/pages/VehicleListPage';
import { VehicleCreatePage } from '../features/fleet/pages/VehicleCreatePage';
import { VehicleDetailPage } from '../features/fleet/pages/VehicleDetailPage';
import { VehicleEditPage } from '../features/fleet/pages/VehicleEditPage';
import { RoutePlanListPage } from '../features/routing/pages/RoutePlanListPage';
import { NotFoundPage } from '../shared/components/NotFoundPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/vehicles" replace />} />
        <Route path="vehicles" element={<VehicleListPage />} />
        <Route path="vehicles/new" element={<VehicleCreatePage />} />
        <Route path="vehicles/:id" element={<VehicleDetailPage />} />
        <Route path="vehicles/:id/edit" element={<VehicleEditPage />} />
        <Route path="routes" element={<RoutePlanListPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
