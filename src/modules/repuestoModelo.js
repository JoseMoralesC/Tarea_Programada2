import {crearCrudCatalogo} from './crud-catalogo.js';

export const typeDefs = `#graphql
  type RepuestoModelo {
    IdRepuesto: Int!
    IdModelo: Int!
  }

  extend type Query {
    repuestosModelos(idRepuesto: Int, idModelo: Int): [RepuestoModelo!]!
  }

  extend type Mutation {
    agregarRepuestoModelo(idRepuesto: Int!, idModelo: Int!): Boolean!
    modificarRepuestoModelo(idRepuesto: Int!, idModelo: Int!, nuevoIdRepuesto: Int, nuevoIdModelo: Int): Boolean!
    borrarRepuestoModelo(idRepuesto: Int!, idModelo: Int!): Boolean!
  }
`;

export const resolvers = crearCrudCatalogo({
    "nombre": "RepuestoModelo",
    "consulta": "repuestosModelos",
    "ids": [
        "IdRepuesto",
        "IdModelo"
    ],
    "campos": {
        "NuevoIdRepuesto": {
            "tipo": "id"
        },
        "NuevoIdModelo": {
            "tipo": "id"
        }
    },
    "filtros": [
        "IdRepuesto",
        "IdModelo"
    ],
    "publico": true
});
