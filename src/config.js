//lee la variable del env, si no esta lanza error 
function requerida(nombre){
    const valor = process.env[nombre];
    if(!valor){
        throw new Error(`Falta la variable ${nombre} en el .env`);
    }
    return valor;
}

//convierte el texto del .env en booleano 
const booleano = (nombre) => process.env[nombre] === 'true';

export const config= {
puerto: Number(process.env.PORT ?? 4000),
db: {
    server: requerida('DB_SERVER'),
    port:Number(requerida('DB_PORT')),
    database:requerida('DB_DATABASE'),
    options: {
    encrypt: booleano('DB_ENCRYPT'),
    trustServerCertificate: booleano('DB_TRUST_SERVER_CERTIFICATE'),
    },
},
empleado: {
    user: requerida('DB_EMPLOYEE_USER'),
    password: requerida('DB_EMPLOYEE_PASSWORD'),
},
};
