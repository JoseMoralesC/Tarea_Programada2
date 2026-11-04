import { sql } from '../db.js';
import { poolAutorizado } from '../auth/contexto.js';

// Schema: el contrato de Inventario
// UNIQUE(IdBodega, IdRepuesto): un repuesto aparece una sola vez por bodega
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

// Normalmente la Cantidad la mueven los triggers (compras, ventas, movimientos).
// Estas mutations quedan para registro inicial y ajustes manuales del personal.
const ROLES = ['ADMINISTRADOR', 'EMPLEADO'];

export const resolvers = {
  Query: {
    // Tres filtros opcionales: por registro, por bodega o por repuesto
    inventario: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      const resultado = await pool.request()
        .input('IdInventario', sql.Int, args.idInventario ?? null)
        .input('IdBodega', sql.Int, args.idBodega ?? null)
        .input('IdRepuesto', sql.Int, args.idRepuesto ?? null)
        .execute('ConsultarInventario');
      return resultado.recordset;
    },
  },
  Mutation: {
    agregarInventario: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      const resultado = await pool.request()
        .input('function', sql.Int, 1)
        .input('IdBodega', sql.Int, args.idBodega)
        .input('IdRepuesto', sql.Int, args.idRepuesto)
        .input('Cantidad', sql.Int, args.cantidad)
        .execute('MantenimientoInventario');
      return resultado.recordset[0].IdInventario;
    },
    modificarInventario: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      await pool.request()
        .input('function', sql.Int, 2)
        .input('IdInventario', sql.Int, args.idInventario)
        .input('IdBodega', sql.Int, args.idBodega ?? null)
        .input('IdRepuesto', sql.Int, args.idRepuesto ?? null)
        .input('Cantidad', sql.Int, args.cantidad ?? null)
        .execute('MantenimientoInventario');
      return true;
    },
    borrarInventario: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      await pool.request()
        .input('function', sql.Int, 3)
        .input('IdInventario', sql.Int, args.idInventario)
        .execute('MantenimientoInventario');
      return true;
    },
  },
};