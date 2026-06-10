// Ejemplo de prueba de integración (Mockeando la DB para uso local)
// En la vida real, usarías una BD SQLite en memoria, un mock de tu ORM, o testcontainers.

class MockDatabase {
  constructor() {
    this.connected = false;
  }
  connect() {
    this.connected = true;
    return Promise.resolve('Conectado');
  }
  getUser(id) {
    if (!this.connected) throw new Error('No hay conexión a la BD');
    return Promise.resolve({ id, nombre: 'Usuario Prueba' });
  }
}

describe('Integración con Base de Datos', () => {
  let db;

  // Se ejecuta antes de todas las pruebas en este bloque
  beforeAll(async () => {
    db = new MockDatabase();
    await db.connect();
  });

  test('La conexión a la BD se establece correctamente', () => {
    expect(db.connected).toBe(true);
  });

  test('Puede obtener un usuario por ID de la base de datos', async () => {
    const user = await db.getUser(1);
    expect(user.nombre).toBe('Usuario Prueba');
    expect(user.id).toBe(1);
  });
});
