import {GraphQLScalarType, GraphQLError, Kind} from 'graphql';

const invalido = mensaje => new GraphQLError(mensaje, {extensions: {code: 'BAD_USER_INPUT'}});

export function normalizarDinero(valor) {
    // Las entradas monetarias son cadenas: no se redondean importes del cliente.
    if (typeof valor !== 'string' || !/^\d{1,10}(\.\d{1,2})?$/.test(valor)) {
        throw invalido('Dinero debe ser una cadena no negativa con hasta dos decimales');
    }
    const [entero, fraccion = ''] = valor.split('.');
    return `${BigInt(entero)}.${fraccion.padEnd(2, '0')}`;
}

export function fechaHora(valor) {
    if (typeof valor !== 'string') throw invalido('FechaHora requiere una fecha ISO con zona horaria');
    const partes = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(valor);
    if (!partes) throw invalido('FechaHora requiere una fecha ISO con zona horaria');
    const [, y, m, d, h, min, s, zona] = partes;
    const anio = Number(y), mes = Number(m), dia = Number(d);
    const dias = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
    const fecha = new Date(valor);
    const zonaValida = zona === 'Z' || (Number(zona.slice(1, 3)) <= 14
        && Number(zona.slice(4)) < 60 && (Number(zona.slice(1, 3)) !== 14 || zona.slice(4) === '00'));
    if (anio < 1753 || anio > 9999 || mes < 1 || mes > 12 || dia < 1 || dia > dias
        || Number(h) > 23 || Number(min) > 59 || Number(s) > 59 || !zonaValida
        || !Number.isFinite(fecha.getTime()) || fecha.getUTCFullYear() < 1753
        || fecha.getTime() > Date.parse('9999-12-31T23:59:59.997Z')) {
        throw invalido('FechaHora no es una fecha válida para SQL datetime');
    }
    return fecha;
}

export const Dinero = new GraphQLScalarType({
    name: 'Dinero',
    description: 'Importe no negativo, enviado como cadena decimal con hasta dos decimales.',
    parseValue: normalizarDinero,
    parseLiteral(ast) {
        if (ast.kind !== Kind.STRING) throw invalido('Dinero debe enviarse como cadena');
        return normalizarDinero(ast.value);
    },
    serialize(valor) {
        return normalizarDinero(typeof valor === 'number' ? valor.toFixed(2) : valor);
    },
});

export const FechaHora = new GraphQLScalarType({
    name: 'FechaHora',
    description: 'Fecha ISO 8601 con zona horaria explícita, normalizada a UTC.',
    parseValue: fechaHora,
    parseLiteral(ast) {
        if (ast.kind !== Kind.STRING) throw invalido('FechaHora debe enviarse como cadena');
        return fechaHora(ast.value);
    },
    serialize(valor) {
        return (valor instanceof Date ? fechaHora(valor.toISOString()) : fechaHora(valor)).toISOString();
    },
});

export const typeDefs = `#graphql
    scalar Dinero
    scalar FechaHora
    enum EstadoCaso { ABIERTO EN_PROCESO CERRADO RECHAZADO }
    enum EstadoCotizacion { PENDIENTE APROBADA RECHAZADA }
    enum EstadoDetalleCotizacion { PENDIENTE APROBADO RECHAZADO }
    enum EstadoEnvio { PENDIENTE EN_CAMINO ENTREGADO }
    enum AccionAuditoria { INSERTAR MODIFICAR BORRAR }
`;

export const resolvers = {
    Dinero, FechaHora,
    EstadoCaso: {ABIERTO: 'Abierto', EN_PROCESO: 'En proceso', CERRADO: 'Cerrado', RECHAZADO: 'Rechazado'},
    EstadoCotizacion: {PENDIENTE: 'Pendiente', APROBADA: 'Aprobada', RECHAZADA: 'Rechazada'},
    EstadoDetalleCotizacion: {PENDIENTE: 'Pendiente', APROBADO: 'Aprobado', RECHAZADO: 'Rechazado'},
    EstadoEnvio: {PENDIENTE: 'Pendiente', EN_CAMINO: 'En camino', ENTREGADO: 'Entregado'},
    AccionAuditoria: {INSERTAR: 'I', MODIFICAR: 'U', BORRAR: 'D'},
};
