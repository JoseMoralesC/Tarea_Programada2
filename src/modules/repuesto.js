import {crearCrudCatalogo} from './crud-catalogo.js';

export const typeDefs = `#graphql
  type Repuesto {
    IdRepuesto: Int!
    IdCategoria: Int!
    Codigo: String!
    Nombre: String!
    PrecioVenta: Float!
    Costo: Float!
    Activo: Boolean!
  }

  extend type Query {
    repuestos(idRepuesto: Int): [Repuesto!]!
  }

  extend type Mutation {
    agregarRepuesto(idCategoria: Int!, codigo: String!, nombre: String!, precioVenta: Float!, costo: Float!, activo: Boolean): Int!
    modificarRepuesto(idRepuesto: Int!, idCategoria: Int, codigo: String, nombre: String, precioVenta: Float, costo: Float, activo: Boolean): Boolean!
    borrarRepuesto(idRepuesto: Int!): Boolean!
  }
`;

export const resolvers = crearCrudCatalogo({
    "nombre": "Repuesto",
    "consulta": "repuestos",
    "campos": {
        "IdCategoria": {
            "tipo": "id"
        },
        "Codigo": {
            "tipo": "texto",
            "limite": 30,
            "unicode": false
        },
        "Nombre": {
            "tipo": "texto",
            "limite": 120,
            "unicode": true
        },
        "PrecioVenta": {
            "tipo": "dinero"
        },
        "Costo": {
            "tipo": "dinero"
        },
        "Activo": {
            "tipo": "booleano"
        }
    },
    "requeridos": [
        "IdCategoria",
        "Codigo",
        "Nombre",
        "PrecioVenta",
        "Costo"
    ],
    "filtros": [
        "IdRepuesto"
    ]
});
