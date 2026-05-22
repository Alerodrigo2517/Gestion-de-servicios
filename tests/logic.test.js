// Ejemplo de prueba unitaria para lógica pura

// Función de ejemplo (podrías importarla de otro archivo)
function calculateDiscount(price, discountPercentage) {
  if (price < 0 || discountPercentage < 0) throw new Error('Valores inválidos');
  return price - (price * (discountPercentage / 100));
}

describe('Lógica de Negocio: calculateDiscount', () => {
  test('Aplica correctamente un descuento del 20%', () => {
    expect(calculateDiscount(100, 20)).toBe(80);
  });

  test('Aplica un descuento del 0% manteniendo el precio original', () => {
    expect(calculateDiscount(50, 0)).toBe(50);
  });

  test('Lanza error si el precio es negativo', () => {
    expect(() => calculateDiscount(-50, 10)).toThrow('Valores inválidos');
  });
});
