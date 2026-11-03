import { sql } from '../db.js';
import { poolAutorizado } from '../auth/contexto.js';

// Schema: el contrato de Bodega
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

// Bodega es información interna: solo administrador y empleado
const ROLES = ['ADMINISTRADOR', 'EMPLEADO'];

// Resolvers: cada operación llama a su SP
export const resolvers = {
  Query: {
    // Sin idBodega devuelve todas; con idBodega devuelve solo esa
    bodegas: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      const resultado = await pool.request()
        .input('IdBodega', sql.Int, args.idBodega ?? null)
        .execute('ConsultarBodegas');
      return resultado.recordset;
    },
  },
  Mutation: {
    agregarBodega: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      const resultado = await pool.request()
        .input('function', sql.Int, 1)
        .input('Nombre', sql.NVarChar(60), args.nombre)
        .input('Ubicacion', sql.NVarChar(150), args.ubicacion)
        .execute('MantenimientoBodega');
      return resultado.recordset[0].IdBodega;
    },
    modificarBodega: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      await pool.request()
        .input('function', sql.Int, 2)
        .input('IdBodega', sql.Int, args.idBodega)
        .input('Nombre', sql.NVarChar(60), args.nombre ?? null)
        .input('Ubicacion', sql.NVarChar(150), args.ubicacion ?? null)
        .execute('MantenimientoBodega');
      return true;
    },
    borrarBodega: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      await pool.request()
        .input('function', sql.Int, 3)
        .input('IdBodega', sql.Int, args.idBodega)
        .execute('MantenimientoBodega');
      return true;
    },
  },
};