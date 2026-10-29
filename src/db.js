import sql from 'mssql';

// Cada rol tiene su instancia; nunca se usa el pool global de mssql.
export function crearGestorPools(config, ConnectionPool = sql.ConnectionPool) {
    const conexiones = new Map();
    let cierre;

    function obtenerPool(rol) {
        if (cierre) return Promise.reject(new Error('Las conexiones se están cerrando'));
        if (!Object.hasOwn(config.roles, rol)) {
            return Promise.reject(new Error('Rol SQL no configurado'));
        }
        if (!conexiones.has(rol)) {
            const pool = new ConnectionPool({
                ...config.db,
                options: {...config.db.options},
                ...config.roles[rol],
            });
            pool.on('error', () => console.error(`Error en la conexión SQL del rol ${rol}`));
            const conexion = Promise.resolve().then(() => pool.connect()).then(() => pool)
                .catch(async (error) => {
                    conexiones.delete(rol);
                    await pool.close().catch(() => {});
                    throw error;
                });
            conexiones.set(rol, conexion);
        }
        return conexiones.get(rol);
    }

    function cerrarPools() {
        cierre ??= Promise.allSettled([...conexiones.values()].map(async (conexion) => {
            const pool = await conexion;
            await pool.close();
        })).then(() => conexiones.clear());
        return cierre;
    }

    return {obtenerPool, cerrarPools};
}

export {sql};
