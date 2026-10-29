import {crearCrudNegocio, campoId, campoDinero, campoEstado} from './crud-negocio.js';

export const typeDefs = `#graphql
    type DetalleCotizacion { IdDetalle: Int!, IdCotizacion: Int!, IdRepuesto: Int!, Cantidad: Int!, Precio: Dinero!, Estado: EstadoDetalleCotizacion! }
    input DetalleCotizacionInput { idCotizacion: Int!, idRepuesto: Int!, cantidad: Int!, precio: Dinero!, estado: EstadoDetalleCotizacion! }
    input DetalleCotizacionCambios { idCotizacion: Int, idRepuesto: Int, cantidad: Int, precio: Dinero, estado: EstadoDetalleCotizacion }
    extend type Query { detallesCotizacion(idDetalle: Int, idCotizacion: Int): [DetalleCotizacion!]! }
    extend type Mutation {
        agregarDetalleCotizacion(datos: DetalleCotizacionInput!): Int!
        modificarDetalleCotizacion(idDetalle: Int!, datos: DetalleCotizacionCambios!): Boolean!
        borrarDetalleCotizacion(idDetalle: Int!): Boolean!
    }
`;

export const resolvers = crearCrudNegocio({
    nombre: 'DetalleCotizacion', consulta: 'detallesCotizacion', id: 'IdDetalle',
    campos: {
        idCotizacion: campoId('IdCotizacion'), idRepuesto: campoId('IdRepuesto'), cantidad: campoId('Cantidad'),
        precio: campoDinero('Precio'), estado: campoEstado('Estado', ['Pendiente', 'Aprobado', 'Rechazado']),
    },
    filtros: {idCotizacion: campoId('IdCotizacion')},
});

