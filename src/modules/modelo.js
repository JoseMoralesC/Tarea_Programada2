import { sql } from '../db.js';
import { poolAutorizado } from '../auth/contexto.js';

// Schema: el contrato de Modelo
// AnioFin es NULL en la tabla (modelo que se sigue fabricando), por eso no lleva "!"
export const typeDefs = `#graphql
  type Modelo {
    IdModelo: Int!
    IdMarca: Int!
    Nombre: String!
    AnioInicio: Int!
    AnioFin: Int
  }

  extend type Query {
    modelos(idMarca: Int): [Modelo!]!
  }

  extend type Mutation {
    agregarModelo(idMarca: Int!, nombre: String!, anioInicio: Int!, anioFin: Int): Int!
    modificarModelo(idModelo: Int!, idMarca: Int, nombre: String, anioInicio: Int, anioFin: Int): Boolean!
    borrarModelo(idModelo: Int!): Boolean!
  }
`;

// Consultar es público (catálogo); modificar solo personal interno
const ROLES_CONSULTA = ['ADMINISTRADOR', 'EMPLEADO', 'CLIENTE'];
const ROLES = ['ADMINISTRADOR', 'EMPLEADO'];

export const resolvers = {
  Query: {
    // Sin idMarca devuelve todos; con idMarca, solo los modelos de esa marca
    modelos: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES_CONSULTA, true);
      const resultado = await pool.request()
        .input('IdMarca', sql.Int, args.idMarca ?? null)
        .execute('ConsultarModelos');
      // ConsultarModelos devuelve el ID con el alias "Id", por eso el .map()
      return resultado.recordset.map((fila) => ({
        IdModelo: fila.Id,
        IdMarca: fila.IdMarca,
        Nombre: fila.Nombre,
        AnioInicio: fila.AnioInicio,
        AnioFin: fila.AnioFin,
      }));
    },
  },
  Mutation: {
    agregarModelo: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      const resultado = await pool.request()
        .input('function', sql.Int, 1)
        .input('IdMarca', sql.Int, args.idMarca)
        .input('Nombre', sql.NVarChar(60), args.nombre)
        .input('AnioInicio', sql.Int, args.anioInicio)
        .input('AnioFin', sql.Int, args.anioFin ?? null)
        .execute('MantenimientoModelo');
      return resultado.recordset[0].IdModelo;
    },
    modificarModelo: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      await pool.request()
        .input('function', sql.Int, 2)
        .input('IdModelo', sql.Int, args.idModelo)
        .input('IdMarca', sql.Int, args.idMarca ?? null)
        .input('Nombre', sql.NVarChar(60), args.nombre ?? null)
        .input('AnioInicio', sql.Int, args.anioInicio ?? null)
        .input('AnioFin', sql.Int, args.anioFin ?? null)
        .execute('MantenimientoModelo');
      return true;
    },
    borrarModelo: async (_, args, contexto) => {
      const pool = await poolAutorizado(contexto, ROLES);
      await pool.request()
        .input('function', sql.Int, 3)
        .input('IdModelo', sql.Int, args.idModelo)
        .execute('MantenimientoModelo');
      return true;
    },
  },
};