import { sql } from '../db.js';
import { poolAutorizado } from '../auth/contexto.js';

// Schema: el contrato de Repuesto
// Los decimal(10,2) de SQL se exponen como Float en GraphQL
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

// ConsultarRepuestos incluye el Costo: es la lista interna, solo personal.
// El cliente ve los repuestos por el catálogo público (ConsultarCatalogo).
const ROLES = ['ADMINISTRADOR', 'EMPLEADO'];

export const resolvers = {
  Query: {
    repuestos: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      const resultado = await pool.request()
        .input('IdRepuesto', sql.Int, args.idRepuesto ?? null)
        .execute('ConsultarRepuestos');
      return resultado.recordset;
    },
  },
  Mutation: {
    agregarRepuesto: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      const resultado = await pool.request()
        .input('function', sql.Int, 1)
        .input('IdCategoria', sql.Int, args.idCategoria)
        .input('Codigo', sql.VarChar(30), args.codigo)
        .input('Nombre', sql.NVarChar(120), args.nombre)
        .input('PrecioVenta', sql.Decimal(10, 2), args.precioVenta)
        .input('Costo', sql.Decimal(10, 2), args.costo)
        .input('Activo', sql.Bit, args.activo ?? null)   // el SP pone 1 si viene NULL
        .execute('MantenimientoRepuesto');
      return resultado.recordset[0].IdRepuesto;
    },
    modificarRepuesto: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      await pool.request()
        .input('function', sql.Int, 2)
        .input('IdRepuesto', sql.Int, args.idRepuesto)
        .input('IdCategoria', sql.Int, args.idCategoria ?? null)
        .input('Codigo', sql.VarChar(30), args.codigo ?? null)
        .input('Nombre', sql.NVarChar(120), args.nombre ?? null)
        .input('PrecioVenta', sql.Decimal(10, 2), args.precioVenta ?? null)
        .input('Costo', sql.Decimal(10, 2), args.costo ?? null)
        .input('Activo', sql.Bit, args.activo ?? null)
        .execute('MantenimientoRepuesto');
      return true;
    },
    borrarRepuesto: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      await pool.request()
        .input('function', sql.Int, 3)
        .input('IdRepuesto', sql.Int, args.idRepuesto)
        .execute('MantenimientoRepuesto');
      return true;
    },
  },
};