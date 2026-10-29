import {sql} from '../db.js';
import {poolAutorizado} from '../auth/contexto.js';
import {validarId, validarTexto, validarCambios, ejecutarSP} from './validacion.js';

export const typeDefs = `#graphql
    type Aseguradora {
        IdAseguradora: Int!, IdUsuario: Int!, CedulaJuridica: String!, Nombre: String!, Telefono: String, Correo: String
    }
    input AseguradoraInput {
        idUsuario: Int!, cedulaJuridica: String!, nombre: String!, telefono: String, correo: String
    }
    input AseguradoraCambios { idUsuario: Int, cedulaJuridica: String, nombre: String, telefono: String, correo: String }
    extend type Query { aseguradoras(idAseguradora: Int): [Aseguradora!]! }
    extend type Mutation {
        agregarAseguradora(datos: AseguradoraInput!): Int!
        modificarAseguradora(idAseguradora: Int!, datos: AseguradoraCambios!): Boolean!
        borrarAseguradora(idAseguradora: Int!): Boolean!
    }
`;

function parametros(request, datos, modificar = false) {
    if (datos.idUsuario !== undefined) request.input('IdUsuario', sql.Int, validarId(datos.idUsuario, 'idUsuario'));
    for (const [campo, parametro, tipo, longitud, nullable] of [
        ['cedulaJuridica', 'CedulaJuridica', sql.VarChar, 20, false],
        ['nombre', 'Nombre', sql.NVarChar, 100, false],
        ['telefono', 'Telefono', sql.VarChar, 15, true], ['correo', 'Correo', sql.VarChar, 100, true],
    ]) {
        if (datos[campo] !== undefined) {
            request.input(parametro, tipo(longitud), validarTexto(datos[campo], campo, longitud, nullable));
        }
    }
    if (modificar) {
        request.input('CambiarTelefono', sql.Bit, datos.telefono !== undefined);
        request.input('CambiarCorreo', sql.Bit, datos.correo !== undefined);
    }
    return request;
}

export const resolvers = {
    Query: {
        aseguradoras: async (_, {idAseguradora}, contexto) => {
            const pool = await poolAutorizado(contexto, ['ADMINISTRADOR', 'EMPLEADO', 'CLIENTE']);
            if (idAseguradora != null) validarId(idAseguradora, 'idAseguradora');
            const request = pool.request().input('IdAseguradora', sql.Int, idAseguradora ?? null)
                .input('IdUsuario', sql.Int, contexto.identidad.rol === 'CLIENTE' ? contexto.identidad.idUsuario : null);
            return (await ejecutarSP(request, 'dbo.ConsultarAseguradoras')).recordset;
        },
    },
    Mutation: {
        agregarAseguradora: async (_, {datos}, contexto) => {
            const pool = await poolAutorizado(contexto, ['ADMINISTRADOR']);
            const resultado = await ejecutarSP(parametros(pool.request().input('function', sql.Int, 1), datos), 'dbo.MantenimientoAseguradora');
            return resultado.recordset[0].IdAseguradora;
        },
        modificarAseguradora: async (_, {idAseguradora, datos}, contexto) => {
            const pool = await poolAutorizado(contexto, ['ADMINISTRADOR']);
            validarId(idAseguradora, 'idAseguradora');
            validarCambios(datos, ['idUsuario', 'cedulaJuridica', 'nombre', 'telefono', 'correo']);
            await ejecutarSP(parametros(pool.request().input('function', sql.Int, 2)
                .input('IdAseguradora', sql.Int, idAseguradora), datos, true), 'dbo.MantenimientoAseguradora');
            return true;
        },
        borrarAseguradora: async (_, {idAseguradora}, contexto) => {
            const pool = await poolAutorizado(contexto, ['ADMINISTRADOR']);
            validarId(idAseguradora, 'idAseguradora');
            await ejecutarSP(pool.request().input('function', sql.Int, 3)
                .input('IdAseguradora', sql.Int, idAseguradora), 'dbo.MantenimientoAseguradora');
            return true;
        },
    },
};
