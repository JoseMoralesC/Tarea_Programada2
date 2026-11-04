# Cómo usamos la API

Organizamos el servicio por tablas y conservamos las mismas operaciones para ambos lotes. Cada solicitud llega a GraphQL y se resuelve mediante un procedimiento almacenado de SQL Server.

## Inicio de sesión

Después de ejecutar `npm start`, enviamos las solicitudes a http://localhost:4000/.

```graphql
mutation IniciarSesion($correo: String!, $clave: String!) {
  login(correo: $correo, clave: $clave) {
    token
    expiraEn
    usuario { idUsuario nombre rol idEmpleado idAseguradora }
  }
}
```

Completamos las variables con una cuenta de prueba de nuestra base. En las solicitudes siguientes agregamos `Authorization: Bearer <token>`. El servicio obtiene el rol de la sesión, por eso no necesitamos enviarlo por separado ni aceptamos que se cambie desde el cliente.

```graphql
query {
  sesion { idUsuario rol }
  categorias { IdCategoria Nombre }
  marcas { IdMarca Nombre }
}

mutation { cerrarSesion }
```

Las sesiones duran una hora y se pierden al reiniciar el servidor. Al modificar o borrar un usuario desde la API cerramos sus sesiones. Si hacemos cambios directamente en SQL, reiniciamos el servicio cuando necesitemos invalidar las sesiones anteriores.

## Acceso que acordamos

| Información | Administrador | Empleado | Cliente | Sin sesión, si habilitamos genérico |
| --- | --- | --- | --- | --- |
| Categorías, marcas, modelos y compatibilidades | CRUD | CRUD | Consulta | Consulta |
| Repuestos con costo, bodegas, proveedores e inventario | CRUD | CRUD | Sin acceso | Sin acceso |
| Compras, detalles de compra, incidencias y movimientos | CRUD | CRUD | Sin acceso | Sin acceso |
| Roles y auditoría | CRUD | Sin acceso | Sin acceso | Sin acceso |
| Usuarios | CRUD | Consulta propia | Consulta propia | Sin acceso |
| Empleados | CRUD | Consulta propia | Sin acceso | Sin acceso |
| Aseguradoras | CRUD | Consulta | Consulta propia | Sin acceso |
| Casos, cotizaciones, ventas, sus detalles y envíos | CRUD | CRUD | Consulta propia | Sin acceso |

Usamos una conexión para cliente y otra para empleado; administrador utiliza esta última. La conexión genérica es opcional. El login se ejecuta con la conexión indicada por `DB_LOGIN_ROLE`, que normalmente es cliente. Las cuentas SQL reciben permiso únicamente para los procedimientos que necesitan.

## Agregar, cambiar y borrar

En el lote A enviamos los campos como argumentos. En los módulos B usamos `datos`, excepto Rol. Podemos consultar los argumentos completos en el esquema de Apollo o en las colecciones Postman.

```graphql
mutation {
  agregarProveedor(nombre: "Proveedor de prueba", diasEntrega: 2)
}

mutation {
  modificarProveedor(idProveedor: 1, telefono: null)
}

mutation {
  agregarUsuario(datos: {
    idRol: 2
    correo: "prueba@ejemplo.test"
    clave: "clave temporal de prueba"
  })
}
```

Los IDs del ejemplo se sustituyen por los de la base de pruebas. Las altas devuelven un ID y los cambios o borrados devuelven `true`. RepuestoModelo se identifica por el par `idRepuesto` e `idModelo`; su alta devuelve `true`.

Si omitimos un campo al modificar, conservamos su valor. Si enviamos `null`, lo dejamos vacío cuando la tabla lo permite: contactos, año final del modelo, recepción de compra, compra de una incidencia y bodegas opcionales de un movimiento, entre otros. No aceptamos cambios sin campos ni valores vacíos para datos obligatorios.

Las fechas de Compra se escriben como `AAAA-MM-DD`. En Incidencia y Movimiento aceptamos esa forma o una fecha ISO con zona horaria. En los módulos B usamos `FechaHora`, por ejemplo `2026-11-03T12:00:00Z`. Rechazamos fechas inexistentes.

En el lote B enviamos los importes como texto con hasta dos decimales, por ejemplo `"10.50"`. El lote A conserva sus argumentos numéricos y también valida que tengan como máximo dos decimales. Los estados disponibles se consultan en el esquema.

Los empleados registran movimientos, ventas y cotizaciones con su propio perfil. Solo el administrador puede indicar otro empleado. Los clientes ven únicamente sus operaciones y no reciben el costo interno de los detalles de venta.

## Usuarios y errores

Guardamos las contraseñas mediante un hash con sal aleatoria; no devolvemos claves ni hashes. Después de crear un usuario, agregamos el perfil de Empleado o Aseguradora que corresponde a su rol para que pueda iniciar sesión.

Los errores indican si falta iniciar sesión, no hay permiso, los datos son inválidos, el registro no existe o hay un conflicto de relaciones o existencias. Los mensajes internos de SQL se mantienen fuera de la respuesta.

Para comprobarlo usamos las pruebas de `test`, la [guía de Postman](pruebas/DEMO_CRUD.md) y `npm run test:integration`. La preparación de la base se explica en [Instalación SQL](INSTALACION_SQL.md).
