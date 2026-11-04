import { sql } from '../db.js';
import { poolAutorizado } from '../auth/contexto.js';

// Schema: el contrato de RepuestoModelo (relación muchos a muchos)
// No tiene ID propio: cada fila se identifica por el par (IdRepuesto, IdModelo)
export const typeDefs = `#graphql
  type RepuestoModelo {
    IdRepuesto: Int!
    IdModelo: Int!
  }

  extend type Query {
    repuestosModelos(idRepuesto: Int, idModelo: Int): [RepuestoModelo!]!
  }

  extend type Mutation {
    agregarRepuestoModelo(idRepuesto: Int!, idModelo: Int!): Boolean!
    modificarRepuestoModelo(idRepuesto: Int!, idModelo: Int!, nuevoIdRepuesto: Int, nuevoIdModelo: Int): Boolean!
    borrarRepuestoModelo(idRepuesto: Int!, idModelo: Int!): Boolean!
  }
`;

// Consultar sirve para buscar "qué repuestos le sirven a mi modelo": también clientes
const ROLES_CONSULTA = ['ADMINISTRADOR', 'EMPLEADO', 'CLIENTE'];
const ROLES = ['ADMINISTRADOR', 'EMPLEADO'];

export const resolvers = {
  Query: {
    // Los dos filtros son opcionales y se pueden combinar
    repuestosModelos: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES_CONSULTA, true);
      const resultado = await pool.request()
        .input('IdRepuesto', sql.Int, args.idRepuesto ?? null)
        .input('IdModelo', sql.Int, args.idModelo ?? null)
        .execute('ConsultarRepuestoModelo');
      return resultado.recordset;
    },
  },
  Mutation: {
    // Agregar devuelve Boolean: no hay identity, el "ID" ya lo mandó el usuario
    agregarRepuestoModelo: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      await pool.request()
        .input('function', sql.Int, 1)
        .input('IdRepuesto', sql.Int, args.idRepuesto)
        .input('IdModelo', sql.Int, args.idModelo)
        .execute('MantenimientoRepuestoModelo');
      return true;
    },
    // Para modificar se identifica la fila actual con el par viejo
    // y se mandan los valores nuevos en NuevoIdRepuesto / NuevoIdModelo
    modificarRepuestoModelo: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      await pool.request()
        .input('function', sql.Int, 2)
        .input('IdRepuesto', sql.Int, args.idRepuesto)
        .input('IdModelo', sql.Int, args.idModelo)
        .input('NuevoIdRepuesto', sql.Int, args.nuevoIdRepuesto ?? null)
        .input('NuevoIdModelo', sql.Int, args.nuevoIdModelo ?? null)
        .execute('MantenimientoRepuestoModelo');
      return true;
    },
    borrarRepuestoModelo: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      await pool.request()
        .input('function', sql.Int, 3)
        .input('IdRepuesto', sql.Int, args.idRepuesto)
        .input('IdModelo', sql.Int, args.idModelo)
        .execute('MantenimientoRepuestoModelo');
      return true;
    },
  },
};