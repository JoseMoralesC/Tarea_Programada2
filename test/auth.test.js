import test from 'node:test';
import assert from 'node:assert/strict';
import {crearServidor} from '../src/server.js';
import {crearSesiones} from '../src/auth/sesiones.js';
import {startStandaloneServer} from '@apollo/server/standalone';

function entorno(t, opciones = {}) {
    const llamadas = [];
    const sesiones = opciones.sesiones ?? crearSesiones();
    const obtenerPool = async rol => ({request() {
        const inputs = [];
        return {
            input(nombre, tipo, valor) {inputs.push({nombre, tipo, valor}); return this;},
            output(nombre) {inputs.push({nombre, output: true}); return this;},
            async execute(sp) {
                llamadas.push({rol, sp, inputs});
                if (opciones.errorSQL) throw new Error('SQL interno con dato sensible ficticio');
                if (sp === 'dbo.LoginUsuario') {
                    if (inputs.find(p => p.nombre === 'Clave').valor !== 'clave ficticia') {
                        return {output: {Valido: false}, recordset: []};
                    }
                    const nombreRol = inputs.find(p => p.nombre === 'Correo').valor.split('@')[0];
                    return {output: {Valido: true}, recordset: [{
                        IdUsuario: 7, Correo: `${nombreRol}@prueba.test`, Nombre: 'Prueba',
                        Rol: nombreRol, IdEmpleado: nombreRol === 'Cliente' ? null : 3,
                        IdAseguradora: nombreRol === 'Cliente' ? 4 : null,
                        HashContrasena: 'hash ficticio que no debe publicarse',
                    }]};
                }
                if (sp.startsWith('Consultar')) return {recordset: [{Id: 7, Nombre: 'Prueba'}]};
                return {recordset: [{IdMarca: 7, IdCategoria: 7}]};
            },
        };
    }});
    const {server, context} = crearServidor({obtenerPool, sesiones, ...opciones});
    t.after(() => server.stop());
    async function pedir(query, {token, headers = {}, variables} = {}) {
        const contexto = await context({req: {headers: {...headers,
            ...(token ? {authorization: `Bearer ${token}`} : {})}}});
        const respuesta = await server.executeOperation({query, variables}, {contextValue: contexto});
        assert.equal(respuesta.body.kind, 'single');
        return respuesta.body.singleResult;
    }
    async function login(rol = 'Empleado') {
        const resultado = await pedir(`mutation($correo: String!, $clave: String!) {
            login(correo: $correo, clave: $clave) {
                token expiraEn usuario { idUsuario correo nombre rol idEmpleado idAseguradora }
            }
        }`, {variables: {correo: `${rol}@prueba.test`, clave: 'clave ficticia'}});
        assert.equal(resultado.errors, undefined);
        return resultado.data.login;
    }
    return {llamadas, pedir, login, server, context};
}

test('login parametriza el SP esperado sin publicar hashes; logout revoca el token (SQL simulado)', async t => {
    const {pedir, login, llamadas} = entorno(t);
    const sesion = await login('Cliente');
    assert.match(sesion.token, /^[a-f0-9]{64}$/);
    assert.equal(sesion.usuario.rol, 'CLIENTE');
    assert.ok(!JSON.stringify(sesion).includes('hash ficticio'));
    assert.equal(llamadas[0].rol, 'cliente');
    assert.equal(llamadas[0].sp, 'dbo.LoginUsuario');
    assert.equal(llamadas[0].inputs.find(p => p.nombre === 'Valido').output, true);
    const consulta = await pedir('{ sesion { idUsuario rol } }', {token: sesion.token});
    assert.equal(consulta.data.sesion.idUsuario, 7);
    assert.equal((await pedir('mutation { cerrarSesion }', {token: sesion.token})).data.cerrarSesion, true);
    await assert.rejects(pedir('{ sesion { rol } }', {token: sesion.token}), /inválida/);
});

test('credenciales incorrectas o rol desconocido no generan una sesión', async t => {
    const {pedir} = entorno(t);
    for (const [correo, clave] of [['Cliente@prueba.test', 'incorrecta'], ['Otro@prueba.test', 'clave ficticia']]) {
        const resultado = await pedir('mutation($correo:String!,$clave:String!) { login(correo:$correo,clave:$clave) { token } }',
            {variables: {correo, clave}});
        assert.equal(resultado.errors[0].extensions.code, 'UNAUTHENTICATED');
        assert.equal(resultado.data, null);
    }
});

test('empleado ejecuta las ocho operaciones de catálogo con su pool', async t => {
    const {pedir, login, llamadas} = entorno(t);
    const {token} = await login();
    for (const entidad of ['Categoria', 'Marca']) {
        const plural = entidad === 'Marca' ? 'marcas' : 'categorias';
        const operaciones = [
            [`{ ${plural} { Id${entidad} Nombre } }`, null],
            [`mutation { agregar${entidad}(nombre:"Prueba") }`, 1],
            [`mutation { modificar${entidad}(id${entidad}:7,nombre:"Cambio") }`, 2],
            [`mutation { borrar${entidad}(id${entidad}:7) }`, 3],
        ];
        for (const [query, selector] of operaciones) {
            const resultado = await pedir(query, {token});
            assert.equal(resultado.errors, undefined);
            const llamada = llamadas.at(-1);
            assert.equal(llamada.rol, 'empleado');
            if (selector) {
                assert.equal(llamada.sp, `Mantenimiento${entidad}`);
                assert.equal(llamada.inputs.find(p => p.nombre === 'function').valor, selector);
                if (selector !== 1) assert.equal(llamada.inputs.find(p => p.nombre === `Id${entidad}`).valor, 7);
                if (selector !== 3) assert.equal(llamada.inputs.find(p => p.nombre === 'Nombre').tipo.length,
                    entidad === 'Marca' ? 50 : 60);
            }
        }
    }
    const invalida = await pedir('mutation { borrarMarca(idCategoria:7) }', {token});
    assert.equal(invalida.errors[0].extensions.code, 'GRAPHQL_VALIDATION_FAILED');
    assert.equal(llamadas.length, 9);
});

