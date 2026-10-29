import {GraphQLError} from 'graphql';

export function entradaInvalida(mensaje) {
    return new GraphQLError(mensaje, {extensions: {code: 'BAD_USER_INPUT'}});
}

export function validarId(valor, campo) {
    if (!Number.isInteger(valor) || valor < 1 || valor > 2147483647) {
        throw entradaInvalida(`${campo} debe ser un entero positivo`);
    }
    return valor;
}

export function validarTexto(valor, campo, limite, nullable = false) {
    if (nullable && valor === null) return null;
    if (typeof valor !== 'string' || !valor.trim() || valor.length > limite) {
        throw entradaInvalida(`${campo} debe contener entre 1 y ${limite} caracteres`);
    }
    return valor;
}

export function validarCambios(args, campos) {
    if (!campos.some(campo => args[campo] !== undefined)) {
        throw entradaInvalida('Debes indicar al menos un campo para modificar');
    }
}

export async function ejecutarSP(request, procedimiento) {
    try {
        return await request.execute(procedimiento);
    } catch (error) {
        const numeros = [error, ...(error.precedingErrors ?? [])]
            .map(detalle => detalle.number ?? detalle.originalError?.info?.number);
        if (numeros.includes(51101)) {
            throw new GraphQLError('El registro no existe', {extensions: {code: 'NOT_FOUND'}});
        }
        if (numeros.some(numero => [51100, 51102, 8152, 2628, 8115].includes(numero))) {
            throw entradaInvalida('Los datos no cumplen el contrato de la operación');
        }
        if (numeros.some(numero => [547, 2601, 2627, 50042, 51103, 1205].includes(numero))
            || (['dbo.MantenimientoDetalleVenta', 'dbo.MantenimientoEmpleado', 'dbo.MantenimientoAseguradora'].includes(procedimiento)
                && numeros.some(numero => [50000, 3609].includes(numero)))) {
            throw new GraphQLError('La operación entra en conflicto con datos existentes o relacionados', {
                extensions: {code: 'CONFLICT'},
            });
        }
        throw error;
    }
}
