import {ApolloServer} from '@apollo/server';
import {startStandaloneServer} from '@apollo/server/standalone';
import {config} from './config.js'; 
import * as categoria from './modules/categoria.js';
import * as marca from './modules/marca.js'

//tipos de base 
const base = `#graphql
    type Query {_vacio: Boolean}
    type Mutation {_vacio: Boolean}
`;
//lista de modulos 
const modulos = [categoria,marca];


const server = new ApolloServer({
    typeDefs: [base, ...modulos.map((m) => m.typeDefs)],
    resolvers: modulos.map((m) => m.resolvers),
});
const {url} = await startStandaloneServer(server, {listen: {port: config.puerto}});
console.log(`Servidor GraphQL listo en ${url}`);


