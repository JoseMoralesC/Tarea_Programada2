import {GraphQLError} from 'graphql';
import {sql} from '../db.js';
import {poolAutorizado} from '../auth/contexto.js';
import {validarId, validarTexto, validarCambios, entradaInvalida, ejecutarSP} from './validacion.js';
import {normalizarDinero} from '../graphql/scalars.js';

export const campoId = parametro => ({parametro, tipo: sql.Int, validar: validarId});
export const campoTexto = (parametro, limite, unicode = false) => ({
    parametro, tipo: (unicode ? sql.NVarChar : sql.VarChar)(limite),
    validar: (v, c) => validarTexto(v, c, limite),
});
export const campoFecha = (parametro, nullable = false) => ({
    parametro, tipo: sql.DateTime, nullable,
    indicador: nullable ? `Cambiar${parametro}` : undefined,
    validar(v, c) {
        if (!(v instanceof Date) || !Number.isFinite(v.getTime())) throw entradaInvalida(`${c} requiere FechaHora`);
        return v;
    },
});
export const campoDinero = parametro => ({
    parametro, tipo: sql.Decimal(10, 2),
    validar(v, c) {
        const normalizado = normalizarDinero(v);
        if (normalizado.split('.')[0].length > 8) throw entradaInvalida(`${c} excede decimal(10,2)`);
        return normalizado;
    },
});
export const campoEstado = (parametro, valores, longitud = 15) => ({
    parametro, tipo: longitud === 1 ? sql.Char(1) : sql.VarChar(longitud),
    validar(v, c) {
        if (!valores.includes(v)) throw entradaInvalida(`${c} no es válido`);
        return v;
    },
});

// Los nombres y descriptores son constantes de los módulos, nunca entradas del cliente.
export function crearCrudNegocio({nombre, consulta, id, campos, filtros = {}, administrativo = false, autoria = false}) {
    const idArgumento = id[0].toLowerCase() + id.slice(1);
    const lectura = administrativo ? ['ADMINISTRADOR'] : ['ADMINISTRADOR', 'EMPLEADO', 'CLIENTE'];
    const escritura = administrativo ? ['ADMINISTRADOR'] : ['ADMINISTRADOR', 'EMPLEADO'];

    async function preparar(pool, selector, datos, contexto, identificador) {
        datos = {...datos};
        if (selector === 2) validarCambios(datos, Object.keys(campos));
        if (autoria) {
            if (contexto.identidad.rol === 'EMPLEADO' && datos.idEmpleado !== undefined
                && datos.idEmpleado !== contexto.identidad.idEmpleado) {
                throw new GraphQLError('No puedes asignar otro empleado', {extensions: {code: 'FORBIDDEN'}});
            }
            if (selector === 1 && datos.idEmpleado === undefined) datos.idEmpleado = contexto.identidad.idEmpleado;
        }
        const request = pool.request().input('function', sql.Int, selector);
        if (identificador !== undefined) request.input(id, sql.Int, validarId(identificador, idArgumento));
        for (const [campo, descriptor] of Object.entries(campos)) {
            const valor = datos[campo];
            if (valor !== undefined) {
                request.input(descriptor.parametro, descriptor.tipo,
                    descriptor.nullable && valor === null ? null : descriptor.validar(valor, campo));
            }
            if (selector === 2 && descriptor.indicador) {
                request.input(descriptor.indicador, sql.Bit, valor !== undefined);
            }
        }
        return request;
    }

    return {
        Query: {
            [consulta]: async (_, args, contexto) => {
                const pool = await poolAutorizado(contexto, lectura);
                const request = pool.request();
                for (const [argumento, descriptor] of Object.entries({[idArgumento]: campoId(id), ...filtros})) {
                    const valor = args[argumento];
                    request.input(descriptor.parametro, descriptor.tipo,
                        valor == null ? null : descriptor.validar(valor, argumento));
                }
                if (!administrativo) request.input('IdUsuario', sql.Int,
                    contexto.identidad.rol === 'CLIENTE' ? contexto.identidad.idUsuario : null);
                return (await ejecutarSP(request, `dbo.Consultar${consulta[0].toUpperCase() + consulta.slice(1)}`)).recordset;
            },
        },
        Mutation: {
            [`agregar${nombre}`]: async (_, {datos}, contexto) => {
                const pool = await poolAutorizado(contexto, escritura);
                const request = await preparar(pool, 1, datos, contexto);
                const resultado = await ejecutarSP(request, `dbo.Mantenimiento${nombre}`);
                return resultado.recordset[0][id];
            },
            [`modificar${nombre}`]: async (_, args, contexto) => {
                const pool = await poolAutorizado(contexto, escritura);
                const request = await preparar(pool, 2, args.datos, contexto, args[idArgumento]);
                await ejecutarSP(request, `dbo.Mantenimiento${nombre}`);
                return true;
            },
            [`borrar${nombre}`]: async (_, args, contexto) => {
                const pool = await poolAutorizado(contexto, escritura);
                const request = pool.request().input('function', sql.Int, 3)
                    .input(id, sql.Int, validarId(args[idArgumento], idArgumento));
                await ejecutarSP(request, `dbo.Mantenimiento${nombre}`);
                return true;
            },
        },
    };
}
