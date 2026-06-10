export function formatCurrency(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(value || 0);
}

export function escapeHTML(str) {
  if (!str) return '';
  // React sanitiza de manera nativa, pero conservamos la firma
  return str;
}
