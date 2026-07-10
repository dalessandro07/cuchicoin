const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

const TURSO_URL = process.env.TURSO_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_AUTH_TOKEN) {
  console.error('Error: TURSO_URL y TURSO_AUTH_TOKEN deben estar en .env');
  process.exit(1);
}

async function push() {
  const turso = createClient({
    url: TURSO_URL,
    authToken: TURSO_AUTH_TOKEN,
  });

  const drizzleDir = path.join(__dirname, '..', 'drizzle');
  const files = fs
    .readdirSync(drizzleDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No hay archivos de migracion en drizzle/');
    turso.close();
    return;
  }

  console.log(`Aplicando ${files.length} migraciones a Turso Cloud...`);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(drizzleDir, file), 'utf-8');
    const statements = sql
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter(Boolean);

    if (statements.length === 0) continue;

    try {
      if (statements.length === 1) {
        await turso.execute(statements[0]);
      } else {
        await turso.batch(statements, 'write');
      }
      console.log(`  [${file}] OK (${statements.length} statements)`);
    } catch (err) {
      console.error(`  [${file}] ERROR:`, err.message);
    }
  }

  turso.close();
  console.log('Schema aplicado a Turso Cloud.');
}

push().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
