import {createHash, randomBytes} from 'node:crypto';

const claveToken = (token) => createHash('sha256').update(token).digest('hex');

// Sesiones de una instancia: se invalidan al reiniciar el proceso.
export function crearSesiones({duracionMs = 3_600_000, ahora = Date.now, maximo = 1000} = {}) {
    const sesiones = new Map();

    function crear(identidad) {
        const instante = ahora();
        for (const [clave, sesion] of sesiones) {
            if (sesion.expira <= instante) sesiones.delete(clave);
        }
        if (sesiones.size >= maximo) throw new Error('Se alcanzó el límite de sesiones');
        const token = randomBytes(32).toString('hex');
        const expira = instante + duracionMs;
        sesiones.set(claveToken(token), {identidad: Object.freeze({...identidad}), expira});
        return {token, expiraEn: new Date(expira).toISOString()};
    }

    function obtener(token) {
        if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return null;
        const clave = claveToken(token);
        const sesion = sesiones.get(clave);
        if (!sesion) return null;
        if (sesion.expira <= ahora()) {
            sesiones.delete(clave);
            return null;
        }
        return sesion.identidad;
    }

    function revocar(token) {
        if (typeof token !== 'string') return false;
        return sesiones.delete(claveToken(token));
    }

    function revocarUsuario(idUsuario) {
        for (const [clave, sesion] of sesiones) {
            if (sesion.identidad.idUsuario === idUsuario) sesiones.delete(clave);
        }
    }

    return {crear, obtener, revocar, revocarUsuario, limpiar: () => sesiones.clear()};
}
