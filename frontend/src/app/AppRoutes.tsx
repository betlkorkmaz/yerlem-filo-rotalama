import { Navigate, Route, Routes } from 'react-router';
import { AppLayout } from './AppLayout';
import { VehicleListPage } from '../features/fleet/pages/VehicleListPage';
import { RoutePlanListPage } from '../features/routing/pages/RoutePlanListPage';
import { NotFoundPage } from '../shared/components/NotFoundPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/vehicles" replace />} />
        <Route path="vehicles" element={<VehicleListPage />} />
        <Route path="routes" element={<RoutePlanListPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
