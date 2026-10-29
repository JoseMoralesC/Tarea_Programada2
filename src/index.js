import {startStandaloneServer} from '@apollo/server/standalone';
import {cargarConfig} from './config.js';
import {crearGestorPools} from './db.js';
import {crearServidor} from './server.js';

const config = cargarConfig();
const gestor = crearGestorPools(config);
const {server, context} = crearServidor({...gestor, ...config});

try {
    const {url} = await startStandaloneServer(server, {
        listen: {port: config.puerto},
        context,
    });
    console.log(`Servidor GraphQL listo en ${url}`);
} catch (error) {
    await gestor.cerrarPools();
    throw error;
}
