# Demo CRUD del lote B en Postman

Importar `demo_crud_B.postman_collection.json` como una coleccion nueva: **Demo CRUD B - Dependencias automaticas**. La coleccion anterior y sus modificaciones en Postman no se sustituyen. No hay contrasenas ni tokens reales en el archivo generado.

## Preparacion

1. Iniciar la API con `npm start` y verificar que las cuentas SQL tienen los permisos de `sql/05_permisos_api.sql`.
2. Ejecutar `sql/07_referencias_demo.sql` en SSMS. Elegir una fila con existencias de al menos dos unidades. Guardar el stock inicial de esa bodega/repuesto.
3. En las variables de la nueva coleccion, completar `baseUrl`, `correoLogin` y `claveLogin` con una cuenta **Administrador**. Usar valores locales; no exportar ni compartir la coleccion con secretos guardados.
4. Copiar los tres IDs de UNA fila del SQL a `idModeloReferencia`, `idRepuestoReferencia` e `idBodegaReferencia`. Se requieren porque los modulos GraphQL A de esas tablas aun no estan integrados. No se modifican los registros de modelo, repuesto ni bodega.
5. No configurar variables globales o de entorno con los mismos nombres que las de esta coleccion. No editar los IDs `idDemo...` ni `demoCreados`: son el registro usado para limitar la limpieza a las altas de esta ejecucion.

Se puede generar de nuevo el JSON ejecutando `npm run demo:generate`; eso no modifica la copia ya importada en Postman.

## Ejecucion manual o automatica

Para mostrar los pasos, abrir las carpetas **00 a 06 en orden** y enviar las solicitudes de arriba hacia abajo con Send. No es necesario editar los Body. Mantener los scripts Before request y After response de esta coleccion: resuelven las variables del Body visible y comprueban los resultados.

Para ejecutar todo, usar Run de la coleccion, seleccionar todas las solicitudes en su orden original, **una iteracion**, y ejecutar. Un error detiene el Runner; en modo manual, detenerse tambien y revisar antes de enviar operaciones dependientes.

| Carpeta | Resultado |
| --- | --- |
| 00 | Login administrador; guardar token. Se puede repetir para renovar la sesion sin perder los IDs creados. |
| 01 | Validar referencias positivas, obtener IDs de roles por su nombre y generar sufijo, correos, fechas y clave de prueba. No comprueba existencia ni stock de las referencias: se revisan con el SQL. |
| 02 | Intentar un nombre de Rol no admitido; `CONFLICT` es el resultado esperado. |
| 03 | Crear dos Usuarios, Empleado, Aseguradora, Caso, Cotizacion, DetalleCotizacion, Venta, DetalleVenta, Envio y Auditoria. Consultar cada alta y comprobar totales de 10.00. |
| 04 | Modificar y volver a consultar cada registro para comprobar persistencia; cantidades de los detalles pasan de uno a dos y los totales deben ser 20.00. |
| 05 | Borrar hijos antes de padres y comprobar ausencia. Solo se usan IDs registrados como creados en esta ejecucion. |
| 06 | Cerrar sesion y comprobar que no queden registros registrados como activos. |

No repetir Agregar tras un alta correcta. Cada ejecucion genera datos distintos, y otra preparacion queda bloqueada si el registro local indica que hay altas pendientes de limpiar. Completar la limpieza antes de iniciar otra demo.

## Recuperacion de un fallo

1. Conservar las variables de la coleccion, especialmente `demoRun`, `demoCreados` y todos los `idDemo...`. No reimportar ni iniciar otra preparacion.
2. Corregir la causa: permisos, referencia inexistente, stock o servidor apagado. Si vencio la sesion, ejecutar solo la carpeta 00 para obtener otro token de administrador.
3. Ejecutar la carpeta **05 - Limpieza** completa. Omite los registros que no se llegaron a crear o que ya se borraron. Si un borrado falla, se detiene: revisar el error antes de continuar.
4. Ejecutar 06. Despues puede iniciarse otra demo completa desde 00.

Si una respuesta de alta se pierde por una interrupcion de red, el servidor podria haber insertado el registro sin que Postman recibiera el ID. No repetir a ciegas: consultar los datos por el sufijo `demoRun` con mantenimiento y conciliar los IDs antes de continuar. La demo no es una transaccion unica ni puede garantizar limpieza ante un corte de red.

## Alcance y evidencia

Esta coleccion realiza escrituras reales. Usarla preferiblemente en una copia de pruebas, sin otros usuarios cambiando las existencias durante el recorrido. DetalleVenta consume una unidad al crear y otra al modificar; su borrado devuelve las dos segun el trigger exportado. Reejecutar el SQL de referencias al terminar y comparar el stock. La coleccion aun no puede consultar Inventario mediante GraphQL, por lo que esa comprobacion no es automatica.

Los triggers pueden dejar nuevas filas de auditoria y los identity avanzan aunque luego se borren registros. La limpieza elimina los registros de negocio propios de la demo y la Auditoria creada explicitamente; **no restaura el estado exacto anterior ni elimina auditorias automaticas**.

Rol tiene consulta y rechazo esperado; no se acredita su CRUD positivo completo porque CHECK solo admite Administrador/Empleado/Cliente y los tres ya existen. No se cambian esos roles ni sus restricciones. La coleccion no acredita los diez modulos A pendientes, aislamiento entre dos clientes ni concurrencia. Las pruebas anteriores de autenticacion y restricciones son complementarias.

Guardar capturas del alta, consulta, cambio persistido, borrado, ausencia y totales. Ocultar claves y tokens, incluida la clave temporal que resuelve el script antes de enviar los Usuarios. Las evidencias de CRUD no sustituyen las evidencias academicas de carga con SSMS/bcp.

## Validacion local del archivo

`npm run demo:check` comprueba documentos y variables contra el esquema GraphQL, ejecuta los scripts Postman con respuestas simuladas y verifica encadenamiento, limpieza parcial, IDs ajenos y parada ante fallo. No se conecta a SQL. Las pruebas reales se realizan importando el JSON en Postman.

Los scripts utilizan las funciones documentadas de [control de ejecucion de Postman](https://learning.postman.com/docs/tests-and-scripts/write-scripts/postman-sandbox-reference/pm-execution) para omitir solicitudes sin registros pendientes y detener el recorrido ante errores.
