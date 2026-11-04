import {crearCrudCatalogo} from './crud-catalogo.js';

export const typeDefs = `#graphql
    type Categoria {
    IdCategoria: Int!
    Nombre: String! 
    }
    extend type Query {
    categorias: [Categoria!]!
    }

    extend type Mutation {
    agregarCategoria(nombre: String!): Int!
    modificarCategoria(idCategoria: Int!, nombre: String): Boolean!
    borrarCategoria(idCategoria: Int!): Boolean!
    }
`;

export const resolvers = crearCrudCatalogo({
    "nombre": "Categoria",
    "consulta": "categorias",
    "campos": {
        "Nombre": {
            "tipo": "texto",
            "limite": 60,
            "unicode": true
        }
    },
    "requeridos": [
        "Nombre"
    ],
    "publico": true,
    "aliasId": true
});
