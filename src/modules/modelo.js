import {crearCrudCatalogo} from './crud-catalogo.js';

export const typeDefs = `#graphql
  type Modelo {
    IdModelo: Int!
    IdMarca: Int!
    Nombre: String!
    AnioInicio: Int!
    AnioFin: Int
  }

  extend type Query {
    modelos(idMarca: Int): [Modelo!]!
  }

  extend type Mutation {
    agregarModelo(idMarca: Int!, nombre: String!, anioInicio: Int!, anioFin: Int): Int!
    modificarModelo(idModelo: Int!, idMarca: Int, nombre: String, anioInicio: Int, anioFin: Int): Boolean!
    borrarModelo(idModelo: Int!): Boolean!
  }
`;

export const resolvers = crearCrudCatalogo({
    "nombre": "Modelo",
    "consulta": "modelos",
    "campos": {
        "IdMarca": {
            "tipo": "id"
        },
        "Nombre": {
            "tipo": "texto",
            "limite": 60,
            "unicode": true
        },
        "AnioInicio": {
            "tipo": "entero",
            "minimo": 1900
        },
        "AnioFin": {
            "tipo": "entero",
            "minimo": 1900,
            "nullable": true
        }
    },
    "requeridos": [
        "IdMarca",
        "Nombre",
        "AnioInicio"
    ],
    "filtros": [
        "IdMarca"
    ],
    "publico": true,
    "aliasId": true
});
