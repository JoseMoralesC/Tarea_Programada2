import {crearCrudNegocio, campoId, campoFecha, campoEstado} from './crud-negocio.js';

export const typeDefs = `#graphql
    type Cotizacion { IdCotizacion: Int!, IdCaso: Int!, IdEmpleado: Int!, Fecha: FechaHora!, Estado: EstadoCotizacion!, Total: Dinero! }
    input CotizacionInput { idCaso: Int!, idEmpleado: Int, fecha: FechaHora, estado: EstadoCotizacion! }
    input CotizacionCambios { idCaso: Int, idEmpleado: Int, fecha: FechaHora, estado: EstadoCotizacion }
    extend type Query { cotizaciones(idCotizacion: Int, idCaso: Int): [Cotizacion!]! }
    extend type Mutation {
        agregarCotizacion(datos: CotizacionInput!): Int!
        modificarCotizacion(idCotizacion: Int!, datos: CotizacionCambios!): Boolean!
        borrarCotizacion(idCotizacion: Int!): Boolean!
    }
`;

export const resolvers = crearCrudNegocio({
    nombre: 'Cotizacion', consulta: 'cotizaciones', id: 'IdCotizacion',
    autoria: true,
    campos: {
        idCaso: campoId('IdCaso'), idEmpleado: campoId('IdEmpleado'), fecha: campoFecha('Fecha'),
        estado: campoEstado('Estado', ['Pendiente', 'Aprobada', 'Rechazada']),
    },
    filtros: {idCaso: campoId('IdCaso')},
});

