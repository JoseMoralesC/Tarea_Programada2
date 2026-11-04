# Preparar la base en otro entorno

Decidimos conservar la exportación SQL y el respaldo para poder recuperar el proyecto. Para la entrega usamos [RepuestosAutomotrices.sql](../db/RepuestosAutomotrices.sql), que contiene la estructura, los datos, los procedimientos, los triggers, la secuencia y los permisos de las cuentas de la API.

## Preparación del servidor

Usamos SQL Server en Windows porque la comprobación de contraseñas del proyecto utiliza un ensamblado CLR que depende de Windows. En una instancia nueva, la persona que administra SQL Server debe habilitar la integración CLR y registrar el ensamblado `Repuestos.Passwords` como confiable. Conservamos la seguridad estricta del servidor; no necesitamos desactivarla.

El ensamblado está incluido como contenido binario en la exportación. Para registrarlo como confiable se obtiene su hash SHA-512 y se agrega con `sys.sp_add_trusted_assembly`; después la exportación crea `Repuestos.Passwords`. Esta preparación requiere permisos de administración del servidor.

Antes de ejecutar el archivo creamos una base vacía llamada `RepuestosAutomotrices` y los logins SQL que usa la exportación: `api_cliente`, `api_empleado`, `api_generico` y `Jose`. Las contraseñas se definen en el servidor y se guardan localmente en `.env`; no forman parte de estas instrucciones. `Jose` corresponde al usuario de mantenimiento incluido en la exportación, mientras las tres cuentas de la API trabajan con permisos limitados.

## Cargar y conectar

1. Abrimos la exportación en SSMS y comprobamos el servidor y la base seleccionados. Si elegimos otro nombre, cambiamos únicamente la instrucción `USE` y la configuración local.
2. Ejecutamos el archivo sobre la base vacía. No lo repetimos sobre nuestra base con datos: es un archivo para recrear el proyecto, no una actualización.
3. Completamos `.env` con las cuentas creadas. Los nombres de usuario deben coincidir con los que utiliza la exportación.
4. Ejecutamos el validador de dependencias y la comprobación de contraseñas.

```powershell
node --env-file=.env scripts/dependencias-db.mjs validar
npm run verify:hash
npm start
```

Para aplicar los ajustes a una base anterior, sin volver a cargar sus datos, conservamos `db/sql/05_permisos_api.sql` y `db/sql/06_campos_opcionales.sql`. El primero asigna permisos por procedimiento y el segundo permite vaciar los campos opcionales. Los ejecutamos con mantenimiento antes de usar el código actualizado.

`db/sql/completar_dependencias.sql` crea la secuencia solo si falta; podemos ejecutarlo con `node --env-file=.env scripts/dependencias-db.mjs aplicar`. El modo `diagnostico` consulta las dependencias y `validar` comprueba que estén listas.

## Ensayo de instalación y funcionamiento

```powershell
npm run test:integration
```

Este ensayo necesita una cuenta `DB_SETUP` que pueda crear y eliminar bases. En el servidor configurado crea una copia temporal con los datos exportados y verifica las 23 tablas. Después prepara otra copia vacía para comprobar el CRUD, los roles y las reglas de negocio. Las conexiones de la API siguen usando sus propias credenciales; la cuenta de mantenimiento solo prepara el ensayo.

El comando elimina las bases que él mismo creó al terminar, también si falla una comprobación. Si se interrumpe el proceso por completo, el nombre temporal aparece en la salida y se puede revisar en SSMS; nunca se debe borrar la base compartida para limpiar una prueba.

El ensayo verifica la recreación en otra base de la misma instancia. Para llevarlo a otro servidor todavía se deben cumplir los pasos de preparación de logins y CLR descritos arriba.
