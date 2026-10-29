import test from 'node:test';
import assert from 'node:assert/strict';
import {crearServidor} from '../src/server.js';
import {crearSesiones} from '../src/auth/sesiones.js';
import {fechaHora, normalizarDinero} from '../src/graphql/scalars.js';

const fecha = new Date('2026-10-29T18:00:00.000Z');
const filas = {
    Casos: {IdCaso: 7, IdAseguradora: 77, IdModelo: 2, Placa: 'PRUEBA', Estado: 'Abierto', FechaApertura: fecha},
    Cotizaciones: {IdCotizacion: 7, IdCaso: 7, IdEmpleado: 42, Fecha: fecha, Estado: 'Pendiente', Total: 12.30},
    DetallesCotizacion: {IdDetalle: 7, IdCotizacion: 7, IdRepuesto: 3, Cantidad: 2, Precio: 6.15, Estado: 'Pendiente'},
    Ventas: {IdVenta: 7, IdCotizacion: 7, IdEmpleado: 42, Fecha: fecha, Total: 12.30},
    DetallesVenta: {IdDetalle: 7, IdVenta: 7, IdRepuesto: 3, IdBodega: 1, Cantidad: 2, Precio: 6.15, Costo: 3.10},
    Envios: {IdEnvio: 7, IdVenta: 7, Direccion: 'Dirección ficticia', Costo: 1.25, Estado: 'Pendiente', FechaEntrega: null},
    Auditorias: {IdAuditoria: 7, Tabla: 'Prueba', Accion: 'I', Usuario: 'ficticio', Fecha: fecha},
};

const casos = [
    {nombre: 'Caso', consulta: 'casos', pluralSP: 'Casos', id: 'idCaso', parametro: 'IdCaso', filtro: 'idAseguradora',
        campos: 'IdCaso IdAseguradora IdModelo Placa Estado FechaApertura',
        alta: '{idAseguradora:77,idModelo:2,placa:"PRUEBA",estado:ABIERTO}', cambio: '{estado:EN_PROCESO}'},
    {nombre: 'Cotizacion', consulta: 'cotizaciones', pluralSP: 'Cotizaciones', id: 'idCotizacion', parametro: 'IdCotizacion', filtro: 'idCaso',
        campos: 'IdCotizacion IdCaso IdEmpleado Fecha Estado Total',
        alta: '{idCaso:7,estado:PENDIENTE}', cambio: '{estado:APROBADA}'},
    {nombre: 'DetalleCotizacion', consulta: 'detallesCotizacion', pluralSP: 'DetallesCotizacion', id: 'idDetalle', parametro: 'IdDetalle', filtro: 'idCotizacion',
        campos: 'IdDetalle IdCotizacion IdRepuesto Cantidad Precio Estado',
        alta: '{idCotizacion:7,idRepuesto:3,cantidad:2,precio:"6.15",estado:PENDIENTE}', cambio: '{cantidad:3}'},
    {nombre: 'Venta', consulta: 'ventas', pluralSP: 'Ventas', id: 'idVenta', parametro: 'IdVenta', filtro: 'idCotizacion',
        campos: 'IdVenta IdCotizacion IdEmpleado Fecha Total', alta: '{idCotizacion:7}', cambio: '{idCotizacion:8}'},
    {nombre: 'DetalleVenta', consulta: 'detallesVenta', pluralSP: 'DetallesVenta', id: 'idDetalle', parametro: 'IdDetalle', filtro: 'idVenta',
        campos: 'IdDetalle IdVenta IdRepuesto IdBodega Cantidad Precio Costo',
        alta: '{idVenta:7,idRepuesto:3,idBodega:1,cantidad:2,precio:"6.15",costo:"3.10"}', cambio: '{cantidad:3}'},
    {nombre: 'Envio', consulta: 'envios', pluralSP: 'Envios', id: 'idEnvio', parametro: 'IdEnvio', filtro: 'idVenta',
        campos: 'IdEnvio IdVenta Direccion Costo Estado FechaEntrega',
        alta: '{idVenta:7,direccion:"Dirección ficticia",costo:"1.25",estado:PENDIENTE}', cambio: '{estado:EN_CAMINO}'},
    {nombre: 'Auditoria', consulta: 'auditorias', pluralSP: 'Auditorias', id: 'idAuditoria', parametro: 'IdAuditoria', filtro: 'tabla',
        campos: 'IdAuditoria Tabla Accion Usuario Fecha',
        alta: '{tabla:"Prueba",accion:INSERTAR,usuario:"ficticio"}', cambio: '{accion:MODIFICAR}'},
];

