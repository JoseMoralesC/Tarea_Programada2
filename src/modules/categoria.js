import { execute } from 'graphql';
import {pool, sql} from '../db.js';

//schema: el contrato de categoria 
export const typeDefs = `#graph1
    type Categoria {
    IdCategoria: Int!
    Nombre: String! 
    }
    extend type Query {
    categorias: [Categoria!]!
    }

    extend type Mutation {
    agregarCategoria(nombre: String!): Int!
    modificarCategoria(idCategoria: Int!, nombre: String): Boolean!
    borrarCategoria(idCategoria: Int!): Boolean!
    }
`;

//Resolvers
export const resolvers = {
    Query: {
        categorias: async() => {
            const resultado = await pool.request().execute('ConsultarCategorias');
            return resultado.recordset.map((fila) => ({
                IdCategoria: fila.Id,
                Nombre: fila.Nombre,
            }));
        },
    },
Mutation: {
    agregarCategoria: async(_, args) => {
        const resultado = await pool.request()
        .input('function', sql.Int, 1)
        .input('Nombre', sql.NVarChar(60), args.nombre)
        .execute('MantenimientoCategoria');
        return resultado.recordset[0].IdCategoria;
    },
    modificarCategoria: async(_,args) => {
        await pool.request()
        .input('function', sql.Int, 2)
        .input('IdCategoria', sql.Int, args.idCategoria)
        .input('Nombre', sql.NVarChar(60), args.nombre)
        .execute('MantenimientoCategoria');
        return true;
        },  
    borrarCategoria: async(_,args) => {
        await pool.request()
        .input('function', sql.Int,3)
        .input('IdCategoria', sql.Int, args.idCategoria)
        .execute('MantenimientoCategoria');
        return true;
    }
    },
};