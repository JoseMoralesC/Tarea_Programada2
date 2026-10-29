import {GraphQLError} from 'graphql';

const rolesConexion = {
    ADMINISTRADOR: 'empleado',
    EMPLEADO: 'empleado',
    CLIENTE: 'cliente',
};

export function crearContexto({sesiones, obtenerPool, genericoHabilitado = false}) {
    return async ({req}) => {
        const cabecera = req.headers.authorization;
        let token = null;
        let identidad = null;
        if (cabecera !== undefined) {
            const coincidencia = typeof cabecera === 'string'
                && /^Bearer ([a-f0-9]{64})$/i.exec(cabecera);
            if (coincidencia) {
                token = coincidencia[1];
                identidad = sesiones.obtener(token);
            }
            if (!identidad) {
                throw new GraphQLError('Sesión inválida o vencida', {
                    extensions: {code: 'UNAUTHENTICATED'},
                });
            }
        }
        // Ni headers de rol ni argumentos GraphQL deciden la conexión.
        return {
            identidad,
            token,
            genericoHabilitado,
            revocarSesionesUsuario: (idUsuario) => sesiones.revocarUsuario(idUsuario),
            obtenerPool: () => obtenerPool(identidad ? rolesConexion[identidad.rol] : 'generico'),
        };
    };
}

export function poolAutorizado(contexto, rolesPermitidos, permitirGenerico = false) {
    if (!contexto?.identidad) {
        if (permitirGenerico && contexto?.genericoHabilitado) return contexto.obtenerPool();
        throw new GraphQLError('Debes iniciar sesión', {extensions: {code: 'UNAUTHENTICATED'}});
    }
    if (!rolesPermitidos.includes(contexto.identidad.rol)) {
        throw new GraphQLError('No tienes permiso para esta operación', {
            extensions: {code: 'FORBIDDEN'},
        });
    }
    return contexto.obtenerPool();
}
