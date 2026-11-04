import {writeFileSync} from 'node:fs';

// Genera artefactos sin credenciales ni llamadas al servidor.
const event = (listen, source) => ({listen, script: {type: 'text/javascript', exec: source.trim().split('\n')}});
const prerequest = `
function detener(mensaje) {
    pm.execution.setNextRequest(null);
    throw new Error(mensaje);
}
if (pm.request.body?.mode === 'raw') {
    let body;
    try { body = JSON.parse(pm.request.body.raw); }
    catch { detener('El Body debe ser JSON valido.'); }
    function resolver(valor, campo = '') {
        if (Array.isArray(valor)) return valor.map(v => resolver(v, campo));
        if (valor && typeof valor === 'object') return Object.fromEntries(
            Object.entries(valor).map(([k, v]) => [k, resolver(v, k)]));
        if (typeof valor !== 'string') return valor;
        const exacta = /^{{(\\w+)}}$/.exec(valor);
        if (exacta) {
            const dato = pm.variables.get(exacta[1]);
            if (dato === undefined || dato === null || dato === '') detener('Falta la variable ' + exacta[1]);
            if (/^id($|[A-Z])/.test(campo)) {
                const numero = Number(dato);
                if (!Number.isInteger(numero) || numero < 1 || numero > 2147483647) detener('ID invalido: ' + exacta[1]);
                return numero;
            }
            return String(dato);
        }
        return valor.replace(/{{(\\w+)}}/g, (_, nombre) => {
            const dato = pm.variables.get(nombre);
            if (dato === undefined || dato === null || dato === '') detener('Falta la variable ' + nombre);
            return String(dato);
        });
    }
    // El Body visible es la fuente; nunca se reconstruye desde un payload oculto.
    pm.request.body.update(JSON.stringify(resolver(body)));
}
`;
const success = `
function fallo(mensaje) {
    pm.execution.setNextRequest(null);
    throw new Error(mensaje);
}
const r = pm.response.json();
pm.test('HTTP 200 y sin errores GraphQL', () => {
    pm.expect(pm.response.code).to.eql(200);
    pm.expect(r.errors).to.be.undefined;
});
if (pm.response.code !== 200 || r.errors || !r.data) fallo('Operacion fallida. No continuar; revisar y ejecutar limpieza si hay registros creados.');
`;
const folders = [];
function folder(name) {
    const f = {name, item: []}; folders.push(f); return f;
}
function request(f, name, query, variables = {}, test = '', before = '', noauth = false) {
    const it = {
        name,
        request: {
            method: 'POST',
            header: [{key: 'Content-Type', value: 'application/json'}],
            url: '{{baseUrl}}',
            body: {mode: 'raw', raw: JSON.stringify({query, variables}, null, 2), options: {raw: {language: 'json'}}},
            ...(noauth ? {auth: {type: 'noauth'}} : {}),
        },
        event: [event('prerequest', '(() => {\n' + before + '\n' + prerequest + '\n})();'), event('test', success + '\n' + test)],
    };
    f.item.push(it); return it;
}
const login = folder('00 - Login administrador (tambien para reanudar limpieza)');
request(login, 'Login y guardar token',
    'mutation($correo:String!,$clave:String!){login(correo:$correo,clave:$clave){token usuario{idUsuario rol}}}',
    {correo: '{{correoLogin}}', clave: '{{claveLogin}}'}, `
if (r.data.login?.usuario?.rol !== 'ADMINISTRADOR') fallo('La demo requiere un Administrador.');
pm.collectionVariables.set('token', r.data.login.token);
`, '', true);

