import test from 'node:test';
import assert from 'node:assert/strict';
import {crearServidor} from '../src/server.js';
import {crearSesiones} from '../src/auth/sesiones.js';
import {pbkdf2Sync, timingSafeEqual} from 'node:crypto';

const filas = {
    Roles: {IdRol: 7, Nombre: 'Supervisor'},
    Usuarios: {IdUsuario: 7, IdRol: 2, Correo: 'ficticio@example.invalid', Activo: true},
    Empleados: {IdEmpleado: 7, IdUsuario: 9, Cedula: 'ficticia', Nombre: 'Prueba', Puesto: 'Prueba'},
    Aseguradoras: {IdAseguradora: 7, IdUsuario: 9, CedulaJuridica: 'ficticia', Nombre: 'Prueba', Telefono: null, Correo: null},
};

function entorno(t, {errorSQL} = {}) {
    const sesiones = crearSesiones();
    const llamadas = [];
    const api = crearServidor({sesiones, obtenerPool: async rol => ({request() {
        const inputs = [];
        return {
            input(nombre, tipo, valor) {inputs.push({nombre, tipo, valor}); return this;},
            async execute(sp) {
                llamadas.push({sp, rol, inputs});
                if (errorSQL) throw Object.assign(new Error('Detalle SQL privado'), {number: errorSQL});
                const consulta = sp.replace('dbo.Consultar', '');
                return {recordset: [filas[consulta] ?? {IdRol: 7, IdUsuario: 7, IdEmpleado: 7, IdAseguradora: 7}]};
            },
        };
    }})});
    t.after(() => api.server.stop());
    const tokens = new Map();
    function token(rol, idUsuario = 9) {
        const key = `${rol}:${idUsuario}`;
        if (!tokens.has(key)) tokens.set(key, sesiones.crear({idUsuario, rol}).token);
        return tokens.get(key);
    }
    async function pedir(query, rol = 'ADMINISTRADOR', variables, idUsuario = 9) {
        const contextValue = await api.context({req: {headers: rol
            ? {authorization: `Bearer ${token(rol, idUsuario)}`} : {}}});
        const respuesta = await api.server.executeOperation({query, variables}, {contextValue});
        return respuesta.body.singleResult;
    }
    return {pedir, llamadas, sesiones, token};
}

const mutaciones = [
    ['agregarUsuario(datos:{idRol:2,correo:"ficticio@example.invalid",clave:"Clave ficticia 🔧"})', 'MantenimientoUsuario', 1, null],
    ['agregarRol(nombre:"Supervisor")', 'MantenimientoRol', 1, null],
    ['modificarRol(idRol:7,nombre:"Supervisor")', 'MantenimientoRol', 2, 'IdRol'],
    ['borrarRol(idRol:7)', 'MantenimientoRol', 3, 'IdRol'],
    ['agregarEmpleado(datos:{idUsuario:9,cedula:"ficticia",nombre:"Prueba",puesto:"Prueba"})', 'MantenimientoEmpleado', 1, null],
    ['modificarEmpleado(idEmpleado:7,datos:{puesto:"Prueba"})', 'MantenimientoEmpleado', 2, 'IdEmpleado'],
    ['borrarEmpleado(idEmpleado:7)', 'MantenimientoEmpleado', 3, 'IdEmpleado'],
    ['agregarAseguradora(datos:{idUsuario:9,cedulaJuridica:"ficticia",nombre:"Prueba"})', 'MantenimientoAseguradora', 1, null],
    ['modificarAseguradora(idAseguradora:7,datos:{nombre:"Prueba"})', 'MantenimientoAseguradora', 2, 'IdAseguradora'],
    ['borrarAseguradora(idAseguradora:7)', 'MantenimientoAseguradora', 3, 'IdAseguradora'],
    ['modificarUsuario(idUsuario:7,datos:{activo:false})', 'MantenimientoUsuario', 2, 'IdUsuario'],
    ['borrarUsuario(idUsuario:7)', 'MantenimientoUsuario', 3, 'IdUsuario'],
];

