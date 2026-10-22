# Inventario de RepuestosAutomotrices

Actualizado el **22/10/2026**. Base oficial confirmada por el usuario. El script compartido identifica 23 tablas, 34 SP, 13 triggers y 32 claves foráneas. La revisión del servidor confirmó tablas, SP, triggers y dependencias técnicas. Ver [Base de datos oficial](BASE_DATOS.md).

El inventario es una referencia heredada: no acredita APIs GraphQL, cargas con SSMS/bcp ni permisos por rol ya terminados. Columnas, parámetros y resultados completos deben revisarse en F1. Las cantidades son una fotografía de los datos preexistentes del 22/10/2026.

## Decisiones de alcance

| Decisión | Estado |
| --- | --- |
| Base y conexión | RepuestosAutomotrices; 100.124.109.126:15002 por Tailscale |
| Dominio | Repuestos, inventario, compras, aseguradoras, casos, cotizaciones, ventas y envíos |
| Continuidad con proyecto 1 | Confirmar alcance académico del modelo heredado |
| Tablas N | 23; mínimo previsto: 92 operaciones CRUD GraphQL |
| API por tabla | Módulos en un servicio GraphQL; confirmar interpretación con docente |
| Desarrollo | Node.js; bibliotecas y versión del backend por fijar |
| Dependencias técnicas | Secuencia y CLR presentes; verificación satisfactoria |
| Seguridad | Matriz cliente/empleado pendiente; DB_SETUP solo mantenimiento |
| Login | SP LoginUsuario y ObtenerCredencialLogin presentes; integración y cuenta mínima por definir |
| Rol genérico | Desactivado hasta justificar su necesidad |
| Zona de entrega | Confirmar con el curso; provisional America/Mexico_City |
| Cargas | Las realizará el usuario/equipo con archivos y evidencia reales |

## 1. Tablas, claves y dependencias

El nivel indicado solo expresa el orden topológico de las FK. **No es una instrucción de importación**: antes de cargar, resolver los efectos de triggers sobre inventario, totales y auditoría. No cargar simultáneamente un saldo final y sus operaciones históricas sin conciliación.

| Esquema.Tabla | PK (int) | FK: columna → tabla | Identity | Nivel FK | Filas observadas |
| --- | --- | --- | --- | ---: | ---: |
| dbo.Aseguradora | IdAseguradora | IdUsuario → Usuario | Sí | 3 | 3 |
| dbo.Auditoria | IdAuditoria | — | Sí | 1 | 12 |
| dbo.Bodega | IdBodega | — | Sí | 1 | 3 |
| dbo.Caso | IdCaso | IdAseguradora → Aseguradora; IdModelo → Modelo | Sí | 4 | 3 |
| dbo.Categoria | IdCategoria | — | Sí | 1 | 3 |
| dbo.Compra | IdCompra | IdBodega → Bodega; IdProveedor → Proveedor | Sí | 2 | 3 |
| dbo.Cotizacion | IdCotizacion | IdCaso → Caso; IdEmpleado → Empleado | Sí | 5 | 3 |
| dbo.DetalleCompra | IdDetalle | IdCompra → Compra; IdRepuesto → Repuesto | Sí | 3 | 3 |
| dbo.DetalleCotizacion | IdDetalle | IdCotizacion → Cotizacion; IdRepuesto → Repuesto | Sí | 6 | 3 |
| dbo.DetalleVenta | IdDetalle | IdBodega → Bodega; IdRepuesto → Repuesto; IdVenta → Venta | Sí | 7 | 3 |
| dbo.Empleado | IdEmpleado | IdUsuario → Usuario | Sí | 3 | 3 |
| dbo.Envio | IdEnvio | IdVenta → Venta | Sí | 7 | 3 |
| dbo.Incidencia | IdIncidencia | IdCompra → Compra; IdProveedor → Proveedor; IdRepuesto → Repuesto | Sí | 3 | 3 |
| dbo.Inventario | IdInventario | IdBodega → Bodega; IdRepuesto → Repuesto | Sí | 3 | 12 |
| dbo.Marca | IdMarca | — | Sí | 1 | 3 |
| dbo.Modelo | IdModelo | IdMarca → Marca | Sí | 2 | 6 |
| dbo.Movimiento | IdMovimiento | IdBodegaDestino → Bodega; IdBodegaOrigen → Bodega; IdEmpleado → Empleado; IdRepuesto → Repuesto | Sí | 4 | 3 |
| dbo.Proveedor | IdProveedor | — | Sí | 1 | 3 |
| dbo.Repuesto | IdRepuesto | IdCategoria → Categoria | Sí | 2 | 9 |
| dbo.RepuestoModelo | IdRepuesto, IdModelo | IdModelo → Modelo; IdRepuesto → Repuesto | No | 3 | 9 |
| dbo.Rol | IdRol | — | Sí | 1 | 3 |
| dbo.Usuario | IdUsuario | IdRol → Rol | Sí | 2 | 6 |
| dbo.Venta | IdVenta | IdCotizacion → Cotizacion; IdEmpleado → Empleado | Sí | 6 | 3 |

