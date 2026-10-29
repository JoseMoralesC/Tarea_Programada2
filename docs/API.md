# Guía de la API

Backend GraphQL modular sobre RepuestosAutomotrices. El inventario de tablas y el reparto por persona están en [INVENTARIO.md](info_bd/INVENTARIO.md); instalación, estado y pendientes se mantienen en el [README](../README.md).

## Configuración

Usar el .env privado siguiendo [.env.example](../.env.example). DB_SERVER, DB_PORT y DB_DATABASE son comunes; DB_CLIENT_USER/PASSWORD y DB_EMPLOYEE_USER/PASSWORD deben estar completos y corresponder a identidades SQL distintas.

Los pools son independientes y se reutilizan por rol. Administrador y Empleado usan la conexión empleado; Cliente usa cliente. DB_SETUP nunca es una conexión de la API.

DB_LOGIN_ROLE=cliente selecciona la conexión que ejecuta dbo.LoginUsuario antes de conocer al usuario; necesita EXECUTE sobre ese SP. Puede elegirse generico solo si DB_GENERIC_ENABLED=true y sus credenciales están completas. No se usa empleado ni mantenimiento para el login.

DB_GENERIC_ENABLED=false es el valor predeterminado. Habilitarlo permite únicamente lectura anónima de Categoría/Marca. No habilita acceso a las tablas B.

Puertos y booleanos se validan al arrancar. DB_ENCRYPT=true y DB_TRUST_SERVER_CERTIFICATE=true mantienen el acuerdo del servidor actual: conexión cifrada que confía en el certificado presentado. La red privada no sustituye esta configuración.

## Login y sesión

Enviar POST a http://localhost:4000/ con un documento GraphQL y variables privadas:

```graphql
mutation IniciarSesion($correo: String!, $clave: String!) {
  login(correo: $correo, clave: $clave) {
    token
    expiraEn
    usuario { idUsuario correo nombre rol idEmpleado idAseguradora }
  }
}
```

dbo.LoginUsuario recibe Correo varchar(100), Clave nvarchar(256) y Valido bit OUTPUT. La API toma el perfil devuelto cuando la validación es correcta y no usa ObtenerCredencialLogin ni publica hashes.

Incluir Authorization: Bearer <token> en las solicitudes siguientes. El rol viene de la sesión verificada; headers de rol o IDs suministrados por el cliente no cambian la conexión autorizada.

```graphql
query MiSesion {
  sesion { idUsuario rol }
  categorias { IdCategoria Nombre }
  marcas { IdMarca Nombre }
}

mutation Salir {
  cerrarSesion
}
```

Las sesiones duran una hora y se guardan en memoria, con un máximo de 1000. Se revocan al cerrar sesión, reiniciar el servidor o modificar/borrar ese Usuario mediante la API. Los cambios directos en SQL y cambios de nombre de Rol no invalidan automáticamente sesiones emitidas. Para varias instancias o revocación inmediata ante cambios externos se necesita almacenamiento compartido y verificación de vigencia.

## Operaciones y permisos

Cada módulo declara agregar<Tabla>, modificar<Tabla> y borrar<Tabla>, además de su query. Las altas devuelven el ID; modificaciones y borrados devuelven Boolean. En los módulos B se usan datos: <Tabla>Input! al agregar y datos: <Tabla>Cambios! al modificar, salvo Rol, que recibe nombre directamente. Los argumentos completos se consultan en el esquema GraphQL o la colección Postman.

