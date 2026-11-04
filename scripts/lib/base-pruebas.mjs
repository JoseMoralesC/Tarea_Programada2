import sql from 'mssql';
import {randomBytes} from 'node:crypto';
import {readFile} from 'node:fs/promises';

// Cada ejecución crea su propia base; nunca sustituye la base configurada.
export async function conBasePruebas(config, conDatos, probar) {
    const nombre = `TP2_Pruebas_${Date.now()}_${randomBytes(4).toString('hex')}`;
    if (!/^TP2_Pruebas_\d+_[a-f0-9]{8}$/.test(nombre) || nombre === config.db.database) {
        throw new Error('El nombre de la copia de pruebas no es válido');
    }
    const credenciales = {user: process.env.DB_SETUP_USER, password: process.env.DB_SETUP_PASSWORD};
    if (!credenciales.user || !credenciales.password) throw new Error('Completar las credenciales DB_SETUP');
    const conexion = {...config.db, ...credenciales, connectionTimeout: 10000, requestTimeout: 60000};
    const master = await new sql.ConnectionPool({...conexion, database: 'master'}).connect();
    let creada = false;
    let pool;
    try {
        await master.request().query(`CREATE DATABASE [${nombre}]`);
        creada = true;
        pool = await new sql.ConnectionPool({...conexion, database: nombre}).connect();
        const archivo = await readFile(new URL('../../db/RepuestosAutomotrices.sql', import.meta.url), 'utf8');
        const lotes = archivo.split(/^\s*GO\s*$/mi);
        for (const lote of lotes) {
            if (!lote.trim() || /^\s*USE\s+/i.test(lote)) continue;
            if (!conDatos && /^\s*(?:SET IDENTITY_INSERT|INSERT \[dbo\])/i.test(lote)) continue;
            await pool.request().batch(lote);
        }
        console.log(`Copia ${conDatos ? 'con datos restaurada' : 'vacía preparada'}: ${nombre}`);
        await probar({nombre, pool, archivo});
    } finally {
        await pool?.close();
        if (creada) {
            // Solo borramos la base cuyo CREATE de esta ejecución terminó bien.
            await master.request().query(`DROP DATABASE [${nombre}]`);
            console.log(`Copia de pruebas eliminada: ${nombre}`);
        }
        await master.close();
    }
}
