import {crearCrudCatalogo} from './crud-catalogo.js';

export const typeDefs = `#graphql
  type Compra {
    IdCompra: Int!
    IdProveedor: Int!
    IdBodega: Int!
    Fecha: String!
    FechaRecepcion: String
    Total: Float!
  }

  extend type Query {
    compras(idCompra: Int): [Compra!]!
  }

  extend type Mutation {
    agregarCompra(idProveedor: Int!, idBodega: Int!, fecha: String, fechaRecepcion: String): Int!
    modificarCompra(idCompra: Int!, idProveedor: Int, idBodega: Int, fecha: String, fechaRecepcion: String): Boolean!
    borrarCompra(idCompra: Int!): Boolean!
  }
`;

export const resolvers = crearCrudCatalogo({
    "nombre": "Compra",
    "consulta": "compras",
    "campos": {
        "IdProveedor": {
            "tipo": "id"
        },
        "IdBodega": {
            "tipo": "id"
        },
        "Fecha": {
            "tipo": "fecha"
        },
        "FechaRecepcion": {
            "tipo": "fecha",
            "nullable": true
        }
    },
    "requeridos": [
        "IdProveedor",
        "IdBodega"
    ],
    "filtros": [
        "IdCompra"
    ]
});