const init = folder('01 - Preparar ejecucion y consultar Rol');
request(init, 'Validar referencias, generar datos unicos y obtener roles',
    'query { roles { IdRol Nombre } }', {}, `
for (const [nombre, variable] of [['Empleado','idRolEmpleado'],['Cliente','idRolCliente']]) {
    const rol = r.data.roles.find(x => x.Nombre === nombre);
    if (!rol) fallo('No existe el rol ' + nombre);
    pm.collectionVariables.set(variable, rol.IdRol);
}
pm.test('Roles del dominio presentes', () => pm.expect(r.data.roles.map(x => x.Nombre)).to.include.members(['Administrador','Empleado','Cliente']));
const run = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
pm.collectionVariables.set('demoRun', run);
// SQL datetime redondea milisegundos: usar segundos enteros para verificar igualdad.
const ahora = Math.floor(Date.now() / 1000) * 1000;
pm.collectionVariables.set('demoFecha', new Date(ahora).toISOString());
pm.collectionVariables.set('demoFechaEditada', new Date(ahora + 60000).toISOString());
pm.collectionVariables.set('demoClave', 'Demo!' + run + 'Aa9');
pm.collectionVariables.set('demoPlaca', 'D' + run.slice(-8));
pm.collectionVariables.set('demoCreados', '{}');
for (const nombre of ${JSON.stringify(['UsuarioEmpleado','UsuarioCliente','Empleado','Aseguradora','Caso','Cotizacion','DetalleCotizacion','Venta','DetalleVenta','Envio','Auditoria'])}) {
    pm.collectionVariables.unset('idDemo' + nombre);
}
`, `
const pendientes = JSON.parse(pm.collectionVariables.get('demoCreados') || '{}');
if (Object.values(pendientes).some(x => x.activo)) {
    pm.execution.setNextRequest(null);
    throw new Error('Hay registros pendientes de una demo anterior. Ejecutar 05 - Limpieza antes de preparar otra.');
}
for (const nombre of ['idModeloReferencia','idRepuestoReferencia','idBodegaReferencia']) {
    const n = Number(pm.variables.get(nombre));
    if (!Number.isInteger(n) || n < 1) {
        pm.execution.setNextRequest(null);
        throw new Error('Configurar ' + nombre + ' con el SQL de referencias. No se crearon registros.');
    }
}
`);

const rol = folder('02 - Rol: rechazo esperado de nombre fuera del dominio');
const badRol = request(rol, 'Agregar Rol invalido debe devolver CONFLICT',
    'mutation($nombre:String!){agregarRol(nombre:$nombre)}', {nombre: 'Demo_{{demoRun}}'}, '');
badRol.event[1] = event('test', `
const r = pm.response.json();
const correcto = r.errors?.some(x => x.extensions?.code === 'CONFLICT') && !r.data?.agregarRol;
pm.test('CHECK de Rol rechaza nombre fuera del dominio', () => pm.expect(correcto).to.eql(true));
if (!correcto) {
    const id = r.data?.agregarRol;
    if (Number.isInteger(id) && id > 0) {
        pm.collectionVariables.set('idDemoRolInesperado', id);
        const creados = JSON.parse(pm.collectionVariables.get('demoCreados') || '{}');
        creados.RolInesperado = {id, run: pm.collectionVariables.get('demoRun'), activo: true};
        pm.collectionVariables.set('demoCreados', JSON.stringify(creados));
    }
    pm.execution.setNextRequest(null);
    throw new Error('Restriccion de Rol distinta de la esperada. Revisar; si se creo, limpiar RolInesperado.');
}
`);

