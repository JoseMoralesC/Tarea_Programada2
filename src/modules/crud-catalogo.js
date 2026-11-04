import {GraphQLError} from 'graphql';
import {sql} from '../db.js';
import {autorizar} from '../auth/contexto.js';
import {entradaInvalida, ejecutarSP, validarCambios, validarId, validarTexto} from './validacion.js';
import {fechaHora} from '../graphql/scalars.js';

const argumento = nombre => nombre[0].toLowerCase() + nombre.slice(1);

function validar(valor, campo, regla) {
    if (valor === null) {
        if (regla.nullable) return null;
        throw entradaInvalida(`${campo} no admite NULL`);
    }
    switch (regla.tipo) {
        case 'id': return validarId(valor, campo);
        case 'texto': return validarTexto(valor, campo, regla.limite);
        case 'entero':
            if (!Number.isInteger(valor) || valor < (regla.minimo ?? 0) || valor > 2147483647) {
                throw entradaInvalida(`${campo} está fuera del rango permitido`);
            }
            return valor;
        case 'dinero':
            if (!Number.isFinite(valor) || valor < 0 || valor > 99999999.99
                || !/^\d+(\.\d{1,2})?$/.test(String(valor))) {
                throw entradaInvalida(`${campo} debe ser un importe no negativo con hasta dos decimales`);
            }
            return valor;
        case 'booleano':
            if (typeof valor !== 'boolean') throw entradaInvalida(`${campo} requiere verdadero o falso`);
            return valor;
        case 'estado':
            if (!regla.valores.includes(valor)) throw entradaInvalida(`${campo} no es válido`);
            return valor;
        case 'fecha': {
            const fecha = typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)
                ? new Date(`${valor}T00:00:00.000Z`) : new Date(NaN);
            if (!Number.isFinite(fecha.getTime()) || valor.slice(0, 4) === '0000'
                || fecha.toISOString().slice(0, 10) !== valor) {
                throw entradaInvalida(`${campo} debe ser una fecha válida AAAA-MM-DD`);
            }
            return fecha;
        }
        case 'fechaHora': return fechaHora(/^\d{4}-\d{2}-\d{2}$/.test(valor)
            ? `${valor}T00:00:00.000Z` : valor);
        default: throw new Error(`Regla desconocida: ${regla.tipo}`);
    }
}

function tipoSQL(regla) {
    switch (regla.tipo) {
        case 'id': case 'entero': return sql.Int;
        case 'texto': return (regla.unicode ? sql.NVarChar : sql.VarChar)(regla.limite);
        case 'dinero': return sql.Decimal(10, 2);
        case 'booleano': return sql.Bit;
        case 'estado': return sql.VarChar(regla.limite);
        case 'fecha': return sql.Date;
        case 'fechaHora': return sql.DateTime;
        default: throw new Error(`Tipo desconocido: ${regla.tipo}`);
    }
}

// Conservamos los argumentos de cada API y compartimos sus comprobaciones.
export function crearCrudCatalogo({nombre, consulta, campos, filtros = [], requeridos = [],
    ids = [`Id${nombre}`], publico = false, aliasId = false, autoria = false}) {
    const escritura = ['ADMINISTRADOR', 'EMPLEADO'];
    const lectura = publico ? [...escritura, 'CLIENTE'] : escritura;
    const mantenimiento = `Mantenimiento${nombre}`;

    function prepararDatos(args, selector, contexto) {
        const datos = {...args};
        if (selector === 2) validarCambios(datos, Object.keys(campos).map(argumento));
        if (autoria) {
            if (contexto.identidad.rol === 'EMPLEADO' && datos.idEmpleado !== undefined
                && datos.idEmpleado !== contexto.identidad.idEmpleado) {
                throw new GraphQLError('No puedes asignar otro empleado', {extensions: {code: 'FORBIDDEN'}});
            }
            if (selector === 1 && datos.idEmpleado === undefined) datos.idEmpleado = contexto.identidad.idEmpleado;
        }
        if (selector === 1) for (const nombre of requeridos) {
            if (datos[argumento(nombre)] === undefined) throw entradaInvalida(`Falta ${argumento(nombre)}`);
        }
        const valores = {};
        for (const [nombre, regla] of Object.entries(campos)) {
            if (datos[argumento(nombre)] !== undefined) {
                valores[nombre] = validar(datos[argumento(nombre)], argumento(nombre), regla);
            }
        }
        return valores;
    }

    async function mantener(args, contexto, selector) {
        // Autorizamos antes de validar y antes de abrir una conexión.
        autorizar(contexto, escritura);
        const valores = selector === 3 ? {} : prepararDatos(args, selector, contexto);
        const claves = {};
        if (selector !== 1 || ids.length > 1) for (const id of ids) {
            claves[id] = validarId(args[argumento(id)], argumento(id));
        }
        const pool = await contexto.obtenerPool();
        const request = pool.request().input('function', sql.Int, selector);
        for (const [id, valor] of Object.entries(claves)) request.input(id, sql.Int, valor);
        for (const [nombre, regla] of Object.entries(campos)) {
            if (Object.hasOwn(valores, nombre)) request.input(nombre, tipoSQL(regla), valores[nombre]);
            if (selector === 2 && regla.nullable) {
                request.input(`Cambiar${nombre}`, sql.Bit, Object.hasOwn(valores, nombre));
            }
        }
        const resultado = await ejecutarSP(request, mantenimiento);
        return selector === 1 && ids.length === 1 ? resultado.recordset[0][ids[0]] : true;
    }

    return {
        Query: {[consulta]: async (_, args, contexto) => {
            autorizar(contexto, lectura, publico);
            const valores = filtros.map(id => [id, args[argumento(id)] == null ? null
                : validarId(args[argumento(id)], argumento(id))]);
            const pool = await contexto.obtenerPool();
            const request = pool.request();
            for (const [id, valor] of valores) request.input(id, sql.Int, valor);
            const resultado = await ejecutarSP(request, `Consultar${consulta === 'repuestosModelos'
                ? 'RepuestoModelo' : consulta === 'detallesCompra' ? 'DetalleCompra'
                    : consulta[0].toUpperCase() + consulta.slice(1)}`);
            return resultado.recordset.map(fila => {
                const salida = {...fila};
                if (aliasId) salida[ids[0]] = fila.Id;
                for (const [campo, regla] of Object.entries(campos)) {
                    if (salida[campo] instanceof Date) salida[campo] = regla.tipo === 'fecha'
                        ? salida[campo].toISOString().slice(0, 10) : salida[campo].toISOString();
                }
                return salida;
            });
        }},
        Mutation: {
            [`agregar${nombre}`]: (_, args, contexto) => mantener(args, contexto, 1),
            [`modificar${nombre}`]: (_, args, contexto) => mantener(args, contexto, 2),
            [`borrar${nombre}`]: (_, args, contexto) => mantener(args, contexto, 3),
        },
    };
}