Total de filas de referencia: **105**, ya existentes; no fueron cargadas por esta asistencia. RepuestoModelo tiene PK compuesta (IdRepuesto, IdModelo). Inventario dispone de unicidad por bodega/repuesto.

## 2. Mapeo CRUD preliminar a procedimientos

Los 23 mantenimientos existentes identifican agregar/modificar/borrar mediante @function 1/2/3. ConsultarDatos cubre las 23 tablas mediante @TipoConsulta. **ConsultarDatos es administrativo y usa SELECT *: no se debe exponer sin controlar columnas y permisos, especialmente en Usuario.** Se requieren contratos y consultas apropiadas para GraphQL.

No hay queries o mutations implementadas todavía. El mapeo 92/92 es identificación estática, no funcionalidad probada. Los parámetros restantes, tipos, resultados, autorización y errores están pendientes de documentar por operación.

| Tabla | Operación | SP y selector identificados | GraphQL | Responsable/revisor | Estado |
| --- | --- | --- | --- | --- | --- |
| Aseguradora | Agregar | MantenimientoAseguradora (@function=1) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Aseguradora | Modificar | MantenimientoAseguradora (@function=2) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Aseguradora | Borrar | MantenimientoAseguradora (@function=3) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Aseguradora | Consultar | ConsultarDatos (@TipoConsulta=4) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Auditoria | Agregar | MantenimientoAuditoria (@function=1) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Auditoria | Modificar | MantenimientoAuditoria (@function=2) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Auditoria | Borrar | MantenimientoAuditoria (@function=3) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Auditoria | Consultar | ConsultarDatos (@TipoConsulta=23) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Bodega | Agregar | MantenimientoBodega (@function=1) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Bodega | Modificar | MantenimientoBodega (@function=2) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Bodega | Borrar | MantenimientoBodega (@function=3) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Bodega | Consultar | ConsultarDatos (@TipoConsulta=10) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Caso | Agregar | MantenimientoCaso (@function=1) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Caso | Modificar | MantenimientoCaso (@function=2) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Caso | Borrar | MantenimientoCaso (@function=3) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Caso | Consultar | ConsultarDatos (@TipoConsulta=16) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Categoria | Agregar | MantenimientoCategoria (@function=1) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Categoria | Modificar | MantenimientoCategoria (@function=2) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Categoria | Borrar | MantenimientoCategoria (@function=3) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Categoria | Consultar | ConsultarDatos (@TipoConsulta=5) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Compra | Agregar | MantenimientoCompra (@function=1) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Compra | Modificar | MantenimientoCompra (@function=2) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Compra | Borrar | MantenimientoCompra (@function=3) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Compra | Consultar | ConsultarDatos (@TipoConsulta=12) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Cotizacion | Agregar | MantenimientoCotizacion (@function=1) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Cotizacion | Modificar | MantenimientoCotizacion (@function=2) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Cotizacion | Borrar | MantenimientoCotizacion (@function=3) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Cotizacion | Consultar | ConsultarDatos (@TipoConsulta=17) | Pendiente | Por asignar | Contrato y permisos por revisar |
| DetalleCompra | Agregar | MantenimientoDetalleCompra (@function=1) | Pendiente | Por asignar | Contrato y permisos por revisar |
| DetalleCompra | Modificar | MantenimientoDetalleCompra (@function=2) | Pendiente | Por asignar | Contrato y permisos por revisar |
| DetalleCompra | Borrar | MantenimientoDetalleCompra (@function=3) | Pendiente | Por asignar | Contrato y permisos por revisar |
| DetalleCompra | Consultar | ConsultarDatos (@TipoConsulta=13) | Pendiente | Por asignar | Contrato y permisos por revisar |
| DetalleCotizacion | Agregar | MantenimientoDetalleCotizacion (@function=1) | Pendiente | Por asignar | Contrato y permisos por revisar |
| DetalleCotizacion | Modificar | MantenimientoDetalleCotizacion (@function=2) | Pendiente | Por asignar | Contrato y permisos por revisar |
| DetalleCotizacion | Borrar | MantenimientoDetalleCotizacion (@function=3) | Pendiente | Por asignar | Contrato y permisos por revisar |
| DetalleCotizacion | Consultar | ConsultarDatos (@TipoConsulta=18) | Pendiente | Por asignar | Contrato y permisos por revisar |
| DetalleVenta | Agregar | MantenimientoDetalleVenta (@function=1) | Pendiente | Por asignar | Contrato y permisos por revisar |
| DetalleVenta | Modificar | MantenimientoDetalleVenta (@function=2) | Pendiente | Por asignar | Contrato y permisos por revisar |
| DetalleVenta | Borrar | MantenimientoDetalleVenta (@function=3) | Pendiente | Por asignar | Contrato y permisos por revisar |
| DetalleVenta | Consultar | ConsultarDatos (@TipoConsulta=20) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Empleado | Agregar | MantenimientoEmpleado (@function=1) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Empleado | Modificar | MantenimientoEmpleado (@function=2) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Empleado | Borrar | MantenimientoEmpleado (@function=3) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Empleado | Consultar | ConsultarDatos (@TipoConsulta=3) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Envio | Agregar | MantenimientoEnvio (@function=1) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Envio | Modificar | MantenimientoEnvio (@function=2) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Envio | Borrar | MantenimientoEnvio (@function=3) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Envio | Consultar | ConsultarDatos (@TipoConsulta=21) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Incidencia | Agregar | MantenimientoIncidencia (@function=1) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Incidencia | Modificar | MantenimientoIncidencia (@function=2) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Incidencia | Borrar | MantenimientoIncidencia (@function=3) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Incidencia | Consultar | ConsultarDatos (@TipoConsulta=22) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Inventario | Agregar | MantenimientoInventario (@function=1) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Inventario | Modificar | MantenimientoInventario (@function=2) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Inventario | Borrar | MantenimientoInventario (@function=3) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Inventario | Consultar | ConsultarDatos (@TipoConsulta=14) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Marca | Agregar | MantenimientoMarca (@function=1) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Marca | Modificar | MantenimientoMarca (@function=2) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Marca | Borrar | MantenimientoMarca (@function=3) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Marca | Consultar | ConsultarDatos (@TipoConsulta=6) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Modelo | Agregar | MantenimientoModelo (@function=1) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Modelo | Modificar | MantenimientoModelo (@function=2) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Modelo | Borrar | MantenimientoModelo (@function=3) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Modelo | Consultar | ConsultarDatos (@TipoConsulta=7) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Movimiento | Agregar | MantenimientoMovimiento (@function=1) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Movimiento | Modificar | MantenimientoMovimiento (@function=2) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Movimiento | Borrar | MantenimientoMovimiento (@function=3) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Movimiento | Consultar | ConsultarDatos (@TipoConsulta=15) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Proveedor | Agregar | MantenimientoProveedor (@function=1) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Proveedor | Modificar | MantenimientoProveedor (@function=2) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Proveedor | Borrar | MantenimientoProveedor (@function=3) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Proveedor | Consultar | ConsultarDatos (@TipoConsulta=11) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Repuesto | Agregar | MantenimientoRepuesto (@function=1) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Repuesto | Modificar | MantenimientoRepuesto (@function=2) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Repuesto | Borrar | MantenimientoRepuesto (@function=3) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Repuesto | Consultar | ConsultarDatos (@TipoConsulta=8) | Pendiente | Por asignar | Contrato y permisos por revisar |
| RepuestoModelo | Agregar | MantenimientoRepuestoModelo (@function=1) | Pendiente | Por asignar | Contrato y permisos por revisar |
| RepuestoModelo | Modificar | MantenimientoRepuestoModelo (@function=2) | Pendiente | Por asignar | Contrato y permisos por revisar |
| RepuestoModelo | Borrar | MantenimientoRepuestoModelo (@function=3) | Pendiente | Por asignar | Contrato y permisos por revisar |
| RepuestoModelo | Consultar | ConsultarDatos (@TipoConsulta=9) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Rol | Agregar | MantenimientoRol (@function=1) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Rol | Modificar | MantenimientoRol (@function=2) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Rol | Borrar | MantenimientoRol (@function=3) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Rol | Consultar | ConsultarDatos (@TipoConsulta=1) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Usuario | Agregar | MantenimientoUsuario (@function=1) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Usuario | Modificar | MantenimientoUsuario (@function=2) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Usuario | Borrar | MantenimientoUsuario (@function=3) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Usuario | Consultar | ConsultarDatos (@TipoConsulta=2) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Venta | Agregar | MantenimientoVenta (@function=1) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Venta | Modificar | MantenimientoVenta (@function=2) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Venta | Borrar | MantenimientoVenta (@function=3) | Pendiente | Por asignar | Contrato y permisos por revisar |
| Venta | Consultar | ConsultarDatos (@TipoConsulta=19) | Pendiente | Por asignar | Contrato y permisos por revisar |