function entorno(t, {errorSQL, genericoHabilitado = false} = {}) {
    const llamadas = [];
    const sesiones = crearSesiones();
    const tokens = new Map();
    const {server, context} = crearServidor({sesiones, genericoHabilitado, obtenerPool: async rol => ({request() {
        const inputs = [];
        return {
            input(nombre, tipo, valor) {inputs.push({nombre, tipo, valor}); return this;},
            async execute(sp) {
                llamadas.push({sp, rol, inputs});
                if (errorSQL) throw Object.assign(new Error('Detalle SQL privado'), errorSQL);
                const plural = sp.replace('dbo.Consultar', '');
                return {recordset: [filas[plural] ?? {IdCaso: 7, IdCotizacion: 7, IdDetalle: 7, IdVenta: 7, IdEnvio: 7, IdAuditoria: 7}]};
            },
        };
    }})});
    t.after(() => server.stop());
    async function pedir(query, rol = 'ADMINISTRADOR', variables) {
        if (rol && !tokens.has(rol)) tokens.set(rol, sesiones.crear({idUsuario: 91, rol, idEmpleado: 42, idAseguradora: 77}).token);
        const contextValue = await context({req: {headers: rol ? {authorization: `Bearer ${tokens.get(rol)}`} : {}}});
        const resultado = await server.executeOperation({query, variables}, {contextValue});
        return resultado.body.singleResult;
    }
    return {pedir, llamadas};
}

test('las 28 operaciones nuevas se integran al esquema, parametrizan SP y devuelven sus contratos', async t => {
    const {pedir, llamadas} = entorno(t);
    for (const caso of casos) {
        const filtro = caso.filtro === 'tabla' ? 'tabla:"Prueba"' : `${caso.filtro}:7`;
        const consulta = await pedir(`{${caso.consulta}(${caso.id}:7,${filtro}){${caso.campos}}}`);
        assert.equal(consulta.errors, undefined, caso.consulta);
        assert.equal(llamadas.at(-1).sp, `dbo.Consultar${caso.pluralSP}`);
        assert.equal(llamadas.at(-1).inputs.find(p => p.nombre === caso.parametro).valor, 7);
        if (caso.nombre !== 'Auditoria') assert.equal(llamadas.at(-1).inputs.find(p => p.nombre === 'IdUsuario').valor, null);
        for (const [operacion, selector, argumentos] of [
            ['agregar', 1, `datos:${caso.alta}`], ['modificar', 2, `${caso.id}:7,datos:${caso.cambio}`], ['borrar', 3, `${caso.id}:7`],
        ]) {
            const resultado = await pedir(`mutation{${operacion}${caso.nombre}(${argumentos})}`);
            assert.equal(resultado.errors, undefined, `${operacion}${caso.nombre}`);
            assert.equal(Object.values(resultado.data)[0], selector === 1 ? 7 : true);
            const llamada = llamadas.at(-1);
            assert.equal(llamada.sp, `dbo.Mantenimiento${caso.nombre}`);
            assert.equal(llamada.rol, 'empleado');
            assert.equal(llamada.inputs.find(p => p.nombre === 'function').valor, selector);
            if (selector !== 1) assert.equal(llamada.inputs.find(p => p.nombre === caso.parametro).valor, 7);
            assert.ok(!llamada.inputs.some(p => p.nombre === 'Total'));
        }
    }
    assert.equal(llamadas.length, 28);
});

test('empleados gestionan las seis tablas de negocio y auditoría exige administrador', async t => {
    const {pedir, llamadas} = entorno(t);
    for (const caso of casos.slice(0, 6)) {
        for (const [op, args] of [['agregar', `datos:${caso.alta}`],
            ['modificar', `${caso.id}:7,datos:${caso.cambio}`], ['borrar', `${caso.id}:7`]]) {
            assert.equal((await pedir(`mutation{${op}${caso.nombre}(${args})}`, 'EMPLEADO')).errors, undefined);
        }
    }
    const antes = llamadas.length;
    for (const query of ['{auditorias{IdAuditoria}}',
        'mutation{agregarAuditoria(datos:{tabla:"Prueba",accion:INSERTAR,usuario:"ficticio"})}',
        'mutation{modificarAuditoria(idAuditoria:7,datos:{accion:BORRAR})}', 'mutation{borrarAuditoria(idAuditoria:7)}']) {
        assert.equal((await pedir(query, 'EMPLEADO')).errors[0].extensions.code, 'FORBIDDEN');
    }
    assert.equal(llamadas.length, antes);
});

