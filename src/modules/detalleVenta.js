import {crearCrudNegocio, campoId, campoDinero} from './crud-negocio.js';

export const typeDefs = `#graphql
    type DetalleVenta { IdDetalle: Int!, IdVenta: Int!, IdRepuesto: Int!, IdBodega: Int!, Cantidad: Int!, Precio: Dinero!, Costo: Dinero }
    input DetalleVentaInput { idVenta: Int!, idRepuesto: Int!, idBodega: Int!, cantidad: Int!, precio: Dinero!, costo: Dinero! }
    input DetalleVentaCambios { idVenta: Int, idRepuesto: Int, idBodega: Int, cantidad: Int, precio: Dinero, costo: Dinero }
    extend type Query { detallesVenta(idDetalle: Int, idVenta: Int): [DetalleVenta!]! }
    extend type Mutation {
        agregarDetalleVenta(datos: DetalleVentaInput!): Int!
        modificarDetalleVenta(idDetalle: Int!, datos: DetalleVentaCambios!): Boolean!
        borrarDetalleVenta(idDetalle: Int!): Boolean!
    }
`;

export const resolvers = crearCrudNegocio({
    nombre: 'DetalleVenta', consulta: 'detallesVenta', id: 'IdDetalle',
    campos: {
        idVenta: campoId('IdVenta'), idRepuesto: campoId('IdRepuesto'), idBodega: campoId('IdBodega'),
        cantidad: campoId('Cantidad'), precio: campoDinero('Precio'), costo: campoDinero('Costo'),
    },
    filtros: {idVenta: campoId('IdVenta')},
});

// Protección adicional aunque una implementación de consulta devuelva columnas internas.
resolvers.DetalleVenta = {
    Costo: (fila, _, contexto) => contexto.identidad?.rol === 'CLIENTE' ? null : fila.Costo,
};