test('cliente consulta con su pool y no puede escribir aunque envíe un rol falso', async t => {
    const {pedir, login, llamadas} = entorno(t);
    const {token} = await login('Cliente');
    const lectura = await pedir('{ marcas { Nombre } categorias { Nombre } }', {token, headers: {rol: 'empleado'}});
    assert.equal(lectura.errors, undefined);
    assert.ok(llamadas.every(llamada => llamada.rol === 'cliente'));
    const antes = llamadas.length;
    for (const entidad of ['Marca', 'Categoria']) {
        for (const query of [
            `mutation { agregar${entidad}(nombre:"Prueba") }`,
            `mutation { modificar${entidad}(id${entidad}:7,nombre:"Cambio") }`,
            `mutation { borrar${entidad}(id${entidad}:7) }`,
        ]) {
            const respuesta = await pedir(query, {token, headers: {rol: 'administrador'}});
            assert.equal(respuesta.errors[0].extensions.code, 'FORBIDDEN');
        }
    }
    assert.equal(llamadas.length, antes);
});

test('administrador usa la conexión de empleado', async t => {
    const {pedir, login, llamadas} = entorno(t);
    const {token} = await login('Administrador');
    assert.equal((await pedir('mutation { borrarMarca(idMarca:7) }', {token})).errors, undefined);
    assert.equal(llamadas.at(-1).rol, 'empleado');
});

test('sin sesión, rol falso y tokens manipulados no dan acceso a SQL', async t => {
    const {pedir, llamadas} = entorno(t);
    const respuesta = await pedir('{ marcas { Nombre } }', {headers: {rol: 'empleado'}});
    assert.equal(respuesta.errors[0].extensions.code, 'UNAUTHENTICATED');
    for (const authorization of ['Bearer falso', `Bearer ${'a'.repeat(64)}`, 'Basic abc']) {
        await assert.rejects(pedir('{ marcas { Nombre } }', {headers: {authorization}}), /inválida/);
    }
    assert.equal(llamadas.length, 0);
});

test('acceso genérico explícito solo permite lectura de catálogo', async t => {
    const {pedir, llamadas} = entorno(t, {genericoHabilitado: true});
    assert.equal((await pedir('{ marcas { Nombre } categorias { Nombre } }')).errors, undefined);
    assert.ok(llamadas.every(llamada => llamada.rol === 'generico'));
    const respuesta = await pedir('mutation { borrarMarca(idMarca:7) }');
    assert.equal(respuesta.errors[0].extensions.code, 'UNAUTHENTICATED');
    assert.equal(llamadas.length, 2);
});

test('expiración y cierre del servidor invalidan las sesiones', async t => {
    let instante = 1000;
    const sesiones = crearSesiones({ahora: () => instante, duracionMs: 100, maximo: 1});
    const {pedir, login, server} = entorno(t, {sesiones});
    const {token} = await login();
    instante += 100;
    await assert.rejects(pedir('{ sesion { rol } }', {token}), /vencida/);
    assert.equal(sesiones.obtener(token), null);
    const siguiente = sesiones.crear({idUsuario: 2});
    assert.throws(() => sesiones.crear({idUsuario: 3}), /límite/);
    sesiones.limpiar();
    assert.equal(sesiones.obtener(siguiente.token), null);
    const activa = sesiones.crear({idUsuario: 4});
    await server.stop();
    assert.equal(sesiones.obtener(activa.token), null);
});

test('los errores SQL no publican mensajes internos', async t => {
    const otro = entorno(t, {errorSQL: true});
    const respuesta = await otro.pedir('mutation { login(correo:"a@b.test",clave:"prueba") { token } }');
    assert.equal(respuesta.errors[0].extensions.code, 'INTERNAL_SERVER_ERROR');
    assert.ok(!JSON.stringify(respuesta).includes('sensible'));
});

test('HTTP integra login, Bearer, conexión de cliente y denegación de escritura (SQL simulado)', async t => {
    const {server, context, llamadas} = entorno(t);
    const {url} = await startStandaloneServer(server, {context, listen: {port: 0, host: '127.0.0.1'}});
    const post = async (query, authorization) => {
        const response = await fetch(url, {
            method: 'POST',
            headers: {'content-type': 'application/json', ...(authorization ? {authorization} : {})},
            body: JSON.stringify({query}),
        });
        return response.json();
    };
    const login = await post('mutation { login(correo:"Cliente@prueba.test",clave:"clave ficticia") { token } }');
    assert.equal(login.errors, undefined);
    const bearer = `bearer ${login.data.login.token}`;
    assert.equal((await post('{ marcas { Nombre } }', bearer)).errors, undefined);
    const escritura = await post('mutation { borrarMarca(idMarca:7) }', bearer);
    assert.equal(escritura.errors[0].extensions.code, 'FORBIDDEN');
    assert.equal(llamadas.length, 2);
    const invalida = await post('{ marcas { Nombre } }', `Bearer ${'a'.repeat(64)}`);
    assert.equal(invalida.errors[0].extensions.code, 'UNAUTHENTICATED');
});