test('clientes consultan las seis tablas con el usuario de la sesión y no ven costo interno', async t => {
    const {pedir, llamadas} = entorno(t);
    for (const caso of casos.slice(0, 6)) {
        const resultado = await pedir(`{${caso.consulta}(${caso.id}:999){${caso.campos}}}`, 'CLIENTE');
        assert.equal(resultado.errors, undefined);
        const llamada = llamadas.at(-1);
        assert.equal(llamada.rol, 'cliente');
        assert.equal(llamada.inputs.find(p => p.nombre === 'IdUsuario').valor, 91);
        assert.equal(llamada.inputs.find(p => p.nombre === caso.parametro).valor, 999);
        if (caso.nombre === 'DetalleVenta') assert.equal(resultado.data.detallesVenta[0].Costo, null);
    }
    assert.equal((await pedir('{auditorias{IdAuditoria}}', 'CLIENTE')).errors[0].extensions.code, 'FORBIDDEN');
    const resultado = await pedir('{detallesVenta{Precio Costo}}', 'EMPLEADO');
    assert.equal(resultado.data.detallesVenta[0].Costo, '3.10');
    assert.equal(resultado.data.detallesVenta[0].Precio, '6.15');
});

test('los clientes no pueden escribir ni suministrar un IdUsuario para cambiar el filtro', async t => {
    const {pedir, llamadas} = entorno(t);
    for (const caso of casos) {
        for (const [op, args] of [['agregar', `datos:${caso.alta}`], ['modificar', `${caso.id}:7,datos:${caso.cambio}`], ['borrar', `${caso.id}:7`]]) {
            assert.equal((await pedir(`mutation{${op}${caso.nombre}(${args})}`, 'CLIENTE')).errors[0].extensions.code, 'FORBIDDEN');
        }
    }
    const suplantada = await pedir('{casos(idUsuario:1){IdCaso}}', 'CLIENTE');
    assert.equal(suplantada.errors[0].extensions.code, 'GRAPHQL_VALIDATION_FAILED');
    assert.equal(llamadas.length, 0);
});

test('el acceso genérico no permite consultar ni modificar las tablas del lote B', async t => {
    const {pedir, llamadas} = entorno(t, {genericoHabilitado: true});
    for (const caso of casos) {
        assert.equal((await pedir(`{${caso.consulta}{${caso.campos}}}`, null)).errors[0].extensions.code, 'UNAUTHENTICATED');
        assert.equal((await pedir(`mutation{borrar${caso.nombre}(${caso.id}:7)}`, null)).errors[0].extensions.code, 'UNAUTHENTICATED');
    }
    assert.equal(llamadas.length, 0);
});

test('autoría de ventas y cotizaciones se obtiene del perfil y no se puede suplantar', async t => {
    const {pedir, llamadas} = entorno(t);
    for (const nombre of ['Venta', 'Cotizacion']) {
        const caso = casos.find(c => c.nombre === nombre);
        await pedir(`mutation{agregar${nombre}(datos:${caso.alta})}`, 'EMPLEADO');
        assert.equal(llamadas.at(-1).inputs.find(p => p.nombre === 'IdEmpleado').valor, 42);
        const id = caso.id;
        const ajeno = await pedir(`mutation{modificar${nombre}(${id}:7,datos:{idEmpleado:123})}`, 'EMPLEADO');
        assert.equal(ajeno.errors[0].extensions.code, 'FORBIDDEN');
        const admin = await pedir(`mutation{modificar${nombre}(${id}:7,datos:{idEmpleado:123})}`);
        assert.equal(admin.errors, undefined);
        assert.equal(llamadas.at(-1).inputs.find(p => p.nombre === 'IdEmpleado').valor, 123);
    }
});

test('los estados GraphQL se traducen a los valores exactos de SQL', async t => {
    const {pedir, llamadas} = entorno(t);
    await pedir('mutation{modificarCaso(idCaso:7,datos:{estado:EN_PROCESO})}');
    assert.equal(llamadas.at(-1).inputs.find(p => p.nombre === 'Estado').valor, 'En proceso');
    await pedir('mutation{modificarEnvio(idEnvio:7,datos:{estado:EN_CAMINO})}');
    assert.equal(llamadas.at(-1).inputs.find(p => p.nombre === 'Estado').valor, 'En camino');
    await pedir('mutation{modificarAuditoria(idAuditoria:7,datos:{accion:BORRAR})}');
    assert.equal(llamadas.at(-1).inputs.find(p => p.nombre === 'Accion').valor, 'D');
    const resultado = await pedir('{casos{Estado FechaApertura} cotizaciones{Total Estado}}');
    assert.equal(resultado.data.casos[0].Estado, 'ABIERTO');
    assert.equal(resultado.data.casos[0].FechaApertura, '2026-10-29T18:00:00.000Z');
    assert.equal(resultado.data.cotizaciones[0].Total, '12.30');
});

