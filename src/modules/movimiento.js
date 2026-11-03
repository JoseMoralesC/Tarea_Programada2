import { sql } from '../db.js';
import { poolAutorizado } from '../auth/contexto.js';

// Schema: el contrato de Movimiento (Entrada, Salida o Traslado entre bodegas)
// Origen y destino son NULL según el tipo:
//   Entrada  -> solo destino   Salida -> solo origen   Traslado -> ambos
// El trigger TR_Movimiento_Inventario actualiza el Inventario.
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

const ROLES = ['ADMINISTRADOR', 'EMPLEADO'];

const aFecha = (texto) => (texto ? new Date(texto) : null);
const aTexto = (fecha) => (fecha ? fecha.toISOString() : null);

export const resolvers = {
  Query: {
    movimientos: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      const resultado = await pool.request()
        .input('IdMovimiento', sql.Int, args.idMovimiento ?? null)
        .execute('ConsultarMovimientos');
      return resultado.recordset.map((fila) => ({ ...fila, Fecha: aTexto(fila.Fecha) }));
    },
  },
  Mutation: {
    agregarMovimiento: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      // Si no se manda idEmpleado, se usa el empleado que inició sesión
      const idEmpleado = args.idEmpleado ?? contexto.identidad.idEmpleado;
      const resultado = await pool.request()
        .input('function', sql.Int, 1)
        .input('IdRepuesto', sql.Int, args.idRepuesto)
        .input('IdBodegaOrigen', sql.Int, args.idBodegaOrigen ?? null)
        .input('IdBodegaDestino', sql.Int, args.idBodegaDestino ?? null)
        .input('IdEmpleado', sql.Int, idEmpleado)
        .input('Tipo', sql.VarChar(15), args.tipo)
        .input('Cantidad', sql.Int, args.cantidad)
        .input('Fecha', sql.DateTime, aFecha(args.fecha))
        .execute('MantenimientoMovimiento');
      return resultado.recordset[0].IdMovimiento;
    },
    modificarMovimiento: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      await pool.request()
        .input('function', sql.Int, 2)
        .input('IdMovimiento', sql.Int, args.idMovimiento)
        .input('IdRepuesto', sql.Int, args.idRepuesto ?? null)
        .input('IdBodegaOrigen', sql.Int, args.idBodegaOrigen ?? null)
        .input('IdBodegaDestino', sql.Int, args.idBodegaDestino ?? null)
        .input('IdEmpleado', sql.Int, args.idEmpleado ?? null)
        .input('Tipo', sql.VarChar(15), args.tipo ?? null)
        .input('Cantidad', sql.Int, args.cantidad ?? null)
        .input('Fecha', sql.DateTime, aFecha(args.fecha))
        .execute('MantenimientoMovimiento');
      return true;
    },
    borrarMovimiento: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      await pool.request()
        .input('function', sql.Int, 3)
        .input('IdMovimiento', sql.Int, args.idMovimiento)
        .execute('MantenimientoMovimiento');
      return true;
    },
  },
};