| Tabla / query | Administrador | Empleado | Cliente |
| --- | --- | --- | --- |
| Categoria / categorias | CRUD | CRUD | Consulta |
| Marca / marcas | CRUD | CRUD | Consulta |
| Rol / roles(idRol) | CRUD | Sin acceso | Sin acceso |
| Usuario / usuarios(idUsuario) | CRUD | Consulta propia | Consulta propia |
| Empleado / empleados(idEmpleado) | CRUD | Consulta propia | Sin acceso |
| Aseguradora / aseguradoras(idAseguradora) | CRUD | Consulta | Consulta propia |
| Caso / casos(idCaso, idAseguradora) | CRUD | CRUD | Consulta propia |
| Cotizacion / cotizaciones(idCotizacion, idCaso) | CRUD | CRUD | Consulta propia |
| DetalleCotizacion / detallesCotizacion(idDetalle, idCotizacion) | CRUD | CRUD | Consulta propia |
| Venta / ventas(idVenta, idCotizacion) | CRUD | CRUD | Consulta propia |
| DetalleVenta / detallesVenta(idDetalle, idVenta) | CRUD | CRUD | Consulta propia |
| Envio / envios(idEnvio, idVenta) | CRUD | CRUD | Consulta propia |
| Auditoria / auditorias(idAuditoria, tabla) | CRUD | Sin acceso | Sin acceso |

Los filtros son opcionales. Las consultas B calculan IdUsuario desde la sesión y recorren las FK hasta Aseguradora para limitar los datos del cliente. DetalleVenta.Costo se oculta al cliente tanto en SQL como en GraphQL; el costo de envío sí es visible. Auditoria tiene mantenimiento administrativo para el CRUD académico y no se presenta como registro inmutable.

En altas de Venta/Cotizacion, idEmpleado se toma del perfil si se omite. Un empleado no puede atribuir la operación a otro; un administrador puede indicarlo. Se mantienen las FK y los triggers de validación de perfiles.

## Usuarios y contraseñas

```graphql
mutation CrearUsuario($datos: UsuarioInput!) {
  agregarUsuario(datos: $datos)
}

mutation CambiarClave($id: Int!, $clave: String!) {
  modificarUsuario(idUsuario: $id, datos: { clave: $clave })
}
```

