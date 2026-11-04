import {crearCrudCatalogo} from './crud-catalogo.js';

export const typeDefs = `#graphql
  type DetalleCompra {
    IdDetalle: Int!
    IdCompra: Int!
    IdRepuesto: Int!
    Cantidad: Int!
    Costo: Float!
  }

  extend type Query {
    detallesCompra(idDetalle: Int, idCompra: Int): [DetalleCompra!]!
  }

  extend type Mutation {
    agregarDetalleCompra(idCompra: Int!, idRepuesto: Int!, cantidad: Int!, costo: Float!): Int!
    modificarDetalleCompra(idDetalle: Int!, idCompra: Int, idRepuesto: Int, cantidad: Int, costo: Float): Boolean!
    borrarDetalleCompra(idDetalle: Int!): Boolean!
  }
`;

export const resolvers = crearCrudCatalogo({
    "nombre": "DetalleCompra",
    "consulta": "detallesCompra",
    "ids": [
        "IdDetalle"
    ],
    "campos": {
        "IdCompra": {
            "tipo": "id"
        },
        "IdRepuesto": {
            "tipo": "id"
        },
        "Cantidad": {
            "tipo": "entero",
            "minimo": 1
        },
        "Costo": {
            "tipo": "dinero"
        }
    },
    "requeridos": [
        "IdCompra",
        "IdRepuesto",
        "Cantidad",
        "Costo"
    ],
    "filtros": [
        "IdDetalle",
        "IdCompra"
    ]
});
