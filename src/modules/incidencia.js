import {crearCrudCatalogo} from './crud-catalogo.js';

export const typeDefs = `#graphql
  type Incidencia {
    IdIncidencia: Int!
    IdRepuesto: Int!
    IdProveedor: Int!
    IdCompra: Int
    Tipo: String!
    Cantidad: Int!
    Fecha: String!
  }

  extend type Query {
    incidencias(idIncidencia: Int): [Incidencia!]!
  }

  extend type Mutation {
    agregarIncidencia(idRepuesto: Int!, idProveedor: Int!, idCompra: Int, tipo: String!, cantidad: Int!, fecha: String): Int!
    modificarIncidencia(idIncidencia: Int!, idRepuesto: Int, idProveedor: Int, idCompra: Int, tipo: String, cantidad: Int, fecha: String): Boolean!
    borrarIncidencia(idIncidencia: Int!): Boolean!
  }
`;

export const resolvers = crearCrudCatalogo({
    "nombre": "Incidencia",
    "consulta": "incidencias",
    "campos": {
        "IdRepuesto": {
            "tipo": "id"
        },
        "IdProveedor": {
            "tipo": "id"
        },
        "IdCompra": {
            "tipo": "id",
            "nullable": true
        },
        "Tipo": {
            "tipo": "estado",
            "valores": [
                "Dañado",
                "Defectuoso",
                "Faltante",
                "Rechazado"
            ],
            "limite": 20
        },
        "Cantidad": {
            "tipo": "entero",
            "minimo": 1
        },
        "Fecha": {
            "tipo": "fechaHora"
        }
    },
    "requeridos": [
        "IdRepuesto",
        "IdProveedor",
        "Tipo",
        "Cantidad"
    ],
    "filtros": [
        "IdIncidencia"
    ]
});
