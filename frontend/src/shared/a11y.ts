// Görsel olarak gizli ama ekran okuyucunun okuduğu metin (ör. ikon sütununun başlığı).
// Ölçüler bilerek '1px' metni: MUI sx içinde sayı olarak 1 yazmak "%100" anlamına gelir ve
// görünmez kutu sayfayı yatayda taşırır.
export const visuallyHidden = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
  padding: 0,
  border: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
} as const;