test('administrador ejecuta las 16 operaciones disponibles con SP e IDs correctos (SQL simulado)', async t => {
    const {pedir, llamadas} = entorno(t);
    const consultas = [
        ['roles(idRol:7){IdRol Nombre}', 'ConsultarRoles', 'IdRol'],
        ['usuarios(idUsuario:7){IdUsuario IdRol Correo Activo}', 'ConsultarUsuarios', 'IdUsuario'],
        ['empleados(idEmpleado:7){IdEmpleado IdUsuario Cedula Nombre Puesto}', 'ConsultarEmpleados', 'IdEmpleado'],
        ['aseguradoras(idAseguradora:7){IdAseguradora IdUsuario CedulaJuridica Nombre Telefono Correo}', 'ConsultarAseguradoras', 'IdAseguradora'],
    ];
    for (const [consulta, sp, campo] of consultas) {
        const resultado = await pedir(`{${consulta}}`);
        assert.equal(resultado.errors, undefined);
        assert.equal(llamadas.at(-1).sp, `dbo.${sp}`);
        assert.equal(llamadas.at(-1).inputs.find(p => p.nombre === campo).valor, 7);
    }
    for (const [mutation, sp, selector, campo] of mutaciones) {
        const resultado = await pedir(`mutation {${mutation}}`);
        assert.equal(resultado.errors, undefined);
        assert.equal(Object.values(resultado.data)[0], selector === 1 ? 7 : true);
        const llamada = llamadas.at(-1);
        assert.equal(llamada.sp, `dbo.${sp}`);
        assert.equal(llamada.inputs.find(p => p.nombre === 'function').valor, selector);
        if (campo) assert.equal(llamada.inputs.find(p => p.nombre === campo).valor, 7);
    }
    assert.equal(llamadas.length, 16);
    assert.ok(llamadas.every(llamada => llamada.rol === 'empleado'));
});

test('empleados y clientes no gestionan roles, usuarios ni perfiles', async t => {
    const {pedir, llamadas} = entorno(t);
    for (const rol of ['EMPLEADO', 'CLIENTE']) {
        for (const [mutation] of mutaciones) {
            const resultado = await pedir(`mutation {${mutation}}`, rol);
            assert.equal(resultado.errors[0].extensions.code, 'FORBIDDEN');
        }
        const roles = await pedir('{roles{Nombre}}', rol);
        assert.equal(roles.errors[0].extensions.code, 'FORBIDDEN');
    }
    assert.equal(llamadas.length, 0);
});

test('sin sesión no se consultan datos personales', async t => {
    const {pedir, llamadas} = entorno(t);
    for (const query of ['roles{IdRol}', 'usuarios{IdUsuario}', 'empleados{IdEmpleado}', 'aseguradoras{IdAseguradora}']) {
        const resultado = await pedir(`{${query}}`, null);
        assert.equal(resultado.errors[0].extensions.code, 'UNAUTHENTICATED');
    }
    assert.equal(llamadas.length, 0);
});

test('usuarios no administradores quedan limitados al ID de su sesión', async t => {
    const {pedir, llamadas} = entorno(t);
    for (const rol of ['EMPLEADO', 'CLIENTE']) {
        assert.equal((await pedir('{usuarios{IdUsuario}}', rol)).errors, undefined);
        assert.equal(llamadas.at(-1).inputs.find(p => p.nombre === 'IdUsuario').valor, 9);
        const antes = llamadas.length;
        const ajeno = await pedir('{usuarios(idUsuario:7){Correo}}', rol);
        assert.equal(ajeno.errors[0].extensions.code, 'FORBIDDEN');
        assert.equal(llamadas.length, antes);
    }
});

test('filtros por usuario preservan el propietario aunque cambie el ID de perfil solicitado', async t => {
    const {pedir, llamadas} = entorno(t);
    assert.equal((await pedir('{empleados(idEmpleado:123){Nombre}}', 'EMPLEADO')).errors, undefined);
    assert.equal(llamadas.at(-1).inputs.find(p => p.nombre === 'IdUsuario').valor, 9);
    assert.equal(llamadas.at(-1).inputs.find(p => p.nombre === 'IdEmpleado').valor, 123);
    assert.equal((await pedir('{aseguradoras(idAseguradora:123){Nombre}}', 'CLIENTE')).errors, undefined);
    assert.equal(llamadas.at(-1).inputs.find(p => p.nombre === 'IdUsuario').valor, 9);
    assert.equal((await pedir('{empleados{Nombre}}', 'CLIENTE')).errors[0].extensions.code, 'FORBIDDEN');
    assert.equal((await pedir('{aseguradoras{Nombre}}', 'EMPLEADO')).errors, undefined);
    assert.equal(llamadas.at(-1).inputs.find(p => p.nombre === 'IdUsuario').valor, null);
});