### Procedimientos adicionales y transversales

`ConsultarBaseActiva`, `ConsultarCatalogo`, `ConsultarCategorias`, `ConsultarDatos`, `ConsultarMarcas`, `ConsultarMisCasos`, `ConsultarModelos`, `ConsultarRepuestoInterno`, `GuardarRepuestoApp`, `LoginUsuario`, `ObtenerCredencialLogin`. Junto con los 23 mantenimientos forman los 34 SP identificados. ConsultarMisCasos debe recibir el usuario obtenido de la sesión verificada; ObtenerCredencialLogin devuelve un hash para uso interno, nunca para una respuesta pública.

## 3. Seguridad y ajustes pendientes

La política por operación debe acordarse y probarse. Los roles de negocio Administrador, Empleado y Cliente no sustituyen identidades SQL separadas. No asignar permisos de administración a la API para resolver pruebas.

| Tabla/SP/operación | Cliente | Empleado | Genérico | Regla | Prueba SQL/GraphQL |
| --- | --- | --- | --- | --- | --- |
| Por completar según matriz del modelo | Pendiente | Pendiente | No aplica hasta justificarlo | Por definir | Pendiente |

Pendientes BD01–BD07: separar cuentas/permisos; respuestas y errores de SP; asignación de NULL; consultas con columnas controladas; protección de totales/inventario/auditoría; estrategia de cargas/triggers; alcance del modelo y login. Ver [detalle y estado](BASE_DATOS.md).

