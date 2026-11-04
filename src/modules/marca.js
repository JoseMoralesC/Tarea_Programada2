import {crearCrudCatalogo} from './crud-catalogo.js';

export const typeDefs = `#graphql
type Marca {
    IdMarca: Int!
    Nombre: String!
}
extend type Query {
marcas: [Marca!]!
}
extend type Mutation {
agregarMarca(nombre: String!): Int!
modificarMarca(idMarca: Int!, nombre: String): Boolean!
borrarMarca(idMarca: Int!): Boolean!
}
`;

export const resolvers = crearCrudCatalogo({
    "nombre": "Marca",
    "consulta": "marcas",
    "campos": {
        "Nombre": {
            "tipo": "texto",
            "limite": 50,
            "unicode": true
        }
    },
    "requeridos": [
        "Nombre"
    ],
    "publico": true,
    "aliasId": true
});