UsuarioInput exige idRol, correo y clave; activo es true por defecto. Clave admite de 1 a 256 caracteres y conserva espacios y Unicode. El backend genera el hash de forma asíncrona con [Identity V3 de Microsoft](https://github.com/dotnet/aspnetcore/blob/main/src/Identity/Extensions.Core/src/PasswordHasher.cs): PBKDF2-HMAC-SHA512, 100000 iteraciones, sal aleatoria de 16 bytes y subclave de 32 bytes. El resultado ocupa 84 caracteres Base64, compatible con Contrasena varchar(255). No se aceptan hashes como entrada GraphQL.

Después de crear Usuario, crear su perfil Empleado (rol Administrador/Empleado) o Aseguradora (rol Cliente) con el ID devuelto. LoginUsuario exige un perfil coherente: la fila Usuario por sí sola no habilita el acceso. EmpleadoInput exige idUsuario, cedula, nombre y puesto. AseguradoraInput exige idUsuario, cedulaJuridica y nombre; telefono/correo son opcionales.

## Tipos y reglas de negocio

| Enum | Valores GraphQL |
| --- | --- |
| EstadoCaso | ABIERTO, EN_PROCESO, CERRADO, RECHAZADO |
| EstadoCotizacion | PENDIENTE, APROBADA, RECHAZADA |
| EstadoDetalleCotizacion | PENDIENTE, APROBADO, RECHAZADO |
| EstadoEnvio | PENDIENTE, EN_CAMINO, ENTREGADO |
| AccionAuditoria | INSERTAR, MODIFICAR, BORRAR |

Los enums se traducen a los textos de SQL, como En proceso / En camino e I / U / D para auditoría. Se validan los estados de los CHECK existentes; no hay una máquina de transiciones adicional ni una regla nueva de aprobación de ventas.

Dinero recibe cadenas como "125.50" y devuelve dos decimales. Rechaza negativos, exponentes y más de dos decimales. Los campos decimal(10,2) admiten hasta 99999999.99; las cantidades son enteros positivos.

FechaHora recibe ISO 8601 con zona explícita, normaliza a UTC y valida el rango datetime de SQL. Los SP 04 usan GETUTCDATE() si se omite una fecha obligatoria al agregar. No se convirtieron fechas históricas ni defaults de tablas/triggers: el equipo debe confirmar la zona usada anteriormente.

Las modificaciones exigen al menos un cambio. NULL explícito limpia telefono/correo de Aseguradora y fechaEntrega de Envio; omitir esos campos conserva su valor. Los campos obligatorios rechazan NULL.

```graphql
mutation LimpiarEntrega($id: Int!) {
  modificarEnvio(idEnvio: $id, datos: { fechaEntrega: null })
}
```

Cotizacion.Total y Venta.Total son de solo lectura y se crean en cero. Los triggers recalculan los totales al cambiar detalles. Los mantenimientos 04 son transaccionales; los detalles bloquean sus cabeceras y DetalleVenta bloquea las existencias afectadas para comprobar stock. El trigger sigue encargado de restar/devolver existencias, sin duplicar ese ajuste en el SP.

| Código GraphQL | Significado |
| --- | --- |
| UNAUTHENTICATED | Falta sesión o token inválido/vencido. |
| FORBIDDEN | El rol o propietario no autoriza la operación. |
| BAD_USER_INPUT | Entrada inválida o fuera del contrato. |
| NOT_FOUND | El mantenimiento no encontró el registro. |
| CONFLICT | FK, duplicado, perfil incompatible, stock o deadlock. |
| INTERNAL_SERVER_ERROR | Error interno; su detalle SQL no se publica. |

Un deadlock requiere reintentar la operación completa; no se reintentan escrituras automáticamente. Las restricciones referenciales siguen aplicándose a los borrados.

## Pruebas y estado SQL

`npm test` ejecuta 39 pruebas sin SQL real: 44 operaciones B y las ocho existentes del lote A, con autenticación, permisos, scalars, validación, privacidad y manejo de errores. No acredita efectos reales de stock, totales o concurrencia.

`npm run verify:hash` usa las credenciales DB_SETUP fuera de la API para comprobar una contraseña ficticia mediante el CLR. No consulta hashes almacenados ni modifica registros. La comprobación real pasó el 29/10/2026, también con Unicode.

El usuario aplicó [SQL 03](../sql/ajustes/03_lote_B_usuarios_procedimientos.sql) y [SQL 04](../sql/ajustes/04_lote_B_negocio_procedimientos.sql). Se contrastaron sus 22 definiciones/parámetros con los archivos y se ejecutaron once consultas con ID 0, sin columnas de credenciales. Ambos scripts pasaron revisión sintáctica con ScriptDom. No se ejecutaron ciclos CRUD reales. En la última revisión la cuenta cliente tenía db_owner y faltaban credenciales de empleado; falta aceptar los permisos SQL por rol.

La [colección Postman](pruebas/lote_B.postman_collection.json) contiene 57 solicitudes: login, 44 operaciones CRUD, once comprobaciones de ausencia y logout. Se validaron sus documentos y scripts de variables contra el esquema, sin enviar esas escrituras a SQL. Completar localmente las credenciales de login, correo/clave de prueba y las FK de referencia antes de usarla en una base de pruebas. Las referencias empiezan en 0; los IDs creados por cada carpeta se guardan aparte. Empleado y Aseguradora requieren usuarios de referencia distintos y con el rol correcto. Para recorrer todas las carpetas se necesita un administrador; repetir con empleado/cliente permite comprobar denegaciones. No guardar claves o tokens reales en la colección compartida.

Faltan ciclos CRUD, comparación entre dos clientes, stock/totales antes y después, rollback, concurrencia y pruebas desde ambos equipos con cuentas restringidas. El listado general de pendientes y los entregables académicos están en el README.

## Añadir módulos

Importar sql desde src/db.js y obtener el pool dentro de cada resolver mediante poolAutorizado(contexto, rolesPermitidos). No usar un pool global ni escoger credenciales desde argumentos del cliente. Registrar el módulo en src/server.js y conservar el uso de SP parametrizados. Los módulos de negocio comparten validación en crud-negocio.js.
