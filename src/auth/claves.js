import {pbkdf2, randomBytes} from 'node:crypto';
import {promisify} from 'node:util';
import {GraphQLError} from 'graphql';

const derivar = promisify(pbkdf2);

export function validarClave(clave) {
    // Coincide con el límite NVARCHAR(256) de dbo.LoginUsuario.
    if (typeof clave !== 'string' || clave.length < 1 || clave.length > 256) {
        throw new GraphQLError('clave debe contener entre 1 y 256 caracteres', {
            extensions: {code: 'BAD_USER_INPUT'},
        });
    }
}

export async function generarHashClave(clave) {
    validarClave(clave);
    // ASP.NET Identity V3, confirmado contra dbo.VerificarClave.
    // https://github.com/dotnet/aspnetcore/blob/main/src/Identity/Extensions.Core/src/PasswordHasher.cs
    const sal = randomBytes(16);
    const subclave = await derivar(clave, sal, 100_000, 32, 'sha512');
    const cabecera = Buffer.alloc(13);
    cabecera[0] = 0x01;
    cabecera.writeUInt32BE(2, 1); // HMAC-SHA512
    cabecera.writeUInt32BE(100_000, 5);
    cabecera.writeUInt32BE(sal.length, 9);
    return Buffer.concat([cabecera, sal, subclave]).toString('base64');
}
