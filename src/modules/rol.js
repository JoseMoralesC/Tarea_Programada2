import {sql} from '../db.js';
import {poolAutorizado} from '../auth/contexto.js';
import {validarId, validarTexto, ejecutarSP} from './validacion.js';

export const typeDefs = `#graphql
    type Rol { IdRol: Int!, Nombre: String! }
    extend type Query { roles(idRol: Int): [Rol!]! }
    extend type Mutation {
        agregarRol(nombre: String!): Int!
        modificarRol(idRol: Int!, nombre: String!): Boolean!
        borrarRol(idRol: Int!): Boolean!
    }
`;

export const resolvers = {
    Query: {
        roles: async (_, {idRol}, contexto) => {
            const pool = await poolAutorizado(contexto, ['ADMINISTRADOR']);
            if (idRol != null) validarId(idRol, 'idRol');
            const resultado = await ejecutarSP(pool.request().input('IdRol', sql.Int, idRol ?? null), 'dbo.ConsultarRoles');
            return resultado.recordset;
        },
    },
    Mutation: {
        agregarRol: async (_, {nombre}, contexto) => {
            const pool = await poolAutorizado(contexto, ['ADMINISTRADOR']);
            validarTexto(nombre, 'nombre', 30);
            const resultado = await ejecutarSP(pool.request()
                .input('function', sql.Int, 1).input('Nombre', sql.VarChar(30), nombre), 'dbo.MantenimientoRol');
            return resultado.recordset[0].IdRol;
        },
        modificarRol: async (_, {idRol, nombre}, contexto) => {
            const pool = await poolAutorizado(contexto, ['ADMINISTRADOR']);
            validarId(idRol, 'idRol');
            validarTexto(nombre, 'nombre', 30);
            await ejecutarSP(pool.request().input('function', sql.Int, 2)
                .input('IdRol', sql.Int, idRol).input('Nombre', sql.VarChar(30), nombre), 'dbo.MantenimientoRol');
            return true;
        },
        borrarRol: async (_, {idRol}, contexto) => {
            const pool = await poolAutorizado(contexto, ['ADMINISTRADOR']);
            validarId(idRol, 'idRol');
            await ejecutarSP(pool.request().input('function', sql.Int, 3)
                .input('IdRol', sql.Int, idRol), 'dbo.MantenimientoRol');
            return true;
        },
    },
};
