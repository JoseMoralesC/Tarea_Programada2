import {crearCrudNegocio, campoId, campoTexto, campoDinero, campoEstado, campoFecha} from './crud-negocio.js';

export const typeDefs = `#graphql
    type Envio { IdEnvio: Int!, IdVenta: Int!, Direccion: String!, Costo: Dinero!, Estado: EstadoEnvio!, FechaEntrega: FechaHora }
    input EnvioInput { idVenta: Int!, direccion: String!, costo: Dinero!, estado: EstadoEnvio!, fechaEntrega: FechaHora }
    input EnvioCambios { idVenta: Int, direccion: String, costo: Dinero, estado: EstadoEnvio, fechaEntrega: FechaHora }
    extend type Query { envios(idEnvio: Int, idVenta: Int): [Envio!]! }
    extend type Mutation {
        agregarEnvio(datos: EnvioInput!): Int!
        modificarEnvio(idEnvio: Int!, datos: EnvioCambios!): Boolean!
        borrarEnvio(idEnvio: Int!): Boolean!
    }
`;

export const resolvers = crearCrudNegocio({
    nombre: 'Envio', consulta: 'envios', id: 'IdEnvio',
    campos: {
        idVenta: campoId('IdVenta'), direccion: campoTexto('Direccion', 200, true), costo: campoDinero('Costo'),
        estado: campoEstado('Estado', ['Pendiente', 'En camino', 'Entregado']), fechaEntrega: campoFecha('FechaEntrega', true),
    },
    filtros: {idVenta: campoId('IdVenta')},
});

