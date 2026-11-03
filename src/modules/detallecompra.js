import { sql } from '../db.js';
import { poolAutorizado } from '../auth/contexto.js';

// Schema: el contrato de DetalleCompra
// Al agregar/modificar/borrar un detalle se disparan dos triggers:
//   TR_DetalleCompra_Inventario -> suma las unidades al Inventario de la bodega
//   TR_DetalleCompra_Total      -> recalcula el Total de la Compra
export const typeDefs = `#graphql
  type DetalleCompra {
    IdDetalle: Int!
    IdCompra: Int!
    IdRepuesto: Int!
    Cantidad: Int!
    Costo: Float!
  }

  extend type Query {
    detallesCompra(idDetalle: Int, idCompra: Int): [DetalleCompra!]!
  }

  extend type Mutation {
    agregarDetalleCompra(idCompra: Int!, idRepuesto: Int!, cantidad: Int!, costo: Float!): Int!
    modificarDetalleCompra(idDetalle: Int!, idCompra: Int, idRepuesto: Int, cantidad: Int, costo: Float): Boolean!
    borrarDetalleCompra(idDetalle: Int!): Boolean!
  }
`;

const ROLES = ['ADMINISTRADOR', 'EMPLEADO'];

export const resolvers = {
  Query: {
    // Con idCompra devuelve todas las líneas de esa compra
    detallesCompra: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      const resultado = await pool.request()
        .input('IdDetalle', sql.Int, args.idDetalle ?? null)
        .input('IdCompra', sql.Int, args.idCompra ?? null)
        .execute('ConsultarDetalleCompra');
      return resultado.recordset;
    },
  },
  Mutation: {
    agregarDetalleCompra: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      const resultado = await pool.request()
        .input('function', sql.Int, 1)
        .input('IdCompra', sql.Int, args.idCompra)
        .input('IdRepuesto', sql.Int, args.idRepuesto)
        .input('Cantidad', sql.Int, args.cantidad)
        .input('Costo', sql.Decimal(10, 2), args.costo)
        .execute('MantenimientoDetalleCompra');
      return resultado.recordset[0].IdDetalle;
    },
    modificarDetalleCompra: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      await pool.request()
        .input('function', sql.Int, 2)
        .input('IdDetalle', sql.Int, args.idDetalle)
        .input('IdCompra', sql.Int, args.idCompra ?? null)
        .input('IdRepuesto', sql.Int, args.idRepuesto ?? null)
        .input('Cantidad', sql.Int, args.cantidad ?? null)
        .input('Costo', sql.Decimal(10, 2), args.costo ?? null)
        .execute('MantenimientoDetalleCompra');
      return true;
    },
    borrarDetalleCompra: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      await pool.request()
        .input('function', sql.Int, 3)
        .input('IdDetalle', sql.Int, args.idDetalle)
        .execute('MantenimientoDetalleCompra');
      return true;
    },
  },
};