## 4. Archivos y cargas por tabla

Ninguna fila preexistente acredita por sí misma la importación del proyecto. Completar archivo, formato, herramienta, conteos antes/después y capturas cuando el usuario ejecute las cargas.

| Tabla | Archivo/hoja/formato | Herramienta | Filas previstas/importadas | Conteos antes/después | Evidencia |
| --- | --- | --- | --- | --- | --- |
| Aseguradora | Pendiente | Por definir | Pendiente | Pendiente | Pendiente |
| Auditoria | Pendiente | Por definir | Pendiente | Pendiente | Pendiente |
| Bodega | Pendiente | Por definir | Pendiente | Pendiente | Pendiente |
| Caso | Pendiente | Por definir | Pendiente | Pendiente | Pendiente |
| Categoria | Pendiente | Por definir | Pendiente | Pendiente | Pendiente |
| Compra | Pendiente | Por definir | Pendiente | Pendiente | Pendiente |
| Cotizacion | Pendiente | Por definir | Pendiente | Pendiente | Pendiente |
| DetalleCompra | Pendiente | Por definir | Pendiente | Pendiente | Pendiente |
| DetalleCotizacion | Pendiente | Por definir | Pendiente | Pendiente | Pendiente |
| DetalleVenta | Pendiente | Por definir | Pendiente | Pendiente | Pendiente |
| Empleado | Pendiente | Por definir | Pendiente | Pendiente | Pendiente |
| Envio | Pendiente | Por definir | Pendiente | Pendiente | Pendiente |
| Incidencia | Pendiente | Por definir | Pendiente | Pendiente | Pendiente |
| Inventario | Pendiente | Por definir | Pendiente | Pendiente | Pendiente |
| Marca | Pendiente | Por definir | Pendiente | Pendiente | Pendiente |
| Modelo | Pendiente | Por definir | Pendiente | Pendiente | Pendiente |
| Movimiento | Pendiente | Por definir | Pendiente | Pendiente | Pendiente |
| Proveedor | Pendiente | Por definir | Pendiente | Pendiente | Pendiente |
| Repuesto | Pendiente | Por definir | Pendiente | Pendiente | Pendiente |
| RepuestoModelo | Pendiente | Por definir | Pendiente | Pendiente | Pendiente |
| Rol | Pendiente | Por definir | Pendiente | Pendiente | Pendiente |
| Usuario | Pendiente | Por definir | Pendiente | Pendiente | Pendiente |
| Venta | Pendiente | Por definir | Pendiente | Pendiente | Pendiente |

