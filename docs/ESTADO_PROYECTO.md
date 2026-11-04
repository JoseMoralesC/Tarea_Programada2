# Estado del proyecto

Revisión del 3 de noviembre de 2026.

Completamos las operaciones de las 23 tablas y atendimos los problemas que aparecieron en la revisión general. Comprobamos el funcionamiento con las cuentas SQL de la aplicación y ensayamos el CRUD en copias separadas. Las evidencias que ya tenemos se consideran suficientes.

## Qué quedó resuelto

| Tema | Resultado |
| --- | --- |
| APIs de las tablas | Tenemos las 92 operaciones: agregar, consultar, modificar y borrar |
| Permisos | Aplicamos permisos por procedimiento; las cuentas de la API siguen sin ser propietarias de la base |
| Campos opcionales | Podemos conservar un valor omitiendo el campo o limpiarlo con `null` |
| Fechas y entradas | Rechazamos fechas inexistentes, textos vacíos, cantidades fuera de rango y cambios sin campos |
| Empleado responsable | Un empleado no puede registrar movimientos a nombre de otro |
| Archivos y herramientas | Unificamos los nombres de módulos y corregimos las rutas de los scripts |
| Exportación | Conservamos estructura, datos, procedimientos, triggers, secuencia y permisos |
| Dependencias de Node | Actualizamos las dependencias afectadas; npm no reportó vulnerabilidades después del ajuste |
| Documentación | Actualizamos las guías para explicar nuestras decisiones y el uso del proyecto |

## Pruebas que realizamos

`npm test` terminó con **45 pruebas aprobadas**. Usan respuestas SQL simuladas y nos sirven para revisar las reglas y los permisos de la API sin escribir en la base.

`npm run test:integration` terminó correctamente con **las 92 operaciones CRUD sobre SQL real**. Creamos bases temporales separadas de la base compartida y las eliminamos al terminar. Comprobamos:

- Altas, consultas, cambios persistidos y borrados de las 23 tablas.
- Inicio de sesión, restricciones de empleados y separación entre dos clientes.
- Campos que pueden quedar vacíos, fechas y rechazo de cambios inválidos.
- Totales de compras, cotizaciones y ventas, junto con los cambios en las existencias.
- Rechazo de ventas sin existencias y de relaciones inválidas, conservando los datos anteriores.
- Dos ventas simultáneas que compiten por el mismo stock: solo una puede consumirlo.
- Restauración de la exportación con los datos de las 23 tablas y su secuencia.

La restauración se ensayó en otra base de la misma instancia SQL Server. La preparación de una instancia distinta se describe en [Instalación SQL](INSTALACION_SQL.md); no afirmamos haber instalado el proyecto en otro equipo durante esta revisión.

La comprobación de claves con el CLR y el validador de dependencias también terminaron correctamente. `npm run demo:check` validó 75 solicitudes, 170 documentos y variables y 353 aserciones de la colección Postman con respuestas simuladas.

## Cumplimiento del enunciado

| Lo que pide el curso | Cómo lo atendemos |
| --- | --- |
| Continuar el proyecto anterior | Usamos el modelo RepuestosAutomotrices con sus 23 tablas |
| Carga con SSMS y bcp y su documentación | Conservamos las evidencias existentes como suficientes |
| API GraphQL por tabla con cuatro operaciones | Los 23 módulos reúnen las 92 operaciones y se probaron con SQL real |
| Resolver las operaciones mediante procedimientos | Las consultas y cambios se envían a los procedimientos de la base |
| Conexiones diferentes según el usuario | Separamos cliente, empleado y acceso genérico opcional |
| Validación de usuarios y roles | El login genera una sesión y aplicamos los permisos de esa sesión |
| Exportación con estructura y datos | Conservamos el SQL completo y comprobamos su recreación en una copia |
| Código, originales y documentos para entregar | Seguimos la lista del README para reunir el paquete y conservamos `docs/doc master` |

No registramos aquí una entrega en Teams ni una revisión del docente: corresponden al cierre académico. Tampoco asignamos una calificación a partir de las pruebas.

El detalle de los ajustes está en [Revisión general](AUDITORIA_GENERAL_2026-11-03.md). Para repetir el ensayo usamos los comandos del [README](../README.md).
