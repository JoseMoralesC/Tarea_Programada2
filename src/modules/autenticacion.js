import {GraphQLError} from 'graphql';
import {sql} from '../db.js';

export const typeDefs = `#graphql
    enum RolAplicacion { ADMINISTRADOR EMPLEADO CLIENTE }
    type UsuarioSesion {
        idUsuario: Int!
        correo: String!
        nombre: String!
        rol: RolAplicacion!
        idEmpleado: Int
        idAseguradora: Int
    }
    type ResultadoLogin {
        token: String!
        expiraEn: String!
        usuario: UsuarioSesion!
    }
    type Query { sesion: UsuarioSesion }
    type Mutation {
        login(correo: String!, clave: String!): ResultadoLogin!
        cerrarSesion: Boolean!
    }
`;

const roles = {Administrador: 'ADMINISTRADOR', Empleado: 'EMPLEADO', Cliente: 'CLIENTE'};
const credencialesInvalidas = () => new GraphQLError('Credenciales inválidas', {
    extensions: {code: 'UNAUTHENTICATED'},
});

export function crearResolversAutenticacion({obtenerPool, rolLogin, sesiones}) {
    return {
        Query: {sesion: (_, __, contexto) => contexto.identidad},
        Mutation: {
            login: async (_, {correo, clave}) => {
                if (!correo.trim() || correo.length > 100 || !clave || clave.length > 256) {
                    throw new GraphQLError('Correo o clave fuera de los límites permitidos', {
                        extensions: {code: 'BAD_USER_INPUT'},
                    });
                }
                const pool = await obtenerPool(rolLogin);
                const resultado = await pool.request()
                    .input('Correo', sql.VarChar(100), correo.trim())
                    .input('Clave', sql.NVarChar(256), clave)
                    .output('Valido', sql.Bit)
                    .execute('dbo.LoginUsuario');
                const fila = resultado.recordset?.[0];
                if (![true, 1].includes(resultado.output?.Valido) || resultado.recordset?.length !== 1
                    || !Number.isInteger(fila?.IdUsuario) || fila.IdUsuario <= 0
                    || !Object.hasOwn(roles, fila?.Rol)) throw credencialesInvalidas();
                // Lista explícita: los hashes nunca salen del backend.
                const usuario = {
                    idUsuario: fila.IdUsuario,
                    correo: fila.Correo,
                    nombre: fila.Nombre,
                    rol: roles[fila.Rol],
                    idEmpleado: fila.IdEmpleado ?? null,
                    idAseguradora: fila.IdAseguradora ?? null,
                };
                return {...sesiones.crear(usuario), usuario};
            },
            cerrarSesion: (_, __, contexto) => {
                if (!contexto.identidad) throw credencialesInvalidas();
                return sesiones.revocar(contexto.token);
            },
        },
    };
}
