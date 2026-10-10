import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import RouteIcon from '@mui/icons-material/Route';
import SaveIcon from '@mui/icons-material/Save';
import PlaceIcon from '@mui/icons-material/Place';
import { useShallow } from 'zustand/react/shallow';
import { ApiError, type FieldErrors } from '../../../api/client';
import * as routePlansApi from '../../../api/routePlans';
import { PageHeader } from '../../../shared/components/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../../shared/components/StateViews';
import { useNotificationStore } from '../../../shared/store/useNotificationStore';
import { useVehicleStore } from '../../fleet/store/useVehicleStore';
import { formatPlate, vehicleTypeLabels } from '../../fleet/vehicleUtils';
import { useRouteEditorStore } from '../store/useRouteEditorStore';
import { RouteMap } from '../components/RouteMap';
import { RouteSummary } from '../components/RouteSummary';
import { StopListEditor } from '../components/StopListEditor';
import {
  mappableStops,
  stopFieldId,
  toStopInput,
  validateCoordinates,
  validatePlan,
  type StopField,
} from '../routeUtils';

type LoadState = 'loading' | 'ready' | 'notFound' | 'error';

export function RoutePlanEditorPage() {
  const { id } = useParams();
  // key: /routes/new ile /routes/:id arasında geçişte düzenleyici sıfırdan kurulur.
  return <RoutePlanEditor key={id ?? 'new'} planId={id ?? null} />;
}

