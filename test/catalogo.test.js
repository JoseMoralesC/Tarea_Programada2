import test from 'node:test';
import assert from 'node:assert/strict';
import {crearServidor} from '../src/server.js';

function entorno(t, rol = 'EMPLEADO') {
    const llamadas = [];
    const {server} = crearServidor({obtenerPool: async () => pool});
    const pool = {request() {
        const parametros = {};
        return {
            input(n, _, v) {parametros[n] = v; return this;},
            async execute(sp) {
                llamadas.push({sp, parametros});
                if (sp.startsWith('Consultar')) return {recordset: []};
                return {recordset: [Object.fromEntries(['Modelo', 'Repuesto', 'Bodega', 'Proveedor',
                    'Inventario', 'Compra', 'Incidencia', 'Movimiento', 'Detalle'].map(n => [`Id${n}`, 7]))]};
            },
        };
    }};
    t.after(() => server.stop());
    const contexto = {identidad: {rol, idEmpleado: 3}, obtenerPool: async () => pool};
    return {llamadas, async pedir(query) {
        return (await server.executeOperation({query}, {contextValue: contexto})).body.singleResult;
    }};
}

const casos = [
    ['Modelo', 'modelos', 'idModelo', 'IdModelo', 'idMarca:1,nombre:"Modelo",anioInicio:2020', 'nombre:"Nuevo"', 'Nombre', 'Nuevo'],
    ['Repuesto', 'repuestos', 'idRepuesto', 'IdRepuesto', 'idCategoria:1,codigo:"REP-1",nombre:"Filtro",precioVenta:10.50,costo:5.25', 'costo:6.25', 'Costo', 6.25],
    ['Bodega', 'bodegas', 'idBodega', 'IdBodega', 'nombre:"Centro",ubicacion:"San Jose"', 'ubicacion:"Norte"', 'Ubicacion', 'Norte'],
    ['Proveedor', 'proveedores', 'idProveedor', 'IdProveedor', 'nombre:"Proveedor",diasEntrega:2', 'diasEntrega:3', 'DiasEntrega', 3],
    ['Inventario', 'inventario', 'idInventario', 'IdInventario', 'idBodega:1,idRepuesto:1,cantidad:5', 'cantidad:6', 'Cantidad', 6],
    ['Compra', 'compras', 'idCompra', 'IdCompra', 'idProveedor:1,idBodega:1,fecha:"2026-11-03"', 'fecha:"2026-11-04"', 'Fecha', new Date('2026-11-04T00:00:00Z')],
    ['DetalleCompra', 'detallesCompra', 'idDetalle', 'IdDetalle', 'idCompra:1,idRepuesto:1,cantidad:2,costo:5', 'cantidad:3', 'Cantidad', 3],
    ['Incidencia', 'incidencias', 'idIncidencia', 'IdIncidencia', 'idRepuesto:1,idProveedor:1,tipo:"Dañado",cantidad:1', 'cantidad:2', 'Cantidad', 2],
    ['Movimiento', 'movimientos', 'idMovimiento', 'IdMovimiento', 'idRepuesto:1,idBodegaDestino:1,tipo:"Entrada",cantidad:1', 'cantidad:2', 'Cantidad', 2],
];

test('los nueve módulos con identity ejecutan su CRUD con los parámetros correctos', async t => {
    const {pedir, llamadas} = entorno(t);
    for (const [nombre, consulta, id, columna, alta, cambio, campo, valor] of casos) {
        assert.equal((await pedir(`{ ${consulta} { ${columna} } }`)).errors, undefined, nombre);
        assert.equal((await pedir(`mutation { agregar${nombre}(${alta}) }`)).data[`agregar${nombre}`], 7, nombre);
        assert.equal(llamadas.at(-1).parametros.function, 1);
        assert.equal((await pedir(`mutation { modificar${nombre}(${id}:7,${cambio}) }`)).errors, undefined, nombre);
        assert.deepEqual(llamadas.at(-1).parametros[campo], valor);
        assert.equal((await pedir(`mutation { borrar${nombre}(${id}:7) }`)).errors, undefined, nombre);
        assert.equal(llamadas.at(-1).parametros[columna], 7);
        assert.equal(llamadas.at(-1).parametros.function, 3);
    }
    assert.equal(llamadas.length, 36);
});

test('RepuestoModelo conserva su clave compuesta en las cuatro operaciones', async t => {
    const {pedir, llamadas} = entorno(t);
    for (const q of ['{ repuestosModelos(idRepuesto:1,idModelo:2) { IdModelo } }',
        'mutation { agregarRepuestoModelo(idRepuesto:1,idModelo:2) }',
        'mutation { modificarRepuestoModelo(idRepuesto:1,idModelo:2,nuevoIdModelo:3) }',
        'mutation { borrarRepuestoModelo(idRepuesto:1,idModelo:2) }']) {
        assert.equal((await pedir(q)).errors, undefined);
        assert.equal(llamadas.at(-1).parametros.IdRepuesto, 1);
        assert.equal(llamadas.at(-1).parametros.IdModelo, 2);
    }
    assert.equal(llamadas[2].parametros.NuevoIdModelo, 3);
});