const descriptors = [
    {key: 'UsuarioEmpleado', type: 'Usuario', query: 'usuarios', arg: 'idUsuario', pk: 'IdUsuario', fields: 'IdUsuario IdRol Correo Activo',
        alta: {idRol: '{{idRolEmpleado}}', correo: 'demo.emp.{{demoRun}}@repuestos.local', clave: '{{demoClave}}', activo: true},
        cambio: {correo: 'demo.emp.edit.{{demoRun}}@repuestos.local'}, check: {Correo: 'demo.emp.edit.{{demoRun}}@repuestos.local'}},
    {key: 'UsuarioCliente', type: 'Usuario', query: 'usuarios', arg: 'idUsuario', pk: 'IdUsuario', fields: 'IdUsuario IdRol Correo Activo',
        alta: {idRol: '{{idRolCliente}}', correo: 'demo.cli.{{demoRun}}@repuestos.local', clave: '{{demoClave}}', activo: true},
        cambio: {correo: 'demo.cli.edit.{{demoRun}}@repuestos.local'}, check: {Correo: 'demo.cli.edit.{{demoRun}}@repuestos.local'}},
    {key: 'Empleado', type: 'Empleado', query: 'empleados', arg: 'idEmpleado', pk: 'IdEmpleado', fields: 'IdEmpleado IdUsuario Cedula Nombre Puesto',
        alta: {idUsuario: '{{idDemoUsuarioEmpleado}}', cedula: 'E-{{demoRun}}', nombre: 'Empleado Demo {{demoRun}}', puesto: 'Demo'},
        cambio: {puesto: 'Demo actualizado'}, check: {Puesto: 'Demo actualizado'}},
    {key: 'Aseguradora', type: 'Aseguradora', query: 'aseguradoras', arg: 'idAseguradora', pk: 'IdAseguradora', fields: 'IdAseguradora IdUsuario CedulaJuridica Nombre Telefono Correo',
        alta: {idUsuario: '{{idDemoUsuarioCliente}}', cedulaJuridica: 'A-{{demoRun}}', nombre: 'Aseguradora Demo {{demoRun}}', telefono: '22223333', correo: 'demo.aseg.{{demoRun}}@repuestos.local'},
        cambio: {telefono: null}, check: {Telefono: null}},
    {key: 'Caso', type: 'Caso', query: 'casos', arg: 'idCaso', pk: 'IdCaso', fields: 'IdCaso IdAseguradora IdModelo Placa Estado',
        alta: {idAseguradora: '{{idDemoAseguradora}}', idModelo: '{{idModeloReferencia}}', placa: '{{demoPlaca}}', estado: 'ABIERTO'},
        cambio: {estado: 'EN_PROCESO'}, check: {Estado: 'EN_PROCESO'}},
    {key: 'Cotizacion', type: 'Cotizacion', query: 'cotizaciones', arg: 'idCotizacion', pk: 'IdCotizacion', fields: 'IdCotizacion IdCaso IdEmpleado Estado Total',
        alta: {idCaso: '{{idDemoCaso}}', idEmpleado: '{{idDemoEmpleado}}', estado: 'PENDIENTE'},
        cambio: {estado: 'APROBADA'}, check: {Estado: 'APROBADA'}},
    {key: 'DetalleCotizacion', type: 'DetalleCotizacion', query: 'detallesCotizacion', arg: 'idDetalle', pk: 'IdDetalle', fields: 'IdDetalle IdCotizacion IdRepuesto Cantidad Precio Estado',
        alta: {idCotizacion: '{{idDemoCotizacion}}', idRepuesto: '{{idRepuestoReferencia}}', cantidad: 1, precio: '10.00', estado: 'PENDIENTE'},
        cambio: {cantidad: 2, estado: 'APROBADO'}, check: {Cantidad: 2, Estado: 'APROBADO'}},
    {key: 'Venta', type: 'Venta', query: 'ventas', arg: 'idVenta', pk: 'IdVenta', fields: 'IdVenta IdCotizacion IdEmpleado Fecha Total',
        alta: {idCotizacion: '{{idDemoCotizacion}}', idEmpleado: '{{idDemoEmpleado}}', fecha: '{{demoFecha}}'},
        cambio: {fecha: '{{demoFechaEditada}}'}, check: {Fecha: '{{demoFechaEditada}}'}},
    {key: 'DetalleVenta', type: 'DetalleVenta', query: 'detallesVenta', arg: 'idDetalle', pk: 'IdDetalle', fields: 'IdDetalle IdVenta IdRepuesto IdBodega Cantidad Precio Costo',
        alta: {idVenta: '{{idDemoVenta}}', idRepuesto: '{{idRepuestoReferencia}}', idBodega: '{{idBodegaReferencia}}', cantidad: 1, precio: '10.00', costo: '5.00'},
        cambio: {cantidad: 2}, check: {Cantidad: 2}},
    {key: 'Envio', type: 'Envio', query: 'envios', arg: 'idEnvio', pk: 'IdEnvio', fields: 'IdEnvio IdVenta Direccion Costo Estado FechaEntrega',
        alta: {idVenta: '{{idDemoVenta}}', direccion: 'Direccion Demo {{demoRun}}', costo: '2.00', estado: 'PENDIENTE'},
        cambio: {estado: 'EN_CAMINO', fechaEntrega: null}, check: {Estado: 'EN_CAMINO', FechaEntrega: null}},
    {key: 'Auditoria', type: 'Auditoria', query: 'auditorias', arg: 'idAuditoria', pk: 'IdAuditoria', fields: 'IdAuditoria Tabla Accion Usuario',
        alta: {tabla: 'DemoAcademica', accion: 'INSERTAR', usuario: 'Demo {{demoRun}}'},
        cambio: {accion: 'MODIFICAR'}, check: {Accion: 'MODIFICAR'}},
];