function RoutePlanEditor({ planId }: { planId: string | null }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const notify = useNotificationStore((s) => s.notify);

  const editor = useRouteEditorStore(
    useShallow((s) => ({
      name: s.name,
      vehicleId: s.vehicleId,
      stops: s.stops,
      route: s.route,
      clientRequestId: s.clientRequestId,
    })),
  );
  const actions = useRouteEditorStore(
    useShallow((s) => ({
      startNew: s.startNew,
      loadPlan: s.loadPlan,
      setName: s.setName,
      setVehicleId: s.setVehicleId,
      addStop: s.addStop,
      updateStop: s.updateStop,
      removeStop: s.removeStop,
      moveStop: s.moveStop,
      setRoute: s.setRoute,
      markSaved: s.markSaved,
    })),
  );

  // Araçlar filonun ortak store'undan okunur; rotalama kendi araç listesini tutmaz.
  const { vehicles, vehiclesStatus, fetchVehicles } = useVehicleStore(
    useShallow((s) => ({ vehicles: s.vehicles, vehiclesStatus: s.listStatus, fetchVehicles: s.fetchVehicles })),
  );

  // Yeni planda düzenleyici ilk çizimden önce sıfırlanır; önceki ziyaretten kalan taslak bir an bile görünmesin.
  const [loadState, setLoadState] = useState<LoadState>(() => {
    if (planId) return 'loading';
    useRouteEditorStore.getState().startNew();
    return 'ready';
  });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [offRoadIndex, setOffRoadIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  // Ekran açıldığında araçların güncel hali istenir: başka yerde pasif yapılmış olabilir.
  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  useEffect(() => {
    if (!planId) return;
    const controller = new AbortController();
    routePlansApi.getRoutePlan(planId, controller.signal).then(
      (plan) => {
        actions.loadPlan(plan);
        setLoadState('ready');
      },
      (err: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(err instanceof ApiError ? err.message : 'Plan yüklenemedi.');
        setLoadState(err instanceof ApiError && err.status === 404 ? 'notFound' : 'error');
      },
    );
    return () => controller.abort();
  }, [planId, actions]);

  const selectedVehicle = vehicles.find((v) => v.id === editor.vehicleId);
  // Seçim listesinde yalnızca aktif araçlar var. Mevcut plan pasif bir araca bağlıysa o araç da
  // listede görünür ama seçilemez; kullanıcı neden kaydedemeyeceğini görür.
  const vehicleOptions = useMemo(
    () => vehicles.filter((v) => v.isActive || v.id === editor.vehicleId),
    [vehicles, editor.vehicleId],
  );
  const mapStops = useMemo(() => mappableStops(editor.stops), [editor.stops]);

  const clearStopErrors = () => {
    setOffRoadIndex(null);
    setCalcError(null);
  };

  const focusField = (fieldErrors: FieldErrors) => {
    const first = Object.keys(fieldErrors)[0];
    if (!first) return;
    const match = /^stops\.(\d+)\.(name|latitude|longitude|location)$/.exec(first);
    // Konum hiç seçilmemişse imleç o durağın adres arama kutusuna gider.
    const field = match?.[2] === 'location' ? 'search' : (match?.[2] as StopField);
    const id = match ? stopFieldId(Number(match[1]), field) : `plan-${first}`;
    document.getElementById(id)?.focus();
  };

  // Haritaya dokunulunca koordinatı boş olan ilk durak doldurulur; hepsi doluysa bitişten önce yeni durak eklenir.
  const handleMapClick = (lat: number, lng: number) => {
    const coords = { latitude: lat.toFixed(6), longitude: lng.toFixed(6) };
    const empty = editor.stops.findIndex((s) => !s.latitude.trim() && !s.longitude.trim());
    if (empty >= 0) {
      const stop = editor.stops[empty];
      actions.updateStop(stop.key, { ...coords, name: stop.name || `Durak ${empty + 1}` });
    } else {
      actions.addStop({ ...coords, name: `Durak ${editor.stops.length}` });
    }
    clearStopErrors();
  };

  const handleCalculate = async () => {
    const coordErrors = validateCoordinates(editor.stops);
    setErrors(coordErrors);
    if (Object.keys(coordErrors).length > 0) {
      setCalcError('Rota hesabı için tüm durakların konumu seçilmiş ve geçerli olmalı.');
      focusField(coordErrors);
      return;
    }
    setCalculating(true);
    clearStopErrors();
    try {
      const route = await routePlansApi.calculateRoute(editor.stops.map(toStopInput));
      actions.setRoute(route);
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      // Servis kaynaklı hatalarda kullanıcıya verisinin güvende olduğu ve ne yapabileceği söylenir.
      const serviceDown = !apiError || apiError.status === 0 || apiError.status >= 500;
      setCalcError(
        `${apiError?.message ?? 'Rota hesaplanamadı.'}${
          serviceDown ? ' Duraklarınız korunuyor; tekrar deneyebilir veya planı rotasız taslak olarak kaydedebilirsiniz.' : ''
        }`,
      );
      const stopIndex = (apiError?.details as { stopIndex?: number } | undefined)?.stopIndex;
      if (typeof stopIndex === 'number') setOffRoadIndex(stopIndex);
    } finally {
      setCalculating(false);
    }
  };

  const handleSave = async () => {
    if (savingRef.current) return;
    const clientErrors = validatePlan(editor);
    setErrors(clientErrors);
    setFormError(null);
    if (Object.keys(clientErrors).length > 0) {
      setFormError('Kaydetmeden önce işaretli alanları düzeltin.');
      focusField(clientErrors);
      return;
    }

    const input: routePlansApi.RoutePlanInput = {
      name: editor.name.trim(),
      vehicleId: editor.vehicleId,
      stops: editor.stops.map(toStopInput),
      distanceM: editor.route?.distanceM ?? null,
      durationS: editor.route?.durationS ?? null,
      geometry: editor.route?.geometry ?? null,
    };

    savingRef.current = true;
    setSaving(true);
    try {
      const saved = planId
        ? await routePlansApi.updateRoutePlan(planId, input)
        : await routePlansApi.createRoutePlan(input, editor.clientRequestId);
      actions.markSaved(saved);
      notify(planId ? 'Rota planı güncellendi.' : 'Rota planı taslak olarak kaydedildi.');
      navigate('/routes', { replace: !planId });
      // Başarıda kilit açılmaz: sayfa yönlenirken gelen ikinci tıklama yeni istek göndermesin.
    } catch (err) {
      savingRef.current = false;
      setSaving(false);
      const apiError = err instanceof ApiError ? err : null;
      // Araç bu ekran açıkken başka yerde pasif yapılmış: listeyi tazele ki seçim kutusu da güncellensin.
      // Girilen duraklar store'da durduğu için kaybolmaz.
      if (apiError?.code === 'VEHICLE_INACTIVE' || apiError?.code === 'VEHICLE_NOT_FOUND') fetchVehicles();
      if (apiError && Object.keys(apiError.fieldErrors).length > 0) {
        setErrors(apiError.fieldErrors);
        focusField(apiError.fieldErrors);
      }
      setFormError(apiError?.message ?? 'Plan kaydedilemedi.');
    }
  };

  const busy = saving || calculating;
  const title = planId ? 'Rota planını düzenle' : 'Yeni rota planı';
  const backTo = { to: '/routes', label: 'Rota planları' };

  if (loadState === 'loading') {
    return <><PageHeader title={title} backTo={backTo} /><LoadingState label="Plan yükleniyor" rows={3} /></>;
  }
  if (loadState === 'notFound') {
    return (
      <>
        <PageHeader title={title} backTo={backTo} />
        <EmptyState title="Rota planı bulunamadı" action={<Button component={Link} to="/routes" variant="contained">Planlara dön</Button>} />
      </>
    );
  }
  if (loadState === 'error') {
    return <><PageHeader title={title} backTo={backTo} /><ErrorState message={loadError ?? ''} onRetry={() => window.location.reload()} /></>;
  }

  const actionButtons = (
    <>
      <Button
        variant="outlined"
        onClick={handleCalculate}
        disabled={busy}
        startIcon={calculating ? <CircularProgress size={18} color="inherit" /> : <RouteIcon />}
      >
        {calculating ? 'Hesaplanıyor…' : 'Rotayı hesapla'}
      </Button>
      <Button
        variant="contained"
        onClick={handleSave}
        disabled={busy}
        startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
      >
        {saving ? 'Kaydediliyor…' : 'Kaydet'}
      </Button>
    </>
  );

  return (
    <Box sx={{ pb: isMobile ? 9 : 0 }}>
      <PageHeader title={title} backTo={backTo} actions={isMobile ? undefined : actionButtons} />

      {formError && (
        <Alert severity="error" role="alert" sx={{ mb: 2 }}>
          {formError}
        </Alert>
      )}

      {/* Masaüstü: solda form, sağda sabit harita. Mobil: plan bilgisi → harita ve özet → duraklar. */}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 5fr) minmax(0, 7fr)' },
          gridTemplateAreas: { xs: '"info" "map" "stops"', md: '"info map" "stops map"' },
          alignItems: 'start',
        }}
      >
        <Paper variant="outlined" sx={{ gridArea: 'info', p: 2 }}>
          <Stack spacing={2}>
            <TextField
              id="plan-name"
              label="Plan adı"
              placeholder="ör. Kadıköy – Levent Sabah Servisi"
              value={editor.name}
              onChange={(e) => actions.setName(e.target.value)}
              error={Boolean(errors.name)}
              helperText={errors.name}
              disabled={saving}
              required
              fullWidth
              slotProps={{ htmlInput: { maxLength: 100 } }}
            />
            <TextField
              id="plan-vehicleId"
              select
              label="Araç"
              value={vehicleOptions.some((v) => v.id === editor.vehicleId) ? editor.vehicleId : ''}
              onChange={(e) => actions.setVehicleId(e.target.value)}
              error={Boolean(errors.vehicleId)}
              helperText={
                errors.vehicleId ??
                (vehiclesStatus === 'error' ? 'Araç listesi yüklenemedi.' : 'Yalnızca aktif araçlar seçilebilir.')
              }
              disabled={saving}
              required
              fullWidth
            >
              {vehicleOptions.length === 0 && (
                <MenuItem disabled value="">
                  {vehiclesStatus === 'loading' ? 'Araçlar yükleniyor…' : 'Aktif araç yok'}
                </MenuItem>
              )}
              {vehicleOptions.map((v) => (
                <MenuItem key={v.id} value={v.id} disabled={!v.isActive}>
                  {formatPlate(v.plate)} · {v.name} · {vehicleTypeLabels[v.type]} ({v.capacity} kişi)
                  {!v.isActive && ' · Pasif'}
                </MenuItem>
              ))}
            </TextField>
            {selectedVehicle && !selectedVehicle.isActive && (
              <Alert severity="warning">
                Seçili araç ({formatPlate(selectedVehicle.plate)}) pasif yapılmış. Plan görüntülenebilir; kaydetmek için
                aktif bir araç seçin.
              </Alert>
            )}
          </Stack>
        </Paper>

        <Stack spacing={2} sx={{ gridArea: 'map', position: { md: 'sticky' }, top: { md: 80 } }}>
          <RouteSummary route={editor.route} stopCount={editor.stops.length} calculating={calculating} error={calcError} />
          <RouteMap
            stops={mapStops}
            totalStops={editor.stops.length}
            geometry={editor.route?.geometry ?? null}
            onMapClick={saving ? undefined : handleMapClick}
          />
          <Typography variant="body2" color="text.secondary">
            Haritaya dokunduğunuzda konumu boş olan ilk durak doldurulur; hepsi doluysa bitişten önce yeni durak eklenir.
          </Typography>
        </Stack>

        <Paper variant="outlined" sx={{ gridArea: 'stops', p: 2 }}>
          <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
            Duraklar
          </Typography>
          {/* Kullanıcının koordinat bilmesi beklenmez; koordinat alanları en son seçenektir. */}
          <Alert severity="info" icon={<PlaceIcon />} sx={{ mb: 2 }}>
            Durakların konumunu üç yoldan belirleyebilirsiniz: <strong>adres arayın</strong>,{' '}
            <strong>haritaya dokunun</strong> ya da enlem/boylamı elle girin.
          </Alert>
          <StopListEditor
            stops={editor.stops}
            errors={errors}
            highlightIndex={offRoadIndex}
            disabled={saving}
            onChange={(key, patch) => {
              actions.updateStop(key, patch);
              clearStopErrors();
            }}
            onMove={(key, dir) => {
              actions.moveStop(key, dir);
              clearStopErrors();
            }}
            onRemove={(key) => {
              actions.removeStop(key);
              clearStopErrors();
            }}
            onAdd={() => actions.addStop()}
            onSelectPlace={(key, place) => {
              actions.updateStop(key, {
                name: place.name,
                latitude: place.latitude.toFixed(6),
                longitude: place.longitude.toFixed(6),
              });
              clearStopErrors();
            }}
          />
        </Paper>
      </Box>

      {/* Mobilde kritik eylemler her zaman görünür: alt menünün hemen üstünde sabit çubuk. */}
      {isMobile && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 56,
            p: 1.5,
            display: 'flex',
            gap: 1,
            zIndex: (t) => t.zIndex.appBar,
            '& > *': { flex: 1 },
          }}
        >
          {actionButtons}
        </Paper>
      )}
    </Box>
  );
}