## 5. Asignación equilibrada

Presupuesto: **48 puntos por persona**, según [ROADMAP.md](../roadmap/ROADMAP.md). La cantidad de tablas no determina por sí sola el esfuerzo; ponderar carga (1–3), SP/CRUD (1–5), pruebas/evidencia (1–3), más tareas transversales y revisión. Los pesos comparativos no se suman a los 96 puntos del calendario.

| Paquete/tabla/subtarea | Carga 1–3 | SP/CRUD 1–5 | Pruebas/evidencia 1–3 | Total | Responsable | Revisor |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| Por asignar después de revisar contratos y seguridad | — | — | — | — | — | — |

Lotes A/B pendientes. No dar por cerrada F1 solo por disponer de los nombres de las tablas.

## 6. Trazabilidad del paquete final

| Tabla | Fuente de carga | Capturas | Apartado Word/PDF | CRUD/SP revisado y probado | Script SSMS con datos | Revisor/fecha |
| --- | --- | --- | --- | --- | --- | --- |
| Aseguradora | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Auditoria | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Bodega | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Caso | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Categoria | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Compra | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Cotizacion | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| DetalleCompra | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| DetalleCotizacion | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| DetalleVenta | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Empleado | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Envio | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Incidencia | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Inventario | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Marca | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Modelo | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Movimiento | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Proveedor | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Repuesto | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| RepuestoModelo | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Rol | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Usuario | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Venta | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |

Cerrar las 23 filas contra los entregables reales. La [plantilla de evidencias](../PLANTILLA_EVIDENCIAS.md) no sustituye al Word/PDF final. El [seguimiento](../markdowns/PROGRESO.md) conserva los pendientes sin asignar revisiones ficticias.
