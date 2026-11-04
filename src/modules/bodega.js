import {crearCrudCatalogo} from './crud-catalogo.js';

export const typeDefs = `#graphql
  type Bodega {
    IdBodega: Int!
    Nombre: String!
    Ubicacion: String!
  }

  extend type Query {
    bodegas(idBodega: Int): [Bodega!]!
  }

  extend type Mutation {
    agregarBodega(nombre: String!, ubicacion: String!): Int!
    modificarBodega(idBodega: Int!, nombre: String, ubicacion: String): Boolean!
    borrarBodega(idBodega: Int!): Boolean!
  }
`;

export const resolvers = crearCrudCatalogo({
    "nombre": "Bodega",
    "consulta": "bodegas",
    "campos": {
        "Nombre": {
            "tipo": "texto",
            "limite": 60,
            "unicode": true
        },
        "Ubicacion": {
            "tipo": "texto",
            "limite": 150,
            "unicode": true
        }
    },
    "requeridos": [
        "Nombre",
        "Ubicacion"
    ],
    "filtros": [
        "IdBodega"
    ]
});
