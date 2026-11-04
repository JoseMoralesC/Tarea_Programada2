import { sql } from '../db.js';
import { poolAutorizado } from '../auth/contexto.js';

// Schema: el contrato de Incidencia (repuestos dañados, rechazados, etc.)
// IdCompra es FK opcional: la incidencia puede no venir de una compra
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

const ROLES = ['ADMINISTRADOR', 'EMPLEADO'];

// Fecha es datetime: se recibe y se devuelve en formato ISO completo
const aFecha = (texto) => (texto ? new Date(texto) : null);
const aTexto = (fecha) => (fecha ? fecha.toISOString() : null);

export const resolvers = {
  Query: {
    incidencias: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      const resultado = await pool.request()
        .input('IdIncidencia', sql.Int, args.idIncidencia ?? null)
        .execute('ConsultarIncidencias');
      return resultado.recordset.map((fila) => ({ ...fila, Fecha: aTexto(fila.Fecha) }));
    },
  },
  Mutation: {
    // Tipo debe ser uno de los valores del CHECK de la tabla. Sin fecha, el SP usa GETDATE().
    agregarIncidencia: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      const resultado = await pool.request()
        .input('function', sql.Int, 1)
        .input('IdRepuesto', sql.Int, args.idRepuesto)
        .input('IdProveedor', sql.Int, args.idProveedor)
        .input('IdCompra', sql.Int, args.idCompra ?? null)
        .input('Tipo', sql.VarChar(20), args.tipo)
        .input('Cantidad', sql.Int, args.cantidad)
        .input('Fecha', sql.DateTime, aFecha(args.fecha))
        .execute('MantenimientoIncidencia');
      return resultado.recordset[0].IdIncidencia;
    },
    modificarIncidencia: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      await pool.request()
        .input('function', sql.Int, 2)
        .input('IdIncidencia', sql.Int, args.idIncidencia)
        .input('IdRepuesto', sql.Int, args.idRepuesto ?? null)
        .input('IdProveedor', sql.Int, args.idProveedor ?? null)
        .input('IdCompra', sql.Int, args.idCompra ?? null)
        .input('Tipo', sql.VarChar(20), args.tipo ?? null)
        .input('Cantidad', sql.Int, args.cantidad ?? null)
        .input('Fecha', sql.DateTime, aFecha(args.fecha))
        .execute('MantenimientoIncidencia');
      return true;
    },
    borrarIncidencia: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      await pool.request()
        .input('function', sql.Int, 3)
        .input('IdIncidencia', sql.Int, args.idIncidencia)
        .execute('MantenimientoIncidencia');
      return true;
    },
  },
};