import {crearCrudCatalogo} from './crud-catalogo.js';

export const typeDefs = `#graphql
  type Inventario {
    IdInventario: Int!
    IdBodega: Int!
    IdRepuesto: Int!
    Cantidad: Int!
  }

  extend type Query {
    inventario(idInventario: Int, idBodega: Int, idRepuesto: Int): [Inventario!]!
  }

  extend type Mutation {
    agregarInventario(idBodega: Int!, idRepuesto: Int!, cantidad: Int!): Int!
    modificarInventario(idInventario: Int!, idBodega: Int, idRepuesto: Int, cantidad: Int): Boolean!
    borrarInventario(idInventario: Int!): Boolean!
  }
`;

export const resolvers = crearCrudCatalogo({
    "nombre": "Inventario",
    "consulta": "inventario",
    "campos": {
        "IdBodega": {
            "tipo": "id"
        },
        "IdRepuesto": {
            "tipo": "id"
        },
        "Cantidad": {
            "tipo": "entero",
            "minimo": 0
        }
    },
    "requeridos": [
        "IdBodega",
        "IdRepuesto",
        "Cantidad"
    ],
    "filtros": [
        "IdInventario",
        "IdBodega",
        "IdRepuesto"
    ]
});
