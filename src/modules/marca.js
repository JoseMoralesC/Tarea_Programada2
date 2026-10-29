import {pool, sql} from '../db.js';

//schema: el contrato de marca 
export const typeDefs = ` #grapql
type Marca {
    IdMarca: int!
    Nombre: String!
}
extend type Query {
marcas: [Marca!]!
}
extend type Mutation {
agregarMarca(nombre: String!): Int!
modificarMarca(idMarca: Int!, nombre: String): Boolean!
borrarMarca(idCategoria: Int!): Boolean!
}
`;

//Resolvers 
export const resolvers = {
    Query: {
        marcas: async() => {
            const resultado = await pool.request().execute('ConsultarMarcas')
            return resultado.recordset.map((fila) => ({
                IdMarca: fila.Id,
                Nombre: fila.Nombre,
            }));
        },
    },
Mutation: {
    agregarMarca: async(_,args) => {
        const resultado = await pool.request()
        .input('function', sql.Int, 1)
        .input('Nombre', sql.NVarChar(50), args.nombre)
        .execute('MantenimientoMarca');
        return resultado.recordset[0].IdMarca;
    },
    modificarMarca: async(_,args) => {
        await pool.request()
        .input('function', sql.Int, 2)
        .input('IdMarca', sql.Int, args.idMarca)
        .input('Nombre', sql.NVarChar(60), args.nombre)
        .execute('MantenimientoMarca');
        return true;
    },
    borrarMarca: async(_,args) => {
        await pool.request()
        .input('function', sql.Int,3)
        .input('IdMarca', sql.Int, args.idMarca)
        .execute('MantenimientoMarfa');
        return true;
    }
},
};