function guard(d, creating = false, cleanup = false) {
    return `
const creados = JSON.parse(pm.collectionVariables.get('demoCreados') || '{}');
const registro = creados[${JSON.stringify(d.key)}];
const run = pm.collectionVariables.get('demoRun');
${cleanup ? "if (!registro?.activo) { pm.execution.skipRequest(); return; } else " : ''}{
    if (!run) { pm.execution.setNextRequest(null); throw new Error('Ejecutar primero 01 - Preparar.'); }
    ${creating ? `if (registro?.activo) { pm.execution.setNextRequest(null); throw new Error('El registro ya fue creado. No repetir el alta.'); }` : `const idBody = Number(pm.variables.replaceIn(String(JSON.parse(pm.request.body.raw).variables?.id ?? '')));
    if (!registro || registro.run !== run || Number(pm.collectionVariables.get('idDemo${d.key}')) !== registro.id || idBody !== registro.id) {
        pm.execution.setNextRequest(null); throw new Error('El ID no pertenece a esta demo. No se enviara la solicitud.');
    }`}
}
`;
}
const create = folder('03 - Crear dependencias y comprobar altas');
const update = folder('04 - Modificar y comprobar cambios');
const cleanup = folder('05 - Limpieza en orden de dependencias');
for (const d of descriptors) {
    const variable = 'idDemo' + d.key;
    request(create, `${d.key} - Agregar y guardar ID`,
        `mutation($datos:${d.type}Input!){agregar${d.type}(datos:$datos)}`, {datos: d.alta}, `
const id = r.data.agregar${d.type};
if (!Number.isInteger(id) || id < 1) fallo('El alta no devolvio un ID positivo.');
pm.collectionVariables.set('${variable}', id);
const creados = JSON.parse(pm.collectionVariables.get('demoCreados') || '{}');
creados.${d.key} = {id, run: pm.collectionVariables.get('demoRun'), activo: true};
pm.collectionVariables.set('demoCreados', JSON.stringify(creados));
pm.test('ID creado y registrado para limpieza', () => pm.expect(id).to.be.above(0));
`, guard(d, true));
    const query = `query($id:Int!){${d.query}(${d.arg}:$id){${d.fields}}}`;
    const variables = {id: `{{${variable}}}`};
    const assertRow = `
const filas = r.data.${d.query};
if (!Array.isArray(filas) || filas.length !== 1 || filas[0].${d.pk} !== Number(pm.variables.get('${variable}'))) fallo('La consulta no devolvio exclusivamente el registro creado.');
pm.test('Registro creado consultable por ID', () => pm.expect(filas).to.have.lengthOf(1));
`;
    request(create, `${d.key} - Consultar alta`, query, variables, assertRow, guard(d));
    request(update, `${d.key} - Modificar`,
        `mutation($id:Int!,$datos:${d.type}Cambios!){modificar${d.type}(${d.arg}:$id,datos:$datos)}`,
        {...variables, datos: d.cambio}, `
if (r.data.modificar${d.type} !== true) fallo('La modificacion no devolvio true.');
pm.test('Modificacion confirmada', () => pm.expect(r.data.modificar${d.type}).to.eql(true));
`, guard(d));
    const comparison = Object.entries(d.check).map(([k, v]) => {
        const expected = typeof v === 'string' ? `pm.variables.replaceIn(${JSON.stringify(v)})` : JSON.stringify(v);
        return `if (filas[0].${k} !== ${expected}) fallo('No se persistio el cambio de ${d.key}.${k}');`;
    }).join('\n');
    request(update, `${d.key} - Consultar cambio persistido`, query, variables, assertRow + comparison + `
pm.test('Cambios persistidos en la base', () => pm.expect(true).to.eql(true));`, guard(d));
}

function total(f, name, query, field, expected) {
    request(f, name, query, {}, `
const filas = r.data.${field};
if (filas?.length !== 1 || filas[0].Total !== '${expected}') fallo('Total incorrecto; revisar trigger y datos.');
pm.test('Total calculado por trigger = ${expected}', () => pm.expect(filas[0].Total).to.eql('${expected}'));
`);
}
total(create, 'Cotizacion - Total tras detalle', 'query($id:Int!){cotizaciones(idCotizacion:$id){Total}}', 'cotizaciones', '10.00');
create.item.at(-1).request.body.raw = JSON.stringify({query: 'query($id:Int!){cotizaciones(idCotizacion:$id){Total}}', variables: {id: '{{idDemoCotizacion}}'}}, null, 2);
total(create, 'Venta - Total tras detalle', 'query($id:Int!){ventas(idVenta:$id){Total}}', 'ventas', '10.00');
create.item.at(-1).request.body.raw = JSON.stringify({query: 'query($id:Int!){ventas(idVenta:$id){Total}}', variables: {id: '{{idDemoVenta}}'}}, null, 2);
total(update, 'Cotizacion - Total tras modificar cantidad', 'query($id:Int!){cotizaciones(idCotizacion:$id){Total}}', 'cotizaciones', '20.00');
update.item.at(-1).request.body.raw = JSON.stringify({query: 'query($id:Int!){cotizaciones(idCotizacion:$id){Total}}', variables: {id: '{{idDemoCotizacion}}'}}, null, 2);
total(update, 'Venta - Total tras modificar cantidad', 'query($id:Int!){ventas(idVenta:$id){Total}}', 'ventas', '20.00');
update.item.at(-1).request.body.raw = JSON.stringify({query: 'query($id:Int!){ventas(idVenta:$id){Total}}', variables: {id: '{{idDemoVenta}}'}}, null, 2);

