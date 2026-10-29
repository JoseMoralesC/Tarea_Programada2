import {ApolloServer} from '@apollo/server';
import {crearContexto} from './auth/contexto.js';
import {crearSesiones} from './auth/sesiones.js';
import * as autenticacion from './modules/autenticacion.js';
import * as categoria from './modules/categoria.js';
import * as marca from './modules/marca.js';
import * as rol from './modules/rol.js';
import * as usuario from './modules/usuario.js';
import * as empleado from './modules/empleado.js';
import * as aseguradora from './modules/aseguradora.js';
import * as scalars from './graphql/scalars.js';
import * as caso from './modules/caso.js';
import * as cotizacion from './modules/cotizacion.js';
import * as detalleCotizacion from './modules/detalleCotizacion.js';
import * as venta from './modules/venta.js';
import * as detalleVenta from './modules/detalleVenta.js';
import * as envio from './modules/envio.js';
import * as auditoria from './modules/auditoria.js';

export function crearServidor({
    obtenerPool,
    cerrarPools = async () => {},
    rolLogin = 'cliente',
    genericoHabilitado = false,
    sesiones = crearSesiones(),
}) {
    const modulos = [scalars, categoria, marca, rol, usuario, empleado, aseguradora,
        caso, cotizacion, detalleCotizacion, venta, detalleVenta, envio, auditoria];
    const server = new ApolloServer({
        typeDefs: [autenticacion.typeDefs, ...modulos.map(modulo => modulo.typeDefs)],
        resolvers: [
            autenticacion.crearResolversAutenticacion({obtenerPool, rolLogin, sesiones}),
            ...modulos.map(modulo => modulo.resolvers),
        ],
        includeStacktraceInErrorResponses: false,
        formatError(error) {
            if (error.extensions?.code === 'INTERNAL_SERVER_ERROR') {
                return {
                    message: 'No se pudo completar la operación',
                    path: error.path,
                    extensions: {code: 'INTERNAL_SERVER_ERROR'},
                };
            }
            return error;
        },
        plugins: [{
            async serverWillStart() {
                return {
                    async serverWillStop() {
                        sesiones.limpiar();
                        await cerrarPools();
                    },
                };
            },
        }],
    });
    return {server, context: crearContexto({sesiones, obtenerPool, genericoHabilitado})};
}
