# Recorrido de demostración en Postman

Preparamos `demo_crud_B.postman_collection.json` para mostrar el funcionamiento de las once tablas del lote B. La colección genera datos de prueba, guarda los IDs y permite consultar los cambios antes de borrar lo que creó.

## Antes de comenzar

1. Iniciamos la API con `npm start` y usamos una base de pruebas con los permisos de `db/sql/05_permisos_api.sql` y los cambios de `db/sql/06_campos_opcionales.sql`.
2. Ejecutamos `db/sql/07_referencias_demo.sql` en SSMS. Elegimos una fila con al menos dos unidades disponibles y anotamos sus tres IDs y el stock inicial.
3. Importamos la colección y completamos `baseUrl`, `correoLogin` y `claveLogin` con una cuenta administrador de esa base.
4. Copiamos los IDs a `idModeloReferencia`, `idRepuestoReferencia` e `idBodegaReferencia`. Usamos referencias existentes para concentrar esta demostración en el lote B; los módulos A ya están integrados.

Guardamos las credenciales como valores locales y no compartimos una exportación con claves o tokens. Dejamos que la colección administre los IDs `idDemo...` y `demoCreados`.

## Orden que seguimos

Podemos enviar las solicitudes manualmente, de arriba hacia abajo, o usar Run con todas las carpetas y una sola iteración. Conservamos los scripts que preparan las variables y revisan las respuestas.

| Carpeta | Qué mostramos |
| --- | --- |
| 00 | Inicio de sesión del administrador |
| 01 | Referencias, roles y datos de esta ejecución |
| 02 | Rechazo de un nombre de rol que la base no permite |
| 03 | Altas y consultas; los totales comienzan en 10.00 |
| 04 | Cambios y consultas; los detalles pasan a dos unidades y los totales a 20.00 |
| 05 | Borrado de hijos antes de padres y comprobación de ausencia |
| 06 | Cierre de sesión y revisión de la limpieza |

No repetimos un alta que ya tuvo éxito. Si aparece un fallo, detenemos el recorrido, conservamos las variables y corregimos la causa. Si venció la sesión, repetimos solo el login. Después ejecutamos la carpeta 05 para limpiar los registros creados y terminamos con la 06.

Si se pierde una respuesta por un corte de red, revisamos los registros por el sufijo `demoRun` antes de intentar el alta otra vez. Al terminar comparamos las existencias con el valor inicial. Podemos consultarlas mediante la query `inventario` o con el SQL de referencias.

La limpieza devuelve las existencias consumidas por los detalles de venta. Los números identity avanzan y las auditorías automáticas permanecen, por lo que no esperamos que todos los valores internos vuelvan exactamente al estado anterior.

## Qué cubre cada comprobación

Esta colección se concentra en el lote B. El rol tiene una consulta y un rechazo esperado porque los tres nombres permitidos ya existen en la base habitual. Para probar también su alta, cambio y borrado positivos usamos una copia vacía en `npm run test:integration`.

`npm run demo:check` comprueba la colección y sus scripts con respuestas simuladas. El ensayo de integración prueba las 23 tablas con SQL real e incluye separación entre clientes, campos vacíos, stock, totales y concurrencia de ventas.

Si necesitamos regenerar el JSON usamos `npm run demo:generate` y lo importamos de nuevo. Conservamos las evidencias que ya reunimos; esta guía organiza la demostración y no exige repetir las capturas de carga.
