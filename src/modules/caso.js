import {crearCrudNegocio, campoId, campoTexto, campoEstado, campoFecha} from './crud-negocio.js';

export const typeDefs = `#graphql
    type Caso { IdCaso: Int!, IdAseguradora: Int!, IdModelo: Int!, Placa: String!, Estado: EstadoCaso!, FechaApertura: FechaHora! }
    input CasoInput { idAseguradora: Int!, idModelo: Int!, placa: String!, estado: EstadoCaso!, fechaApertura: FechaHora }
    input CasoCambios { idAseguradora: Int, idModelo: Int, placa: String, estado: EstadoCaso, fechaApertura: FechaHora }
    extend type Query { casos(idCaso: Int, idAseguradora: Int): [Caso!]! }
    extend type Mutation {
        agregarCaso(datos: CasoInput!): Int!
        modificarCaso(idCaso: Int!, datos: CasoCambios!): Boolean!
        borrarCaso(idCaso: Int!): Boolean!
    }
`;

export const resolvers = crearCrudNegocio({
    nombre: 'Caso', consulta: 'casos', id: 'IdCaso',
    campos: {
        idAseguradora: campoId('IdAseguradora'), idModelo: campoId('IdModelo'), placa: campoTexto('Placa', 10),
        estado: campoEstado('Estado', ['Abierto', 'En proceso', 'Cerrado', 'Rechazado'], 20), fechaApertura: campoFecha('FechaApertura'),
    },
    filtros: {idAseguradora: campoId('IdAseguradora')},
});

