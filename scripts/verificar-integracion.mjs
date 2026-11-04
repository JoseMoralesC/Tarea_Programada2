import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {astFromValue, print, buildClientSchema, getIntrospectionQuery, getNamedType} from 'graphql';
import {cargarConfig} from '../src/config.js';
import {crearGestorPools, sql} from '../src/db.js';
import {crearServidor} from '../src/server.js';
import {generarHashClave} from '../src/auth/claves.js';
import {conBasePruebas} from './lib/base-pruebas.mjs';

const config = cargarConfig();
const cubiertas = new Set();

// Primero comprobamos que el archivo de entrega restaure también sus datos.
await conBasePruebas(config, true, async ({pool, archivo}) => {
    const tablas = [...archivo.matchAll(/CREATE TABLE \[dbo\]\.\[([^\]]+)\]/g)].map(m => m[1]);
    assert.equal(tablas.length, 23);
    for (const tabla of tablas) {
        const esperadas = [...archivo.matchAll(new RegExp(`^INSERT \\[dbo\\]\\.\\[${tabla}\\]`, 'gm'))].length;
        const {recordset} = await pool.request().query(`SELECT COUNT(*) cantidad FROM dbo.[${tabla}]`);
        assert.equal(recordset[0].cantidad, esperadas, tabla);
    }
    const deps = await pool.request().query("SELECT COUNT(*) cantidad FROM sys.sequences WHERE name='SecuenciaCodigoRepuesto';");
    assert.equal(deps.recordset[0].cantidad, 1);
    console.log('Restauración de estructura y datos comprobada en las 23 tablas.');
});

