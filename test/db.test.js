import test from 'node:test';
import assert from 'node:assert/strict';
import {crearGestorPools} from '../src/db.js';

const config = {
    db: {server: 'localhost', options: {encrypt: true}},
    roles: {cliente: {user: 'cliente'}, empleado: {user: 'empleado'}},
};

test('solicitudes concurrentes comparten pool del mismo rol y aíslan los roles', async () => {
    const instancias = [];
    let liberar;
    const espera = new Promise(resolve => {liberar = resolve;});
    class Pool {
        constructor(options) {this.options = options; this.cierres = 0; instancias.push(this);}
        on() {}
        async connect() {await espera; return this;}
        async close() {this.cierres++;}
    }
    const gestor = crearGestorPools(config, Pool);
    const cliente = gestor.obtenerPool('cliente');
    assert.equal(cliente, gestor.obtenerPool('cliente'));
    const empleado = gestor.obtenerPool('empleado');
    liberar();
    const [a, b] = await Promise.all([cliente, empleado]);
    assert.notEqual(a, b);
    assert.equal(a.options.user, 'cliente');
    assert.equal(b.options.user, 'empleado');
    assert.notEqual(a.options.options, b.options.options);
    assert.equal(instancias.length, 2);
    await assert.rejects(gestor.obtenerPool('setup'), /no configurado/);
    await assert.rejects(gestor.obtenerPool('toString'), /no configurado/);
    await Promise.all([gestor.cerrarPools(), gestor.cerrarPools()]);
    assert.ok(instancias.every(pool => pool.cierres === 1));
    await assert.rejects(gestor.obtenerPool('cliente'), /cerrando/);
});

test('una conexión fallida se libera y permite reintentar', async () => {
    let intentos = 0;
    let cierres = 0;
    class Pool {
        on() {}
        async connect() {if (++intentos === 1) throw new Error('fallo simulado'); return this;}
        async close() {cierres++;}
    }
    const gestor = crearGestorPools(config, Pool);
    await assert.rejects(gestor.obtenerPool('cliente'), /fallo simulado/);
    await gestor.obtenerPool('cliente');
    await gestor.cerrarPools();
    assert.equal(intentos, 2);
    assert.equal(cierres, 2);
});

test('el cierre espera las conexiones que todavía están abriendo', async () => {
    let liberar;
    let cerrado = false;
    const espera = new Promise(resolve => {liberar = resolve;});
    class Pool {
        on() {}
        async connect() {await espera; return this;}
        async close() {cerrado = true;}
    }
    const gestor = crearGestorPools(config, Pool);
    const conexion = gestor.obtenerPool('cliente');
    const cierre = gestor.cerrarPools();
    assert.equal(cerrado, false);
    liberar();
    await Promise.all([conexion, cierre]);
    assert.equal(cerrado, true);
});