test('NULL explícito limpia contactos y la omisión conserva sus valores', async t => {
    const {pedir, llamadas} = entorno(t);
    assert.equal((await pedir('mutation {modificarAseguradora(idAseguradora:7,datos:{telefono:null})}')).errors, undefined);
    let inputs = llamadas.at(-1).inputs;
    assert.equal(inputs.find(p => p.nombre === 'Telefono').valor, null);
    assert.equal(inputs.find(p => p.nombre === 'CambiarTelefono').valor, true);
    assert.equal(inputs.find(p => p.nombre === 'CambiarCorreo').valor, false);
    assert.ok(!inputs.some(p => p.nombre === 'Correo'));
    await pedir('mutation {modificarAseguradora(idAseguradora:7,datos:{nombre:"Prueba",correo:null})}');
    inputs = llamadas.at(-1).inputs;
    assert.equal(inputs.find(p => p.nombre === 'CambiarTelefono').valor, false);
    assert.equal(inputs.find(p => p.nombre === 'Correo').valor, null);
    assert.equal(inputs.find(p => p.nombre === 'CambiarCorreo').valor, true);
});

test('se rechazan IDs inválidos, cadenas vacías, campos obligatorios nulos y cambios vacíos', async t => {
    const {pedir, llamadas} = entorno(t);
    for (const mutation of [
        'borrarRol(idRol:0)', 'agregarRol(nombre:"   ")',
        `agregarRol(nombre:"${'x'.repeat(31)}")`,
        'modificarEmpleado(idEmpleado:7,datos:{})',
        'modificarEmpleado(idEmpleado:7,datos:{nombre:null})',
        'modificarAseguradora(idAseguradora:7,datos:{})',
        'modificarAseguradora(idAseguradora:7,datos:{idUsuario:-1})',
        'modificarAseguradora(idAseguradora:7,datos:{telefono:""})',
        'modificarUsuario(idUsuario:7,datos:{})',
        'modificarUsuario(idUsuario:7,datos:{activo:null})',
        'modificarUsuario(idUsuario:7,datos:{correo:null})',
        'modificarUsuario(idUsuario:7,datos:{clave:null})',
        'modificarUsuario(idUsuario:7,datos:{clave:""})',
        `modificarUsuario(idUsuario:7,datos:{clave:"${'x'.repeat(257)}"})`,
    ]) {
        const resultado = await pedir(`mutation {${mutation}}`);
        assert.equal(resultado.errors[0].extensions.code, 'BAD_USER_INPUT', mutation);
    }
    assert.equal(llamadas.length, 0);
});

test('errores de registro inexistente, FK y duplicados se traducen sin detalles privados', async t => {
    for (const [numero, esperado] of [[51101, 'NOT_FOUND'], [51100, 'BAD_USER_INPUT'],
        [51102, 'BAD_USER_INPUT'], [547, 'CONFLICT'], [2601, 'CONFLICT'], [2627, 'CONFLICT'],
        [50042, 'CONFLICT'], [2628, 'BAD_USER_INPUT']]) {
        const {pedir} = entorno(t, {errorSQL: numero});
        const resultado = await pedir('mutation {borrarRol(idRol:7)}');
        assert.equal(resultado.errors[0].extensions.code, esperado);
        assert.ok(!JSON.stringify(resultado).includes('privado'));
    }
});

function verificarHashIdentity(hash, clave) {
    assert.equal(typeof hash, 'string');
    assert.notEqual(hash, clave);
    const bytes = Buffer.from(hash, 'base64');
    assert.equal(bytes.length, 61);
    assert.equal(bytes[0], 1);
    assert.equal(bytes.readUInt32BE(1), 2);
    assert.equal(bytes.readUInt32BE(5), 100000);
    const sal = bytes.subarray(13, 13 + bytes.readUInt32BE(9));
    assert.equal(sal.length, 16);
    const calculada = pbkdf2Sync(clave, sal, bytes.readUInt32BE(5), bytes.length - 13 - sal.length, 'sha512');
    assert.ok(timingSafeEqual(calculada, bytes.subarray(13 + sal.length)));
}