// El CRUD se ensaya en otra copia vacía para no tocar los datos del equipo.
await conBasePruebas(config, false, async ({nombre, pool}) => {
    const clave = randomBytes(24).toString('hex');
    await pool.request().query("INSERT dbo.Rol(Nombre) VALUES ('Administrador');");
    const {recordset: [rolAdmin]} = await pool.request().query("SELECT IdRol FROM dbo.Rol WHERE Nombre='Administrador'");
    const boot = await pool.request().input('function', sql.Int, 1).input('IdRol', sql.Int, rolAdmin.IdRol)
        .input('Correo', sql.VarChar(100), 'admin@integracion.test')
        .input('Contrasena', sql.VarChar(255), await generarHashClave(clave)).execute('dbo.MantenimientoUsuario');
    await pool.request().input('function', sql.Int, 1).input('IdUsuario', sql.Int, boot.recordset[0].IdUsuario)
        .input('Cedula', sql.VarChar(20), 'BOOT').input('Nombre', sql.NVarChar(100), 'Administrador de pruebas')
        .input('Puesto', sql.NVarChar(50), 'Pruebas').execute('dbo.MantenimientoEmpleado');
    const gestor = crearGestorPools({...config, db: {...config.db, database: nombre}});
    const {server, context} = crearServidor({...gestor, ...config});
    try {
        const intro = await server.executeOperation({query: getIntrospectionQuery()});
        const schema = buildClientSchema(intro.body.singleResult.data);
        let token;
        async function llamar(campo, args = {}, {sesion = token, seleccion, error} = {}) {
            const mutation = Object.hasOwn(schema.getMutationType().getFields(), campo);
            const field = (mutation ? schema.getMutationType() : schema.getQueryType()).getFields()[campo];
            const argumentos = Object.entries(args).map(([k, v]) => {
                const tipo = field.args.find(a => a.name === k)?.type;
                assert.ok(tipo, `${campo}.${k}`);
                return `${k}:${print(astFromValue(v, tipo))}`;
            }).join(',');
            const tipo = getNamedType(field.type);
            if (seleccion === undefined && tipo.getFields) seleccion = Object.keys(tipo.getFields()).join(' ');
            const query = `${mutation ? 'mutation' : 'query'} { ${campo}${argumentos ? `(${argumentos})` : ''}${seleccion ? ` { ${seleccion} }` : ''} }`;
            const ctx = await context({req: {headers: sesion ? {authorization: `Bearer ${sesion}`} : {}}});
            const result = (await server.executeOperation({query}, {contextValue: ctx})).body.singleResult;
            if (error) {
                assert.equal(result.errors?.[0]?.extensions?.code, error, campo);
                return;
            }
            assert.equal(result.errors, undefined, `${campo}: ${result.errors?.map(e => e.message).join('; ')}`);
            if (!['login', 'cerrarSesion', 'sesion'].includes(campo)) cubiertas.add(campo);
            return result.data[campo];
        }
        async function login(correo) {
            return (await llamar('login', {correo, clave}, {sesion: null, seleccion: 'token usuario { idUsuario rol idEmpleado }'})).token;
        }
        token = await login('admin@integracion.test');
        const temporal = await llamar('agregarRol', {nombre: 'Cliente'});
        assert.equal((await llamar('roles', {idRol: temporal}))[0].Nombre, 'Cliente');
        await llamar('modificarRol', {idRol: temporal, nombre: 'Empleado'});
        assert.equal((await llamar('roles', {idRol: temporal}))[0].Nombre, 'Empleado');
        await llamar('borrarRol', {idRol: temporal});
        assert.equal((await llamar('roles', {idRol: temporal})).length, 0);
        const rolCliente = await llamar('agregarRol', {nombre: 'Cliente'});
        const rolEmpleado = await llamar('agregarRol', {nombre: 'Empleado'});
        const cliente1 = await llamar('agregarUsuario', {datos: {idRol: rolCliente, correo: 'cliente1@integracion.test', clave}});
        const cliente2 = await llamar('agregarUsuario', {datos: {idRol: rolCliente, correo: 'cliente2@integracion.test', clave}});
        const aseguradora2 = await llamar('agregarAseguradora', {datos: {idUsuario: cliente2, cedulaJuridica: 'CLI2', nombre: 'Cliente dos'}});
        const ids = {};
        const casos = [];
        const a = async (n, q, alta, cambios, comprobar, opciones = {}) => {
            const id = await llamar(`agregar${n}`, alta);
            ids[n] = id;
            const columna = opciones.columna ?? `Id${n}`;
            const arg = columna[0].toLowerCase() + columna.slice(1);
            const filtro = n === 'Modelo' || n === 'Categoria' || n === 'Marca' ? {} : {[arg]: id};
            const caso = {n, q, id, arg, columna, filtro, cambios, comprobar, ...opciones};
            casos.push(caso);
            const filas = await llamar(q, filtro);
            assert.ok(filas.some(f => f[columna] === id), `${n}: alta persistida`);
            return id;
        };
        const datos = v => ({datos: v});
        await a('Categoria', 'categorias', {nombre: 'Filtros'}, {nombre: 'Filtros nuevos'}, ['Nombre', 'Filtros nuevos']);
        await a('Marca', 'marcas', {nombre: 'Marca'}, {nombre: 'Marca nueva'}, ['Nombre', 'Marca nueva']);
        await a('Modelo', 'modelos', {idMarca: ids.Marca, nombre: 'Modelo', anioInicio: 2020, anioFin: 2025}, {anioFin: null}, ['AnioFin', null]);
        const modelo2 = await llamar('agregarModelo', {idMarca: ids.Marca, nombre: 'Modelo dos', anioInicio: 2021});
        await a('Repuesto', 'repuestos', {idCategoria: ids.Categoria, codigo: 'PRUEBA-1', nombre: 'Filtro', precioVenta: 10, costo: 5}, {precioVenta: 12.50}, ['PrecioVenta', 12.50]);
        await llamar('agregarRepuestoModelo', {idRepuesto: ids.Repuesto, idModelo: ids.Modelo});
        assert.equal((await llamar('repuestosModelos', {idRepuesto: ids.Repuesto}))[0].IdModelo, ids.Modelo);
        await llamar('modificarRepuestoModelo', {idRepuesto: ids.Repuesto, idModelo: ids.Modelo, nuevoIdModelo: modelo2});
        assert.equal((await llamar('repuestosModelos', {idRepuesto: ids.Repuesto}))[0].IdModelo, modelo2);
        await a('Bodega', 'bodegas', {nombre: 'Bodega', ubicacion: 'Centro'}, {ubicacion: 'Norte'}, ['Ubicacion', 'Norte']);
        await a('Proveedor', 'proveedores', {nombre: 'Proveedor', telefono: '111', correo: 'proveedor@test.test', diasEntrega: 2}, {telefono: null}, ['Telefono', null]);
        await a('Inventario', 'inventario', {idBodega: ids.Bodega, idRepuesto: ids.Repuesto, cantidad: 20}, {cantidad: 40}, ['Cantidad', 40]);
        await a('Compra', 'compras', {idProveedor: ids.Proveedor, idBodega: ids.Bodega, fecha: '2026-11-03', fechaRecepcion: '2026-11-04'}, {fechaRecepcion: null}, ['FechaRecepcion', null]);
        await a('DetalleCompra', 'detallesCompra', {idCompra: ids.Compra, idRepuesto: ids.Repuesto, cantidad: 2, costo: 5}, {cantidad: 3}, ['Cantidad', 3], {columna: 'IdDetalle'});
        await a('Incidencia', 'incidencias', {idRepuesto: ids.Repuesto, idProveedor: ids.Proveedor, idCompra: ids.Compra, tipo: 'Dañado', cantidad: 1}, {idCompra: null}, ['IdCompra', null]);
        await a('Usuario', 'usuarios', datos({idRol: rolEmpleado, correo: 'empleado@integracion.test', clave}), datos({correo: 'empleado2@integracion.test'}), ['Correo', 'empleado2@integracion.test']);
        await a('Empleado', 'empleados', datos({idUsuario: ids.Usuario, cedula: 'EMP1', nombre: 'Empleado', puesto: 'Ventas'}), datos({puesto: 'Bodega'}), ['Puesto', 'Bodega']);
        await a('Movimiento', 'movimientos', {idRepuesto: ids.Repuesto, idBodegaDestino: ids.Bodega, idEmpleado: ids.Empleado, tipo: 'Entrada', cantidad: 1}, {tipo: 'Salida', idBodegaOrigen: ids.Bodega, idBodegaDestino: null, cantidad: 2}, ['IdBodegaDestino', null]);
        await a('Aseguradora', 'aseguradoras', datos({idUsuario: cliente1, cedulaJuridica: 'CLI1', nombre: 'Cliente uno', telefono: '123'}), datos({telefono: null}), ['Telefono', null]);
        await a('Caso', 'casos', datos({idAseguradora: ids.Aseguradora, idModelo: ids.Modelo, placa: 'ABC123', estado: 'ABIERTO'}), datos({estado: 'EN_PROCESO'}), ['Estado', 'EN_PROCESO']);
        await a('Cotizacion', 'cotizaciones', datos({idCaso: ids.Caso, idEmpleado: ids.Empleado, estado: 'PENDIENTE'}), datos({estado: 'APROBADA'}), ['Estado', 'APROBADA']);
        await a('DetalleCotizacion', 'detallesCotizacion', datos({idCotizacion: ids.Cotizacion, idRepuesto: ids.Repuesto, cantidad: 1, precio: '10.00', estado: 'PENDIENTE'}), datos({cantidad: 2}), ['Cantidad', 2], {columna: 'IdDetalle'});
        await a('Venta', 'ventas', datos({idCotizacion: ids.Cotizacion, idEmpleado: ids.Empleado}), datos({fecha: '2026-11-03T12:00:00Z'}), ['Fecha', '2026-11-03T12:00:00.000Z']);
        await a('DetalleVenta', 'detallesVenta', datos({idVenta: ids.Venta, idRepuesto: ids.Repuesto, idBodega: ids.Bodega, cantidad: 1, precio: '10.00', costo: '5.00'}), datos({cantidad: 2}), ['Cantidad', 2], {columna: 'IdDetalle'});
        await a('Envio', 'envios', datos({idVenta: ids.Venta, direccion: 'Centro', costo: '2.00', estado: 'PENDIENTE', fechaEntrega: '2026-11-04T12:00:00Z'}), datos({fechaEntrega: null}), ['FechaEntrega', null]);
        await a('Auditoria', 'auditorias', datos({tabla: 'Prueba', accion: 'INSERTAR', usuario: 'Equipo'}), datos({usuario: 'Equipo revisado'}), ['Usuario', 'Equipo revisado']);
        for (const c of casos) {
            await llamar(`modificar${c.n}`, {[c.arg]: c.id, ...c.cambios});
            const fila = (await llamar(c.q, c.filtro)).find(f => f[c.columna] === c.id);
            assert.deepEqual(fila[c.comprobar[0]], c.comprobar[1], `${c.n}: cambio persistido`);
        }
        assert.equal((await llamar('proveedores', {idProveedor: ids.Proveedor}))[0].Correo, 'proveedor@test.test');
        assert.equal((await llamar('compras', {idCompra: ids.Compra}))[0].Total, 15);
        assert.equal((await llamar('cotizaciones', {idCotizacion: ids.Cotizacion}))[0].Total, '20.00');
        assert.equal((await llamar('ventas', {idVenta: ids.Venta}))[0].Total, '20.00');
        const stock = async () => (await llamar('inventario', {idInventario: ids.Inventario}))[0].Cantidad;
        const antes = await stock();
        await llamar('agregarDetalleVenta', datos({idVenta: ids.Venta, idRepuesto: ids.Repuesto, idBodega: ids.Bodega, cantidad: 999999, precio: '10.00', costo: '5.00'}), {error: 'CONFLICT'});
        assert.equal(await stock(), antes);
        await llamar('modificarDetalleCompra', {idDetalle: ids.DetalleCompra, idRepuesto: 2147483647}, {error: 'CONFLICT'});
        assert.equal((await llamar('detallesCompra', {idDetalle: ids.DetalleCompra}))[0].IdRepuesto, ids.Repuesto);
        assert.equal(await stock(), antes);
        const t1 = await login('cliente1@integracion.test'), t2 = await login('cliente2@integracion.test');
        for (const q of ['casos', 'cotizaciones', 'detallesCotizacion', 'ventas', 'detallesVenta', 'envios']) {
            assert.equal((await llamar(q, {}, {sesion: t1})).length, 1, q);
            assert.equal((await llamar(q, {}, {sesion: t2})).length, 0, q);
        }
        assert.equal((await llamar('detallesVenta', {}, {sesion: t1}))[0].Costo, null);
        await llamar('borrarRepuesto', {idRepuesto: ids.Repuesto}, {sesion: t1, error: 'FORBIDDEN'});
        await llamar('inventario', {}, {sesion: t1, error: 'FORBIDDEN'});
        const te = await login('empleado2@integracion.test');
        await llamar('agregarMovimiento', {idRepuesto: ids.Repuesto, idBodegaDestino: ids.Bodega, idEmpleado: 2147483647, tipo: 'Entrada', cantidad: 1}, {sesion: te, error: 'FORBIDDEN'});
        await llamar('agregarCompra', {idProveedor: ids.Proveedor, idBodega: ids.Bodega, fecha: '2026-02-30'}, {error: 'BAD_USER_INPUT'});
        await llamar('modificarProveedor', {idProveedor: ids.Proveedor}, {error: 'BAD_USER_INPUT'});
        const concurrentes = await Promise.allSettled([1, 2].map(() => llamar('agregarDetalleVenta', datos({idVenta: ids.Venta, idRepuesto: ids.Repuesto, idBodega: ids.Bodega, cantidad: antes, precio: '1.00', costo: '1.00'}))));
        assert.equal(concurrentes.filter(r => r.status === 'fulfilled').length, 1);
        assert.equal(await stock(), 0);
        await llamar('borrarDetalleVenta', {idDetalle: concurrentes.find(r => r.status === 'fulfilled').value});
        assert.equal(await stock(), antes);
        const orden = ['Envio', 'DetalleVenta', 'Venta', 'DetalleCotizacion', 'Cotizacion', 'Caso', 'Aseguradora', 'Auditoria', 'Movimiento', 'Empleado', 'Usuario', 'Incidencia', 'DetalleCompra', 'Compra', 'Inventario', 'Repuesto', 'Modelo', 'Marca', 'Categoria', 'Bodega', 'Proveedor'];
        await llamar('borrarRepuestoModelo', {idRepuesto: ids.Repuesto, idModelo: modelo2});
        assert.equal((await llamar('repuestosModelos', {idRepuesto: ids.Repuesto})).length, 0);
        await llamar('borrarModelo', {idModelo: modelo2});
        for (const n of orden) {
            const c = casos.find(c => c.n === n);
            await llamar(`borrar${n}`, {[c.arg]: c.id});
            assert.ok(!(await llamar(c.q, c.filtro)).some(f => f[c.columna] === c.id), `${n}: borrado persistido`);
        }
        await llamar('borrarAseguradora', {idAseguradora: aseguradora2});
        await llamar('borrarUsuario', {idUsuario: cliente1});
        await llamar('borrarUsuario', {idUsuario: cliente2});
        await llamar('borrarRol', {idRol: rolCliente});
        await llamar('borrarRol', {idRol: rolEmpleado});
        await llamar('cerrarSesion');
        assert.equal(cubiertas.size, 92);
        console.log('OK: 92 operaciones CRUD reales; login, aislamiento entre clientes, NULL, fechas, totales, stock, rollback y ventas concurrentes comprobados.');
    } finally {
        await server.stop();
    }
});
