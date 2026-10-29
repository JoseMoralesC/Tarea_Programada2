import {crearCrudNegocio, campoId, campoFecha} from './crud-negocio.js';

export const typeDefs = `#graphql
    type Venta { IdVenta: Int!, IdCotizacion: Int!, IdEmpleado: Int!, Fecha: FechaHora!, Total: Dinero! }
    input VentaInput { idCotizacion: Int!, idEmpleado: Int, fecha: FechaHora }
    input VentaCambios { idCotizacion: Int, idEmpleado: Int, fecha: FechaHora }
    extend type Query { ventas(idVenta: Int, idCotizacion: Int): [Venta!]! }
    extend type Mutation {
        agregarVenta(datos: VentaInput!): Int!
        modificarVenta(idVenta: Int!, datos: VentaCambios!): Boolean!
        borrarVenta(idVenta: Int!): Boolean!
    }
`;

export const resolvers = crearCrudNegocio({
    nombre: 'Venta', consulta: 'ventas', id: 'IdVenta',
    autoria: true,
    campos: {idCotizacion: campoId('IdCotizacion'), idEmpleado: campoId('IdEmpleado'), fecha: campoFecha('Fecha')},
    filtros: {idCotizacion: campoId('IdCotizacion')},
});

