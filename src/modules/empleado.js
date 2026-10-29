import {sql} from '../db.js';
import {poolAutorizado} from '../auth/contexto.js';
import {validarId, validarTexto, validarCambios, ejecutarSP} from './validacion.js';

export const typeDefs = `#graphql
    type Empleado { IdEmpleado: Int!, IdUsuario: Int!, Cedula: String!, Nombre: String!, Puesto: String! }
    input EmpleadoInput { idUsuario: Int!, cedula: String!, nombre: String!, puesto: String! }
    input EmpleadoCambios { idUsuario: Int, cedula: String, nombre: String, puesto: String }
    extend type Query { empleados(idEmpleado: Int): [Empleado!]! }
    extend type Mutation {
        agregarEmpleado(datos: EmpleadoInput!): Int!
        modificarEmpleado(idEmpleado: Int!, datos: EmpleadoCambios!): Boolean!
        borrarEmpleado(idEmpleado: Int!): Boolean!
    }
`;

function parametros(request, datos) {
    if (datos.idUsuario !== undefined) request.input('IdUsuario', sql.Int, validarId(datos.idUsuario, 'idUsuario'));
    for (const [campo, parametro, tipo, longitud] of [
        ['cedula', 'Cedula', sql.VarChar, 20], ['nombre', 'Nombre', sql.NVarChar, 100],
        ['puesto', 'Puesto', sql.NVarChar, 50],
    ]) {
        if (datos[campo] !== undefined) request.input(parametro, tipo(longitud), validarTexto(datos[campo], campo, longitud));
    }
    return request;
}

export const resolvers = {
    Query: {
        empleados: async (_, {idEmpleado}, contexto) => {
            const pool = await poolAutorizado(contexto, ['ADMINISTRADOR', 'EMPLEADO']);
            if (idEmpleado != null) validarId(idEmpleado, 'idEmpleado');
            const request = pool.request().input('IdEmpleado', sql.Int, idEmpleado ?? null);
            // El SP limita también por usuario; un empleado no enumera perfiles ajenos.
            request.input('IdUsuario', sql.Int, contexto.identidad.rol === 'ADMINISTRADOR' ? null : contexto.identidad.idUsuario);
            return (await ejecutarSP(request, 'dbo.ConsultarEmpleados')).recordset;
        },
    },
    Mutation: {
        agregarEmpleado: async (_, {datos}, contexto) => {
            const pool = await poolAutorizado(contexto, ['ADMINISTRADOR']);
            const resultado = await ejecutarSP(parametros(pool.request().input('function', sql.Int, 1), datos), 'dbo.MantenimientoEmpleado');
            return resultado.recordset[0].IdEmpleado;
        },
        modificarEmpleado: async (_, {idEmpleado, datos}, contexto) => {
            const pool = await poolAutorizado(contexto, ['ADMINISTRADOR']);
            validarId(idEmpleado, 'idEmpleado');
            validarCambios(datos, ['idUsuario', 'cedula', 'nombre', 'puesto']);
            await ejecutarSP(parametros(pool.request().input('function', sql.Int, 2)
                .input('IdEmpleado', sql.Int, idEmpleado), datos), 'dbo.MantenimientoEmpleado');
            return true;
        },
        borrarEmpleado: async (_, {idEmpleado}, contexto) => {
            const pool = await poolAutorizado(contexto, ['ADMINISTRADOR']);
            validarId(idEmpleado, 'idEmpleado');
            await ejecutarSP(pool.request().input('function', sql.Int, 3)
                .input('IdEmpleado', sql.Int, idEmpleado), 'dbo.MantenimientoEmpleado');
            return true;
        },
    },
};
