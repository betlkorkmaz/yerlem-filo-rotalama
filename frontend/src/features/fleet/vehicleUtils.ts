import type { Vehicle, VehicleType } from '../../api/vehicles';

export const vehicleTypeLabels: Record<VehicleType, string> = {
  bus: 'Otobüs',
  midibus: 'Midibüs',
  minibus: 'Minibüs',
  van: 'Panelvan',
};

// Backend ile aynı kural: boşluklar atılır, harfler büyütülür.
export const normalizePlate = (raw: string) => raw.replace(/\s+/g, '').toUpperCase();

export const PLATE_PATTERN = /^(0[1-9]|[1-7]\d|8[01])[A-Z]{1,3}\d{2,4}$/;

// "34ABC123" → "34 ABC 123". Veritabanında boşluksuz saklanan plaka okunur biçimde gösterilir.
export function formatPlate(plate: string): string {
  const match = /^(\d{2})([A-Z]{1,3})(\d{2,4})$/.exec(plate);
  return match ? `${match[1]} ${match[2]} ${match[3]}` : plate;
}

export type StatusFilter = 'all' | 'active' | 'inactive';

// Filo boyutu küçük olduğundan (yüzlerce araç mertebesi) liste bir kez çekilip istemcide filtrelenir.
// Böylece rotalama da aynı listeyi kullanır ve her tuş vuruşunda sunucuya gidilmez.
// Filo büyürse backend'deki ?search=&status= parametrelerine geçmek yeterli.
export function filterVehicles(vehicles: Vehicle[], search: string, status: StatusFilter): Vehicle[] {
  const text = search.trim().toLocaleLowerCase('tr');
  const plateText = normalizePlate(search);
  return vehicles.filter((v) => {
    if (status === 'active' && !v.isActive) return false;
    if (status === 'inactive' && v.isActive) return false;
    if (!text) return true;
    return v.name.toLocaleLowerCase('tr').includes(text) || v.plate.includes(plateText);
  });
}

const dateFormatter = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
export const formatDateTime = (iso: string) => dateFormatter.format(new Date(iso));
