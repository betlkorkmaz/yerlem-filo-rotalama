// Görsel olarak gizli ama ekran okuyucunun okuduğu metin (ör. ikon sütununun başlığı).
export const visuallyHidden = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
} as const;
