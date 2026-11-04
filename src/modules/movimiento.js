import {crearCrudCatalogo} from './crud-catalogo.js';

export const typeDefs = `#graphql
  type Movimiento {
    IdMovimiento: Int!
    IdRepuesto: Int!
    IdBodegaOrigen: Int
    IdBodegaDestino: Int
    IdEmpleado: Int!
    Tipo: String!
    Cantidad: Int!
    Fecha: String!
  }

  extend type Query {
    movimientos(idMovimiento: Int): [Movimiento!]!
  }

  extend type Mutation {
    agregarMovimiento(idRepuesto: Int!, idBodegaOrigen: Int, idBodegaDestino: Int, idEmpleado: Int, tipo: String!, cantidad: Int!, fecha: String): Int!
    modificarMovimiento(idMovimiento: Int!, idRepuesto: Int, idBodegaOrigen: Int, idBodegaDestino: Int, idEmpleado: Int, tipo: String, cantidad: Int, fecha: String): Boolean!
    borrarMovimiento(idMovimiento: Int!): Boolean!
  }
`;

export const resolvers = crearCrudCatalogo({
    "nombre": "Movimiento",
    "consulta": "movimientos",
    "campos": {
        "IdRepuesto": {
            "tipo": "id"
        },
        "IdBodegaOrigen": {
            "tipo": "id",
            "nullable": true
        },
        "IdBodegaDestino": {
            "tipo": "id",
            "nullable": true
        },
        "IdEmpleado": {
            "tipo": "id"
        },
        "Tipo": {
            "tipo": "estado",
            "valores": [
                "Entrada",
                "Salida",
                "Traslado"
            ],
            "limite": 15
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
        "IdEmpleado",
        "Tipo",
        "Cantidad"
    ],
    "filtros": [
        "IdMovimiento"
    ],
    "autoria": true
});
