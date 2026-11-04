import { sql } from '../db.js';
import { poolAutorizado } from '../auth/contexto.js';

// Schema: el contrato de Proveedor

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

// Proveedor es información interna: solo administrador y empleado
const ROLES = ['ADMINISTRADOR', 'EMPLEADO'];

// Resolvers: cada operación llama a su SP
export const resolvers = {
  Query: {
    // Sin idProveedor devuelve todos; con idProveedor devuelve solo ese
    proveedores: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      const resultado = await pool.request()
        .input('IdProveedor', sql.Int, args.idProveedor ?? null)
        .execute('ConsultarProveedores');
      return resultado.recordset;
    },
  },
  Mutation: {
    agregarProveedor: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      const resultado = await pool.request()
        .input('function', sql.Int, 1)
        .input('Nombre', sql.NVarChar(100), args.nombre)
        .input('Telefono', sql.VarChar(15), args.telefono ?? null)
        .input('Correo', sql.VarChar(100), args.correo ?? null)
        .input('DiasEntrega', sql.Int, args.diasEntrega)
        .execute('MantenimientoProveedor');
      return resultado.recordset[0].IdProveedor;
    },
    modificarProveedor: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      await pool.request()
        .input('function', sql.Int, 2)
        .input('IdProveedor', sql.Int, args.idProveedor)
        .input('Nombre', sql.NVarChar(100), args.nombre ?? null)
        .input('Telefono', sql.VarChar(15), args.telefono ?? null)
        .input('Correo', sql.VarChar(100), args.correo ?? null)
        .input('DiasEntrega', sql.Int, args.diasEntrega ?? null)
        .execute('MantenimientoProveedor');
      return true;
    },
    borrarProveedor: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      await pool.request()
        .input('function', sql.Int, 3)
        .input('IdProveedor', sql.Int, args.idProveedor)
        .execute('MantenimientoProveedor');
      return true;
    },
  },
};