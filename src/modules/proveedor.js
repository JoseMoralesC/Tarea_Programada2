import {crearCrudCatalogo} from './crud-catalogo.js';

export const typeDefs = `#graphql
  type Proveedor {
    IdProveedor: Int!
    Nombre: String!
    Telefono: String
    Correo: String
    DiasEntrega: Int!
  }

  extend type Query {
    proveedores(idProveedor: Int): [Proveedor!]!
  }

  extend type Mutation {
    agregarProveedor(nombre: String!, telefono: String, correo: String, diasEntrega: Int!): Int!
    modificarProveedor(idProveedor: Int!, nombre: String, telefono: String, correo: String, diasEntrega: Int): Boolean!
    borrarProveedor(idProveedor: Int!): Boolean!
  }
`;

export const resolvers = crearCrudCatalogo({
    "nombre": "Proveedor",
    "consulta": "proveedores",
    "campos": {
        "Nombre": {
            "tipo": "texto",
            "limite": 100,
            "unicode": true
        },
        "Telefono": {
            "tipo": "texto",
            "limite": 15,
            "unicode": false,
            "nullable": true
        },
        "Correo": {
            "tipo": "texto",
            "limite": 100,
            "unicode": false,
            "nullable": true
        },
        "DiasEntrega": {
            "tipo": "entero",
            "minimo": 0
        }
    },
    "requeridos": [
        "Nombre",
        "DiasEntrega"
    ],
    "filtros": [
        "IdProveedor"
    ]
});