// Hijos antes de padres. Nunca elimina auditorias generadas automaticamente.
for (const d of [...descriptors].reverse()) {
    const variables = {id: `{{idDemo${d.key}}}`};
    request(cleanup, `${d.key} - Borrar solo registro creado`,
        `mutation($id:Int!){borrar${d.type}(${d.arg}:$id)}`, variables, `
if (r.data.borrar${d.type} !== true) fallo('El borrado no devolvio true.');
const creados = JSON.parse(pm.collectionVariables.get('demoCreados') || '{}');
creados.${d.key}.activo = false;
pm.collectionVariables.set('demoCreados', JSON.stringify(creados));
pm.test('Registro de demo borrado', () => pm.expect(r.data.borrar${d.type}).to.eql(true));
`, guard(d, false, true));
    request(cleanup, `${d.key} - Comprobar ausencia`,
        `query($id:Int!){${d.query}(${d.arg}:$id){${d.pk}}}`, variables, `
if (!Array.isArray(r.data.${d.query}) || r.data.${d.query}.length !== 0) fallo('El registro sigue presente.');
pm.test('Ausencia comprobada', () => pm.expect(r.data.${d.query}).to.eql([]));
`, `
const registro = JSON.parse(pm.collectionVariables.get('demoCreados') || '{}').${d.key};
if (!registro) { pm.execution.skipRequest(); return; }
else if (registro.run !== pm.collectionVariables.get('demoRun') || Number(pm.collectionVariables.get('idDemo${d.key}')) !== registro.id) {
    pm.execution.setNextRequest(null); throw new Error('ID ajeno a esta demo.');
}
`);
}
const unexpected = {key: 'RolInesperado'};
request(cleanup, 'Rol inesperado - Solo si el CHECK permitio crearlo',
    'mutation($id:Int!){borrarRol(idRol:$id)}', {id: '{{idDemoRolInesperado}}'}, `
if (r.data.borrarRol !== true) fallo('No se pudo borrar el Rol inesperado.');
const creados = JSON.parse(pm.collectionVariables.get('demoCreados') || '{}');
creados.RolInesperado.activo = false;
pm.collectionVariables.set('demoCreados', JSON.stringify(creados));
`, guard(unexpected, false, true));
const end = folder('06 - Cerrar sesion');
request(end, 'Cerrar sesion y confirmar limpieza', 'mutation { cerrarSesion }', {}, `
if (r.data.cerrarSesion !== true) fallo('No se cerro la sesion.');
pm.collectionVariables.unset('token');
const pendientes = Object.entries(JSON.parse(pm.collectionVariables.get('demoCreados') || '{}')).filter(([,v]) => v.activo);
if (pendientes.length) fallo('Persisten registros de demo: ' + pendientes.map(([k]) => k).join(', '));
pm.test('Sin registros de demo pendientes', () => pm.expect(pendientes).to.have.lengthOf(0));
`);

const collection = {
    info: {name: 'Demo CRUD B - Dependencias automaticas', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        description: 'Demo de escritura, modificacion y limpieza del lote B. Configurar credenciales admin y tres referencias SQL con stock >= 2. Leer DEMO_CRUD.md. Rol incluye consulta y rechazo esperado, no CRUD positivo completo. Los triggers dejan auditoria y consumen identidades; la limpieza no restaura una copia exacta. No ejecutar concurrentemente.'},
    auth: {type: 'bearer', bearer: [{key: 'token', value: '{{token}}', type: 'string'}]},
    variable: Object.entries({baseUrl: 'http://localhost:4000/', correoLogin: '', claveLogin: '', token: '', idModeloReferencia: '0', idRepuestoReferencia: '0', idBodegaReferencia: '0', demoCreados: '{}'}).map(([key,value]) => ({key,value,type:'string'})),
    item: folders,
};
writeFileSync('docs/pruebas/demo_crud_B.postman_collection.json', JSON.stringify(collection, null, 2) + '\n');
console.log('Coleccion demo generada; sin conectar a SQL ni incluir credenciales.');
