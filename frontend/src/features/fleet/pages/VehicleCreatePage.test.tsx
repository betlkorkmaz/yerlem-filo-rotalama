import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockFetch, renderAt } from '../../../test/renderWithApp';
import { VehicleCreatePage } from './VehicleCreatePage';

// Kullanıcı akışı testi: ekranı kullanıcının gördüğü gibi (etiketler, butonlar) kullanarak
// yeni araç ekleme akışını uçtan uca dener. API çağrıları taklit edilir.

const savedVehicle = {
  id: '11111111-1111-4111-8111-111111111111',
  plate: '41AB5678',
  name: 'SRV-06',
  type: 'van',
  capacity: 12,
  isActive: true,
  createdAt: '2026-10-10T08:00:00.000Z',
  updatedAt: '2026-10-10T08:00:00.000Z',
};

const renderPage = () => renderAt('/vehicles/new', '/vehicles/new', <VehicleCreatePage />);

async function fillForm(user: ReturnType<typeof userEvent.setup>, plate: string) {
  await user.type(screen.getByLabelText(/Plaka/), plate);
  await user.type(screen.getByLabelText(/Ad \/ Kod/), 'SRV-06');
  await user.click(screen.getByLabelText(/Araç tipi/));
  await user.click(await screen.findByRole('option', { name: 'Panelvan' }));
  await user.type(screen.getByLabelText(/Yolcu kapasitesi/), '12');
}

describe('Yeni araç ekleme akışı', () => {
  it('boş form gönderilince her alanın altında hata gösterir ve sunucuya istek atmaz', async () => {
    const calls = mockFetch();
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Aracı kaydet' }));

    // Hata mesajı alanla ilişkili olmalı (aria-describedby): ekran okuyucu alana gelince okur.
    const plate = screen.getByLabelText(/Plaka/);
    expect(plate).toHaveAccessibleDescription('Plaka zorunludur.');
    expect(plate).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/Ad \/ Kod/)).toHaveAccessibleDescription('Ad/kod zorunludur.');
    expect(screen.getByLabelText(/Yolcu kapasitesi/)).toHaveAccessibleDescription('Kapasite zorunludur.');
    // İmleç ilk hatalı alana gider.
    expect(plate).toHaveFocus();
    expect(calls).toHaveLength(0);
  });

  it('sunucu plakayı reddederse (409) mesajı plaka alanının altında gösterir, girilen veriyi korur', async () => {
    mockFetch({
      status: 409,
      body: { error: { code: 'PLATE_TAKEN', message: 'Bu plaka zaten kayıtlı.', details: { field: 'plate' } } },
    });
    const user = userEvent.setup();
    renderPage();

    await fillForm(user, '34 abc 123');
    await user.click(screen.getByRole('button', { name: 'Aracı kaydet' }));

    const plate = screen.getByLabelText(/Plaka/);
    await waitFor(() => expect(plate).toHaveAccessibleDescription('Bu plaka zaten kayıtlı.'));
    expect(plate).toHaveValue('34 abc 123');
    expect(screen.getByRole('button', { name: 'Aracı kaydet' })).toBeEnabled();
  });

  it('başarılı kayıtta doğru veriyi gönderir ve aracın detay sayfasına yönlendirir', async () => {
    const calls = mockFetch({ status: 201, body: savedVehicle });
    const user = userEvent.setup();
    renderPage();

    await fillForm(user, ' 41 ab 5678 ');
    await user.click(screen.getByRole('button', { name: 'Aracı kaydet' }));

    expect(await screen.findByTestId('current-path')).toHaveTextContent(`/vehicles/${savedVehicle.id}`);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('/api/vehicles');
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      plate: ' 41 ab 5678 ', // normalizasyon sunucunun işi; istemci kullanıcının yazdığını gönderir
      name: 'SRV-06',
      type: 'van',
      capacity: 12,
      isActive: true,
    });
    expect(await screen.findByText('41 AB 5678 plakalı araç eklendi.')).toBeInTheDocument();
  });

  it('kaydet butonuna art arda basılsa da tek istek gönderir', async () => {
    const calls = mockFetch({ status: 201, body: savedVehicle });
    const user = userEvent.setup();
    renderPage();

    await fillForm(user, '41 AB 5678');
    const button = screen.getByRole('button', { name: 'Aracı kaydet' });
    await user.dblClick(button);

    await screen.findByTestId('current-path');
    expect(calls).toHaveLength(1);
  });
});
