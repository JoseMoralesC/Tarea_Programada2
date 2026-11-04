import { sql } from '../db.js';
import { poolAutorizado } from '../auth/contexto.js';

// Schema: el contrato de Compra
// Las fechas viajan como texto 'AAAA-MM-DD'. Total es de solo lectura:
// lo recalcula el trigger TR_DetalleCompra_Total al agregar detalles.
export const typeDefs = `#graphql
  type Compra {
    IdCompra: Int!
    IdProveedor: Int!
    IdBodega: Int!
    Fecha: String!
    FechaRecepcion: String
    Total: Float!
  }

  extend type Query {
    compras(idCompra: Int): [Compra!]!
  }

  extend type Mutation {
    agregarCompra(idProveedor: Int!, idBodega: Int!, fecha: String, fechaRecepcion: String): Int!
    modificarCompra(idCompra: Int!, idProveedor: Int, idBodega: Int, fecha: String, fechaRecepcion: String): Boolean!
    borrarCompra(idCompra: Int!): Boolean!
  }
`;

const ROLES = ['ADMINISTRADOR', 'EMPLEADO'];

// Texto 'AAAA-MM-DD' -> Date para SQL (o null si no vino)
const aFecha = (texto) => (texto ? new Date(texto) : null);
// Date de SQL -> texto 'AAAA-MM-DD' para GraphQL
const aTexto = (fecha) => (fecha ? fecha.toISOString().slice(0, 10) : null);

export const resolvers = {
  Query: {
    compras: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      const resultado = await pool.request()
        .input('IdCompra', sql.Int, args.idCompra ?? null)
        .execute('ConsultarCompras');
      return resultado.recordset.map((fila) => ({
        ...fila,
        Fecha: aTexto(fila.Fecha),
        FechaRecepcion: aTexto(fila.FechaRecepcion),
      }));
    },
  },
  Mutation: {
    // Sin fecha, el SP usa la de hoy. El Total arranca en 0.
    agregarCompra: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      const resultado = await pool.request()
        .input('function', sql.Int, 1)
        .input('IdProveedor', sql.Int, args.idProveedor)
        .input('IdBodega', sql.Int, args.idBodega)
        .input('Fecha', sql.Date, aFecha(args.fecha))
        .input('FechaRecepcion', sql.Date, aFecha(args.fechaRecepcion))
        .execute('MantenimientoCompra');
      return resultado.recordset[0].IdCompra;
    },
    modificarCompra: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      await pool.request()
        .input('function', sql.Int, 2)
        .input('IdCompra', sql.Int, args.idCompra)
        .input('IdProveedor', sql.Int, args.idProveedor ?? null)
        .input('IdBodega', sql.Int, args.idBodega ?? null)
        .input('Fecha', sql.Date, aFecha(args.fecha))
        .input('FechaRecepcion', sql.Date, aFecha(args.fechaRecepcion))
        .execute('MantenimientoCompra');
      return true;
    },
    borrarCompra: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      await pool.request()
        .input('function', sql.Int, 3)
        .input('IdCompra', sql.Int, args.idCompra)
        .execute('MantenimientoCompra');
      return true;
    },
  },
};