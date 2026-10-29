// Prueba de solo lectura: no autentica cuentas ni consulta hashes almacenados.
import assert from 'node:assert/strict';
import sql from 'mssql';
import {generarHashClave} from '../src/auth/claves.js';

const env = process.env;
let pool;
try {
    for (const nombre of ['DB_SERVER', 'DB_PORT', 'DB_DATABASE', 'DB_SETUP_USER', 'DB_SETUP_PASSWORD']) {
        if (!env[nombre]?.trim()) throw new Error(`Falta ${nombre}`);
    }
    if ((env.DB_SETUP_AUTH ?? 'sql') !== 'sql') {
        throw new Error('Esta comprobación con mssql requiere DB_SETUP_AUTH=sql');
    }
    for (const nombre of ['DB_ENCRYPT', 'DB_TRUST_SERVER_CERTIFICATE']) {
        if (!['true', 'false'].includes(env[nombre])) throw new Error(`${nombre} debe ser true o false`);
    }
    const port = Number(env.DB_PORT);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('DB_PORT inválido');
    const clave = '__VerificacionTecnica_Contraseña_🔧__';
    const hash = await generarHashClave(clave);
    pool = await new sql.ConnectionPool({
        server: env.DB_SERVER, port, database: env.DB_DATABASE,
        user: env.DB_SETUP_USER, password: env.DB_SETUP_PASSWORD,
        connectionTimeout: 10000, requestTimeout: 15000,
        options: {
            encrypt: env.DB_ENCRYPT === 'true',
            trustServerCertificate: env.DB_TRUST_SERVER_CERTIFICATE === 'true',
        },
    }).connect();
    const resultado = await pool.request()
        .input('Clave', sql.NVarChar(256), clave)
        .input('Incorrecta', sql.NVarChar(256), '__ClaveDistinta__')
        .input('Hash', sql.VarChar(255), hash)
        .query('SELECT dbo.VerificarClave(@Clave, @Hash) AS Correcta, dbo.VerificarClave(@Incorrecta, @Hash) AS Incorrecta');
    assert.equal(resultado.recordset[0].Correcta, true);
    assert.equal(resultado.recordset[0].Incorrecta, false);
    console.log('Compatibilidad CLR confirmada: clave correcta aceptada e incorrecta rechazada. Sin modificar datos.');
} catch (error) {
    let mensaje = error.message;
    for (const [nombre, valor] of Object.entries(env)) {
        if (/PASSWORD|TOKEN|SECRET/i.test(nombre) && valor) mensaje = mensaje.split(valor).join('[OCULTO]');
    }
    console.error(mensaje);
    process.exitCode = 1;
} finally {
    await pool?.close();
}