test('fecha de entrega admite NULL explícito, omisión y fechas con zona horaria', async t => {
    const {pedir, llamadas} = entorno(t);
    await pedir('mutation{modificarEnvio(idEnvio:7,datos:{fechaEntrega:null})}');
    let inputs = llamadas.at(-1).inputs;
    assert.equal(inputs.find(p => p.nombre === 'FechaEntrega').valor, null);
    assert.equal(inputs.find(p => p.nombre === 'CambiarFechaEntrega').valor, true);
    await pedir('mutation{modificarEnvio(idEnvio:7,datos:{direccion:"Prueba"})}');
    inputs = llamadas.at(-1).inputs;
    assert.equal(inputs.find(p => p.nombre === 'CambiarFechaEntrega').valor, false);
    assert.ok(!inputs.some(p => p.nombre === 'FechaEntrega'));
    const resultado = await pedir('mutation{modificarEnvio(idEnvio:7,datos:{fechaEntrega:"2026-10-29T12:00:00-06:00"})}');
    assert.equal(resultado.errors, undefined);
    assert.equal(llamadas.at(-1).inputs.find(p => p.nombre === 'FechaEntrega').valor.toISOString(), '2026-10-29T18:00:00.000Z');
});

test('cantidades, precisión monetaria, requeridos y cambios vacíos se validan antes del SP', async t => {
    const {pedir, llamadas} = entorno(t);
    for (const caso of casos) {
        const vacio = await pedir(`mutation{modificar${caso.nombre}(${caso.id}:7,datos:{})}`);
        assert.equal(vacio.errors[0].extensions.code, 'BAD_USER_INPUT');
        const id = await pedir(`mutation{borrar${caso.nombre}(${caso.id}:0)}`);
        assert.equal(id.errors[0].extensions.code, 'BAD_USER_INPUT');
    }
    for (const cambio of ['cantidad:0', 'cantidad:-1', 'cantidad:null', 'precio:"100000000.00"', 'costo:null']) {
        const resultado = await pedir(`mutation{modificarDetalleVenta(idDetalle:7,datos:{${cambio}})}`);
        assert.equal(resultado.errors[0].extensions.code, 'BAD_USER_INPUT');
    }
    for (const cambio of ['precio:"-1.00"', 'precio:"1.001"', 'precio:1.00', 'precio:"1e3"']) {
        assert.ok((await pedir(`mutation{modificarDetalleVenta(idDetalle:7,datos:{${cambio}})}`)).errors);
    }
    for (const query of ['mutation{modificarVenta(idVenta:7,datos:{total:"0.00"})}',
        'mutation{modificarCotizacion(idCotizacion:7,datos:{total:"0.00"})}',
        'mutation{modificarCaso(idCaso:7,datos:{estado:INEXISTENTE})}']) {
        assert.equal((await pedir(query)).errors[0].extensions.code, 'GRAPHQL_VALIDATION_FAILED');
    }
    assert.equal(llamadas.length, 0);
});

test('Dinero conserva centavos y FechaHora rechaza normalizaciones silenciosas y límites SQL', () => {
    for (const [entrada, salida] of [['0', '0.00'], ['001.2', '1.20'], ['9999999999.99', '9999999999.99']]) {
        assert.equal(normalizarDinero(entrada), salida);
    }
    for (const valor of ['2026-02-30T00:00:00Z', '2025-02-29T00:00:00Z', '2026-13-01T00:00:00Z',
        '2026-10-29', '2026-10-29T12:00:00', '2026-10-29T25:00:00Z', '2026-10-29T12:00:00+15:00',
        '1753-01-01T00:00:00+01:00', '9999-12-31T23:59:59.999Z', null]) {
        assert.throws(() => fechaHora(valor), {extensions: {code: 'BAD_USER_INPUT'}});
    }
    assert.equal(fechaHora('2024-02-29T00:00:00Z').getUTCDate(), 29);
    assert.equal(fechaHora('9999-12-31T23:59:59.997Z').getUTCMilliseconds(), 997);
});

test('errores de stock, concurrencia, FK y triggers se traducen sin publicar información SQL', async t => {
    for (const [errorSQL, codigo] of [
        [{number: 51103}, 'CONFLICT'], [{number: 1205}, 'CONFLICT'], [{number: 547}, 'CONFLICT'],
        [{number: 51101}, 'NOT_FOUND'], [{number: 8115}, 'BAD_USER_INPUT'],
        [{number: 3609, precedingErrors: [{number: 50000}]}, 'CONFLICT'],
    ]) {
        const {pedir} = entorno(t, {errorSQL});
        const resultado = await pedir('mutation{borrarDetalleVenta(idDetalle:7)}');
        assert.equal(resultado.errors[0].extensions.code, codigo);
        assert.ok(!JSON.stringify(resultado).includes('privado'));
    }
});
