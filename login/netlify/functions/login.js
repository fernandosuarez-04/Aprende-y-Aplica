const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const json = (status, data) => ({
  statusCode: status,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With, X-API-Key',
    'Access-Control-Allow-Methods': 'OPTIONS,POST',
  },
  body: JSON.stringify(data),
});

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });

  try {
    const { username, password } = JSON.parse(event.body || '{}');
    if (!username || !password) return json(400, { error: 'username y password son requeridos' });

    const { rows } = await pool.query(
      `SELECT id, username, password_hash
       FROM users
       WHERE lower(username) = lower($1)
       LIMIT 1`,
      [username]
    );

    const user = rows[0];
    if (!user) return json(401, { error: 'Credenciales inválidas' });

    const ok = await bcrypt.compare(password, user.password_hash || '');
    if (!ok) return json(401, { error: 'Credenciales inválidas' });

    return json(200, { ok: true, userId: user.id });
  } catch (e) {
    console.error('login error', e);
    return json(500, { error: 'Error interno' });
  }
};


