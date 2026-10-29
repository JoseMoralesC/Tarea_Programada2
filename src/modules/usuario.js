import {GraphQLError} from 'graphql';
import {sql} from '../db.js';
import {poolAutorizado} from '../auth/contexto.js';
import {validarId, validarTexto, validarCambios, entradaInvalida, ejecutarSP} from './validacion.js';
import {generarHashClave} from '../auth/claves.js';

export const typeDefs = `#graphql
    type Usuario { IdUsuario: Int!, IdRol: Int!, Correo: String!, Activo: Boolean! }
    input UsuarioInput { idRol: Int!, correo: String!, clave: String!, activo: Boolean = true }
    input UsuarioCambios { idRol: Int, correo: String, activo: Boolean, clave: String }
    extend type Query { usuarios(idUsuario: Int): [Usuario!]! }
    extend type Mutation {
        agregarUsuario(datos: UsuarioInput!): Int!
        modificarUsuario(idUsuario: Int!, datos: UsuarioCambios!): Boolean!
        borrarUsuario(idUsuario: Int!): Boolean!
    }
`;

async function parametros(request, datos) {
    if (datos.idRol !== undefined) request.input('IdRol', sql.Int, validarId(datos.idRol, 'idRol'));
    if (datos.correo !== undefined) request.input('Correo', sql.VarChar(100), validarTexto(datos.correo, 'correo', 100));
    if (datos.activo !== undefined) {
        if (typeof datos.activo !== 'boolean') throw entradaInvalida('activo debe ser true o false');
        request.input('Activo', sql.Bit, datos.activo);
    }
    if (datos.clave !== undefined) {
        request.input('Contrasena', sql.VarChar(255), await generarHashClave(datos.clave));
    }
    return request;
}

export const resolvers = {
    Query: {
        usuarios: async (_, {idUsuario}, contexto) => {
            const pool = await poolAutorizado(contexto, ['ADMINISTRADOR', 'EMPLEADO', 'CLIENTE']);
            if (idUsuario != null) validarId(idUsuario, 'idUsuario');
            if (contexto.identidad.rol !== 'ADMINISTRADOR') {
                if (idUsuario != null && idUsuario !== contexto.identidad.idUsuario) {
                    throw new GraphQLError('Solo puedes consultar tu usuario', {extensions: {code: 'FORBIDDEN'}});
                }
                idUsuario = contexto.identidad.idUsuario;
            }
            const resultado = await ejecutarSP(pool.request().input('IdUsuario', sql.Int, idUsuario ?? null), 'dbo.ConsultarUsuarios');
            return resultado.recordset;
        },
    },
    Mutation: {
        agregarUsuario: async (_, {datos}, contexto) => {
            const pool = await poolAutorizado(contexto, ['ADMINISTRADOR']);
            const request = await parametros(pool.request().input('function', sql.Int, 1), datos);
            const resultado = await ejecutarSP(request, 'dbo.MantenimientoUsuario');
            return resultado.recordset[0].IdUsuario;
        },
        modificarUsuario: async (_, {idUsuario, datos}, contexto) => {
            const pool = await poolAutorizado(contexto, ['ADMINISTRADOR']);
            validarId(idUsuario, 'idUsuario');
            validarCambios(datos, ['idRol', 'correo', 'activo', 'clave']);
            const request = pool.request().input('function', sql.Int, 2).input('IdUsuario', sql.Int, idUsuario);
            await parametros(request, datos);
            await ejecutarSP(request, 'dbo.MantenimientoUsuario');
            contexto.revocarSesionesUsuario(idUsuario);
            return true;
        },
        borrarUsuario: async (_, {idUsuario}, contexto) => {
            const pool = await poolAutorizado(contexto, ['ADMINISTRADOR']);
            validarId(idUsuario, 'idUsuario');
            await ejecutarSP(pool.request().input('function', sql.Int, 3)
                .input('IdUsuario', sql.Int, idUsuario), 'dbo.MantenimientoUsuario');
            contexto.revocarSesionesUsuario(idUsuario);
            return true;
        },
    },
};
