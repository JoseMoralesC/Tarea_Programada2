import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Ejecutar con node --env-file=.env scripts/dependencias-db.mjs diagnostico|aplicar|validar
// Usa sqlcmd instalado; no necesita paquetes npm ni expone contraseñas en argumentos.
const mode = process.argv[2];
if (!['diagnostico', 'aplicar', 'validar'].includes(mode)) {
  console.error('Uso: node --env-file=.env scripts/dependencias-db.mjs diagnostico|aplicar|validar');
  process.exit(1);
}
const env = process.env;
for (const key of ['DB_SERVER', 'DB_PORT', 'DB_DATABASE']) {
  if (!env[key]?.trim()) throw new Error(`Falta ${key} en .env.`);
}
const port = Number(env.DB_PORT);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('DB_PORT debe ser un puerto TCP válido.');
}
function booleanOption(key) {
  if (!['true', 'false'].includes(env[key])) {
    throw new Error(`${key} debe ser true o false.`);
  }
  return env[key] === 'true';
}
const encrypt = booleanOption('DB_ENCRYPT');
const trust = booleanOption('DB_TRUST_SERVER_CERTIFICATE');
const auth = env.DB_SETUP_AUTH ?? 'sql';
const args = ['-S', `tcp:${env.DB_SERVER},${port}`, '-d', env.DB_DATABASE,
  '-b', '-r', '1', '-l', '10', '-t', '60', '-w', '240', '-W', '-f', '65001'];
const childEnv = { ...env };
delete childEnv.SQLCMDPASSWORD;
if (auth === 'integrated') {
  args.push('-E');
} else if (auth === 'sql') {
  if (!env.DB_SETUP_USER?.trim() || !env.DB_SETUP_PASSWORD) {
    console.error('Completar DB_SETUP_USER y DB_SETUP_PASSWORD localmente en .env. No se ejecutó SQL.');
    process.exit(1);
  }
  args.push('-U', env.DB_SETUP_USER);
  childEnv.SQLCMDPASSWORD = env.DB_SETUP_PASSWORD;
} else {
  throw new Error('DB_SETUP_AUTH debe ser sql o integrated.');
}
if (encrypt) args.push('-N');
if (trust) args.push('-C');
const root = fileURLToPath(new URL('../', import.meta.url));
const files = {
  diagnostico: 'diagnostico_dependencias.sql',
  aplicar: 'completar_dependencias.sql',
  validar: 'validar_dependencias.sql',
};
const file = path.join(root, 'sql', files[mode]);
args.push('-i', file);
const defaultSqlcmd = process.platform === 'win32'
  ? 'C:\\Program Files\\Microsoft SQL Server\\Client SDK\\ODBC\\180\\Tools\\Binn\\SQLCMD.EXE'
  : 'sqlcmd';
const executable = existsSync(defaultSqlcmd) ? defaultSqlcmd : 'sqlcmd';
console.log(`${mode}: ${env.DB_SERVER}:${port} / ${env.DB_DATABASE}. Sin cargas de datos.`);
const result = spawnSync(executable, args, { env: childEnv, encoding: 'utf8', windowsHide: true });
function redact(value = '') {
  let output = value;
  for (const [key, secret] of Object.entries(env)) {
    if (/PASSWORD|SECRET|TOKEN/i.test(key) && secret) output = output.split(secret).join('[OCULTO]');
  }
  return output;
}
if (result.stdout) process.stdout.write(redact(result.stdout));
if (result.stderr) process.stderr.write(redact(result.stderr));
if (result.error) {
  console.error(redact(result.error.message));
  process.exit(1);
}
process.exit(result.status ?? 1);
