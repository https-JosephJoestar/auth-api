import { DatabaseSync } from 'node:sqlite';

// Abre (o crea) la base de datos y se asegura de que exista la tabla de usuarios.
// Para los tests se usa ':memory:' y así cada prueba arranca con una base limpia.
export function createDb(file = 'data.db') {
  const db = new DatabaseSync(file);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  return db;
}
