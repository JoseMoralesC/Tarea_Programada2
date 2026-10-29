// Node carga .env mediante --env-file antes de importar este módulo.
function requerida(env, nombre) {
    const valor = env[nombre];
    if (!valor?.trim()) {
        throw new Error(`Falta la variable ${nombre} en el .env`);
    }
    return valor;
}

function puerto(env, nombre, predeterminado) {
    const valor = env[nombre] ?? predeterminado;
    if (!/^\d+$/.test(valor ?? '')) {
        throw new Error(`${nombre} debe ser un puerto entero entre 1 y 65535`);
    }
    const numero = Number(valor);
    if (!Number.isInteger(numero) || numero < 1 || numero > 65535) {
        throw new Error(`${nombre} debe ser un puerto entero entre 1 y 65535`);
    }
    return numero;
}

function booleano(env, nombre, predeterminado) {
    const valor = env[nombre] ?? predeterminado;
    if (valor !== 'true' && valor !== 'false') {
        throw new Error(`${nombre} debe ser true o false`);
    }
    return valor === 'true';
}

export function cargarConfig(env = process.env) {
    const genericoHabilitado = booleano(env, 'DB_GENERIC_ENABLED', 'false');
    const rolLogin = env.DB_LOGIN_ROLE ?? 'cliente';
    if (!['cliente', 'generico'].includes(rolLogin)
        || (rolLogin === 'generico' && !genericoHabilitado)) {
        throw new Error('DB_LOGIN_ROLE debe ser cliente o generico (si está habilitado)');
    }
    const credenciales = (prefijo) => ({
        user: requerida(env, `${prefijo}_USER`),
        password: requerida(env, `${prefijo}_PASSWORD`),
    });
    const roles = {
        cliente: credenciales('DB_CLIENT'),
        empleado: credenciales('DB_EMPLOYEE'),
    };
    if (genericoHabilitado) roles.generico = credenciales('DB_GENERIC');
    if (new Set(Object.values(roles).map(({user}) => user.trim().toLowerCase())).size
        !== Object.keys(roles).length) {
        throw new Error('Cada rol debe utilizar una identidad SQL distinta');
    }
    return {
        puerto: puerto(env, 'PORT', '4000'),
        db: {
            server: requerida(env, 'DB_SERVER'),
            port: puerto(env, 'DB_PORT'),
            database: requerida(env, 'DB_DATABASE'),
            options: {
                encrypt: booleano(env, 'DB_ENCRYPT'),
                trustServerCertificate: booleano(env, 'DB_TRUST_SERVER_CERTIFICATE'),
            },
        },
        roles,
        rolLogin,
        genericoHabilitado,
    };
}
