import test from 'node:test';
import assert from 'node:assert/strict';
import {cargarConfig} from '../src/config.js';

const envBase = {
    DB_SERVER: 'localhost', DB_PORT: '1433', DB_DATABASE: 'prueba',
    DB_ENCRYPT: 'true', DB_TRUST_SERVER_CERTIFICATE: 'false',
    DB_CLIENT_USER: 'cliente_prueba', DB_CLIENT_PASSWORD: 'ficticia',
    DB_EMPLOYEE_USER: 'empleado_prueba', DB_EMPLOYEE_PASSWORD: 'ficticia',
};

test('configuración separa identidades y deja desactivado el acceso genérico', () => {
    const config = cargarConfig(envBase);
    assert.equal(config.puerto, 4000);
    assert.equal(config.db.port, 1433);
    assert.deepEqual(config.db.options, {encrypt: true, trustServerCertificate: false});
    assert.equal(config.rolLogin, 'cliente');
    assert.equal(config.genericoHabilitado, false);
    assert.deepEqual(Object.keys(config.roles), ['cliente', 'empleado']);
});

test('configuración rechaza puertos, booleanos y credenciales inválidos', () => {
    for (const key of ['PORT', 'DB_PORT']) {
        for (const value of ['', '0', '65536', '-1', '1.5', 'abc', 'Infinity', '1e3', ' ']) {
            assert.throws(() => cargarConfig({...envBase, [key]: value}), new RegExp(key));
        }
    }
    for (const key of ['DB_ENCRYPT', 'DB_TRUST_SERVER_CERTIFICATE', 'DB_GENERIC_ENABLED']) {
        for (const value of ['TRUE', 'yes', '0', '']) {
            assert.throws(() => cargarConfig({...envBase, [key]: value}), new RegExp(key));
        }
    }
    for (const key of Object.keys(envBase)) {
        const env = {...envBase};
        delete env[key];
        assert.throws(() => cargarConfig(env), new RegExp(key));
    }
    assert.throws(() => cargarConfig({...envBase, DB_EMPLOYEE_USER: ' '}), /DB_EMPLOYEE_USER/);
    assert.equal(cargarConfig({...envBase, PORT: '1', DB_PORT: '65535'}).puerto, 1);
});

test('roles SQL distintos y login sin mantenimiento ni empleado', () => {
    assert.throws(() => cargarConfig({...envBase, DB_EMPLOYEE_USER: 'CLIENTE_PRUEBA'}), /distinta/);
    for (const rol of ['empleado', 'setup', 'administrador', 'generico']) {
        assert.throws(() => cargarConfig({...envBase, DB_LOGIN_ROLE: rol}), /DB_LOGIN_ROLE/);
    }
    assert.throws(() => cargarConfig({...envBase, DB_GENERIC_ENABLED: 'true'}), /DB_GENERIC_USER/);
    const config = cargarConfig({...envBase, DB_GENERIC_ENABLED: 'true', DB_LOGIN_ROLE: 'generico',
        DB_GENERIC_USER: 'generico_prueba', DB_GENERIC_PASSWORD: 'ficticia'});
    assert.equal(config.rolLogin, 'generico');
    assert.equal(config.roles.generico.user, 'generico_prueba');
});