test('alta y cambio de contraseña envían hashes Identity con sal distinta y revocan sesiones', async t => {
    const {pedir, llamadas, sesiones, token} = entorno(t);
    const clave = '  Contraseña ficticia 🔧  ';
    const alta = await pedir('mutation($clave:String!){agregarUsuario(datos:{idRol:2,correo:"ficticio@example.invalid",clave:$clave})}',
        'ADMINISTRADOR', {clave});
    assert.equal(alta.errors, undefined);
    assert.equal(alta.data.agregarUsuario, 7);
    const parametrosAlta = llamadas.at(-1).inputs;
    assert.equal(parametrosAlta.find(p => p.nombre === 'Activo').valor, true);
    const hashAlta = parametrosAlta.find(p => p.nombre === 'Contrasena').valor;
    verificarHashIdentity(hashAlta, clave);
    const sesion = token('CLIENTE', 7);
    const cambio = await pedir('mutation($clave:String!){modificarUsuario(idUsuario:7,datos:{clave:$clave})}',
        'ADMINISTRADOR', {clave});
    assert.equal(cambio.errors, undefined);
    const hashCambio = llamadas.at(-1).inputs.find(p => p.nombre === 'Contrasena').valor;
    verificarHashIdentity(hashCambio, clave);
    assert.notEqual(hashAlta, hashCambio);
    assert.equal(sesiones.obtener(sesion), null);
    assert.ok(!JSON.stringify(cambio).includes(hashCambio));
    assert.ok(!JSON.stringify(alta).includes(clave));
    await pedir('mutation{modificarUsuario(idUsuario:7,datos:{correo:"otro@example.invalid"})}');
    assert.ok(!llamadas.at(-1).inputs.some(p => p.nombre === 'Contrasena'));
});

test('alta no acepta clave vacía o excesiva, NULL obligatorio ni hashes desde el cliente', async t => {
    const {pedir, llamadas} = entorno(t);
    for (const clave of ['', 'x'.repeat(257)]) {
        const resultado = await pedir('mutation($clave:String!){agregarUsuario(datos:{idRol:2,correo:"ficticio@example.invalid",clave:$clave})}',
            'ADMINISTRADOR', {clave});
        assert.equal(resultado.errors[0].extensions.code, 'BAD_USER_INPUT');
    }
    const activoNulo = await pedir('mutation{agregarUsuario(datos:{idRol:2,correo:"ficticio@example.invalid",clave:"prueba",activo:null})}');
    assert.equal(activoNulo.errors[0].extensions.code, 'BAD_USER_INPUT');
    const hashExterno = await pedir('mutation{agregarUsuario(datos:{idRol:2,correo:"ficticio@example.invalid",clave:"prueba",hashContrasena:"externo"})}');
    assert.equal(hashExterno.errors[0].extensions.code, 'GRAPHQL_VALIDATION_FAILED');
    assert.equal(llamadas.length, 0);
});

test('modificar o borrar usuario revoca sus sesiones locales y conserva las de otros usuarios', async t => {
    const {pedir, sesiones, token} = entorno(t);
    for (const mutation of ['modificarUsuario(idUsuario:7,datos:{activo:false})', 'borrarUsuario(idUsuario:8)']) {
        const id = mutation.startsWith('modificar') ? 7 : 8;
        const objetivo = token('CLIENTE', id);
        const ajeno = token('CLIENTE', 123);
        assert.equal((await pedir(`mutation {${mutation}}`)).errors, undefined);
        assert.equal(sesiones.obtener(objetivo), null);
        assert.ok(sesiones.obtener(ajeno));
    }
});

test('una escritura fallida no revoca sesiones y el schema no expone hashes', async t => {
    const {pedir, sesiones, token} = entorno(t, {errorSQL: 547});
    const objetivo = token('CLIENTE', 7);
    const resultado = await pedir('mutation {borrarUsuario(idUsuario:7)}');
    assert.equal(resultado.errors[0].extensions.code, 'CONFLICT');
    assert.ok(sesiones.obtener(objetivo));
    const introspeccion = await pedir('{__type(name:"Usuario"){fields{name}}}');
    assert.deepEqual(introspeccion.data.__type.fields.map(f => f.name), ['IdUsuario', 'IdRol', 'Correo', 'Activo']);
});
