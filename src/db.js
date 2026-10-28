import sql from 'mssql';
import {config} from './config.js'


 const configuracion = {
    ...config.db, //server,port,database
    ...config.empleado, //user y password 
 };
 
//exportar sql para que los modulos usen los tipos 1
 export const pool= await sql.connect(configuracion);
 export {sql};