test('fechas inexistentes, cambios vacíos, IDs, importes y textos inválidos no llegan al SP', async t => {
    const {pedir, llamadas} = entorno(t);
    for (const q of [
        'mutation { agregarProveedor(nombre:"",diasEntrega:0) }',
        'mutation { modificarProveedor(idProveedor:1) }',
        'mutation { borrarCompra(idCompra:0) }',
        '{ modelos(idMarca:-1) { IdModelo } }',
        'mutation { agregarCompra(idProveedor:1,idBodega:1,fecha:"2026-02-30") }',
        'mutation { agregarCompra(idProveedor:1,idBodega:1,fecha:"2026-13-01") }',
        'mutation { agregarCompra(idProveedor:1,idBodega:1,fecha:"") }',
        'mutation { agregarIncidencia(idRepuesto:1,idProveedor:1,tipo:"Dañado",cantidad:1,fecha:"2026-02-30T00:00:00Z") }',
        'mutation { agregarRepuesto(idCategoria:1,codigo:"R",nombre:"Filtro",precioVenta:1.001,costo:1) }',
        'mutation { agregarRepuesto(idCategoria:1,codigo:"R",nombre:"Filtro",precioVenta:0.000000001,costo:1) }',
        'mutation { agregarInventario(idBodega:1,idRepuesto:1,cantidad:-1) }',
        'mutation { modificarModelo(idModelo:1,nombre:null) }',
        'mutation { modificarMovimiento(idMovimiento:1,tipo:"Otro") }',
    ]) assert.equal((await pedir(q)).errors[0].extensions.code, 'BAD_USER_INPUT', q);
    assert.equal(llamadas.length, 0);
});

test('NULL explícito y omisión se distinguen para todos los campos opcionales A', async t => {
    const {pedir, llamadas} = entorno(t);
    for (const [nombre, id, campo, parametro, otro] of [
        ['Proveedor', 'idProveedor', 'telefono', 'Telefono', 'nombre:"Cambio"'],
        ['Proveedor', 'idProveedor', 'correo', 'Correo', 'nombre:"Cambio"'],
        ['Modelo', 'idModelo', 'anioFin', 'AnioFin', 'nombre:"Cambio"'],
        ['Compra', 'idCompra', 'fechaRecepcion', 'FechaRecepcion', 'idProveedor:2'],
        ['Incidencia', 'idIncidencia', 'idCompra', 'IdCompra', 'cantidad:2'],
        ['Movimiento', 'idMovimiento', 'idBodegaOrigen', 'IdBodegaOrigen', 'cantidad:2'],
        ['Movimiento', 'idMovimiento', 'idBodegaDestino', 'IdBodegaDestino', 'cantidad:2'],
    ]) {
        assert.equal((await pedir(`mutation { modificar${nombre}(${id}:7,${campo}:null) }`)).errors, undefined);
        assert.equal(llamadas.at(-1).parametros[parametro], null);
        assert.equal(llamadas.at(-1).parametros[`Cambiar${parametro}`], true);
        assert.equal((await pedir(`mutation { modificar${nombre}(${id}:7,${otro}) }`)).errors, undefined);
        assert.equal(llamadas.at(-1).parametros[`Cambiar${parametro}`], false);
        assert.ok(!Object.hasOwn(llamadas.at(-1).parametros, parametro));
    }
});

test('movimientos toman el empleado de la sesión y rechazan atribuciones ajenas', async t => {
    const {pedir, llamadas} = entorno(t);
    const alta = 'idRepuesto:1,idBodegaDestino:1,tipo:"Entrada",cantidad:1';
    assert.equal((await pedir(`mutation { agregarMovimiento(${alta}) }`)).errors, undefined);
    assert.equal(llamadas[0].parametros.IdEmpleado, 3);
    for (const q of [`mutation { agregarMovimiento(${alta},idEmpleado:99) }`,
        'mutation { modificarMovimiento(idMovimiento:1,idEmpleado:99) }']) {
        assert.equal((await pedir(q)).errors[0].extensions.code, 'FORBIDDEN');
    }
    assert.equal(llamadas.length, 1);
});

test('clientes no escriben ni consultan información interna de los módulos nuevos', async t => {
    const {pedir, llamadas} = entorno(t, 'CLIENTE');
    for (const q of ['{ inventario { IdInventario } }',
        'mutation { agregarProveedor(nombre:"Proveedor",diasEntrega:1) }',
        'mutation { borrarRepuestoModelo(idRepuesto:1,idModelo:1) }']) {
        assert.equal((await pedir(q)).errors[0].extensions.code, 'FORBIDDEN');
    }
    assert.equal(llamadas.length, 0);
});
