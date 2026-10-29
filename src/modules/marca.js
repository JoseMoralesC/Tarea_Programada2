import {sql} from '../db.js';
import {poolAutorizado} from '../auth/contexto.js';

//schema: el contrato de marca 
export const typeDefs = `#graphql
type Marca {
    IdMarca: Int!
    Nombre: String!
}
extend type Query {
marcas: [Marca!]!
}
extend type Mutation {
agregarMarca(nombre: String!): Int!
modificarMarca(idMarca: Int!, nombre: String): Boolean!
borrarMarca(idMarca: Int!): Boolean!
}
`;

//Resolvers 
export const resolvers = {
    Query: {
        marcas: async(_, __, contexto) => {
            const pool = await poolAutorizado(contexto, ['ADMINISTRADOR', 'EMPLEADO', 'CLIENTE'], true);
            const resultado = await pool.request().execute('ConsultarMarcas');
            return resultado.recordset.map((fila) => ({
                IdMarca: fila.Id,
                Nombre: fila.Nombre,
            }));
        },
    },
Mutation: {
    agregarMarca: async(_,args, contexto) => {
        const pool = await poolAutorizado(contexto, ['ADMINISTRADOR', 'EMPLEADO']);
        const resultado = await pool.request()
        .input('function', sql.Int, 1)
        .input('Nombre', sql.NVarChar(50), args.nombre)
        .execute('MantenimientoMarca');
        return resultado.recordset[0].IdMarca;
    },
    modificarMarca: async(_,args, contexto) => {
        const pool = await poolAutorizado(contexto, ['ADMINISTRADOR', 'EMPLEADO']);
        await pool.request()
        .input('function', sql.Int, 2)
        .input('IdMarca', sql.Int, args.idMarca)
        .input('Nombre', sql.NVarChar(50), args.nombre)
        .execute('MantenimientoMarca');
        return true;
    },
    borrarMarca: async(_,args, contexto) => {
        const pool = await poolAutorizado(contexto, ['ADMINISTRADOR', 'EMPLEADO']);
        await pool.request()
        .input('function', sql.Int,3)
        .input('IdMarca', sql.Int, args.idMarca)
        .execute('MantenimientoMarca');
        return true;
    }
},
};
