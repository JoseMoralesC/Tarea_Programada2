# Inventario de RepuestosAutomotrices

Modelo heredado de 23 tablas. Las columnas y relaciones se inventariaron el 26/10/2026; los conteos de filas corresponden al 22/10/2026 y no acreditan una carga académica. Los 34 SP originales son una referencia anterior a los ajustes posteriores, no el total actual.

El estado vigente del código y los pendientes están en el [README](../../README.md); los contratos y permisos de la API, en [API.md](../API.md). SQL 03/04 fue aplicado por el usuario y se verificaron sus 22 procedimientos/parámetros y once consultas de solo lectura el 29/10/2026. Faltan ciclos CRUD reales y permisos restringidos.

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

### 1.1 Columnas y tipos

Obtenido con la consulta 1 de [script_InventarioBD.sql](script_InventarioBD.sql) el 26/10/2026. `NULL` indica columna opcional; el resto es obligatoria. Se excluye `sysdiagrams`, creada por SSMS para diagramas.

| Tabla | Columnas |
| --- | --- |
| Aseguradora | IdAseguradora int, IdUsuario int, CedulaJuridica varchar(20), Nombre nvarchar(100), Telefono varchar(15) NULL, Correo varchar(100) NULL |
| Auditoria | IdAuditoria int, Tabla varchar(50), Accion char(1), Usuario varchar(100), Fecha datetime |
| Bodega | IdBodega int, Nombre nvarchar(60), Ubicacion nvarchar(150) |
| Caso | IdCaso int, IdAseguradora int, IdModelo int, Placa varchar(10), Estado varchar(20), FechaApertura datetime |
| Categoria | IdCategoria int, Nombre nvarchar(60) |
| Compra | IdCompra int, IdProveedor int, IdBodega int, Fecha date, FechaRecepcion date NULL, Total decimal(12,2) |
| Cotizacion | IdCotizacion int, IdCaso int, IdEmpleado int, Fecha datetime, Estado varchar(15), Total decimal(12,2) |
| DetalleCompra | IdDetalle int, IdCompra int, IdRepuesto int, Cantidad int, Costo decimal(10,2) |
| DetalleCotizacion | IdDetalle int, IdCotizacion int, IdRepuesto int, Cantidad int, Precio decimal(10,2), Estado varchar(15) |
| DetalleVenta | IdDetalle int, IdVenta int, IdRepuesto int, IdBodega int, Cantidad int, Precio decimal(10,2), Costo decimal(10,2) |
| Empleado | IdEmpleado int, IdUsuario int, Cedula varchar(20), Nombre nvarchar(100), Puesto nvarchar(50) |
| Envio | IdEnvio int, IdVenta int, Direccion nvarchar(200), Costo decimal(10,2), Estado varchar(15), FechaEntrega datetime NULL |
| Incidencia | IdIncidencia int, IdRepuesto int, IdProveedor int, IdCompra int NULL, Tipo varchar(20), Cantidad int, Fecha datetime |
| Inventario | IdInventario int, IdBodega int, IdRepuesto int, Cantidad int |
| Marca | IdMarca int, Nombre nvarchar(50) |
| Modelo | IdModelo int, IdMarca int, Nombre nvarchar(60), AnioInicio int, AnioFin int NULL |
| Movimiento | IdMovimiento int, IdRepuesto int, IdBodegaOrigen int NULL, IdBodegaDestino int NULL, IdEmpleado int, Tipo varchar(15), Cantidad int, Fecha datetime |
| Proveedor | IdProveedor int, Nombre nvarchar(100), Telefono varchar(15) NULL, Correo varchar(100) NULL, DiasEntrega int |
| Repuesto | IdRepuesto int, IdCategoria int, Codigo varchar(30), Nombre nvarchar(120), PrecioVenta decimal(10,2), Costo decimal(10,2), Activo bit |
| RepuestoModelo | IdRepuesto int, IdModelo int |
| Rol | IdRol int, Nombre varchar(30) |
| Usuario | IdUsuario int, IdRol int, Correo varchar(100), Contrasena varchar(255), Activo bit |
| Venta | IdVenta int, IdCotizacion int, IdEmpleado int, Fecha datetime, Total decimal(12,2) |

### 1.2 Triggers y efecto en la carga

Obtenido con la consulta 4 de [script_InventarioBD.sql](script_InventarioBD.sql). Los contratos y triggers del lote B se contrastaron con el servidor el 29/10/2026. Revisar el resto antes de la carga.

| Trigger | Tabla | Función | Efecto en la carga masiva |
| --- | --- | --- | --- |
| TR_Usuario_Auditoria | Usuario | Registra cambios en Auditoria | Agrega filas a Auditoria si se dispara |
| TR_Usuario_ValidarPerfil | Usuario | Valida datos del perfil | Puede rechazar filas inválidas |
| TR_Empleado_ValidarRol | Empleado | Valida rol empleado del usuario | El usuario debe tener rol Administrador/Empleado |
| TR_Aseguradora_ValidarRol | Aseguradora | Valida rol cliente del usuario | El IdUsuario del archivo debe tener rol cliente |
| TR_Repuesto_Auditoria | Repuesto | Registra cambios en Auditoria | Agrega filas a Auditoria si se dispara |
| TR_Inventario_Auditoria | Inventario | Registra cambios en Auditoria | Agrega filas a Auditoria si se dispara |
| TR_Compra_ValidarBodega | Compra | Valida la bodega de la compra | Puede rechazar filas inválidas |
| TR_DetalleCompra_Total | DetalleCompra | Recalcula Compra.Total | Sin disparo, el Total del archivo debe cuadrar |
| TR_DetalleCompra_Inventario | DetalleCompra | Suma existencias | Con disparo, Inventario cambia |
| TR_DetalleCotizacion_Total | DetalleCotizacion | Recalcula Cotizacion.Total | Sin disparo, el Total del archivo debe cuadrar |
| TR_DetalleVenta_Total | DetalleVenta | Recalcula Venta.Total | Sin disparo, el Total del archivo debe cuadrar |
| TR_DetalleVenta_Inventario | DetalleVenta | Resta existencias | Con disparo, Inventario cambia y puede quedar sin stock |
| TR_Movimiento_Inventario | Movimiento | Mueve existencias entre bodegas | Con disparo, Inventario cambia |

Antes de importar, comprobar si la herramienta dispara triggers y cómo se concilian existencias, totales y auditoría.

## 2. Procedimientos y cobertura GraphQL

Los mantenimientos siguen el nombre dbo.Mantenimiento<Tabla>, con @function=1 para agregar, 2 para modificar y 3 para borrar. Las consultas específicas son las siguientes. El código implementado tiene cuatro operaciones por tabla; la columna de estado no acredita pruebas CRUD reales.

| Tabla | Lote | Consulta específica | GraphQL |
| --- | --- | --- | --- |
| Categoria | A | ConsultarCategorias | Implementado; SQL simulado |
| Marca | A | ConsultarMarcas | Implementado; SQL simulado |
| Modelo | A | ConsultarModelos | Módulo pendiente |
| Repuesto | A | ConsultarRepuestos | Módulo pendiente |
| RepuestoModelo | A | ConsultarRepuestoModelo | Módulo pendiente |
| Bodega | A | ConsultarBodegas | Módulo pendiente |
| Proveedor | A | ConsultarProveedores | Módulo pendiente |
| Inventario | A | ConsultarInventario | Módulo pendiente |
| Compra | A | ConsultarCompras | Módulo pendiente |
| DetalleCompra | A | ConsultarDetalleCompra | Módulo pendiente |
| Incidencia | A | ConsultarIncidencias | Módulo pendiente |
| Movimiento | A | ConsultarMovimientos | Módulo pendiente |
| Rol | B | ConsultarRoles | Implementado; SQL simulado |
| Usuario | B | ConsultarUsuarios | Implementado; SQL simulado |
| Empleado | B | ConsultarEmpleados | Implementado; SQL simulado |
| Aseguradora | B | ConsultarAseguradoras | Implementado; SQL simulado |
| Caso | B | ConsultarCasos | Implementado; SQL simulado |
| Cotizacion | B | ConsultarCotizaciones | Implementado; SQL simulado |
| DetalleCotizacion | B | ConsultarDetallesCotizacion | Implementado; SQL simulado |
| Venta | B | ConsultarVentas | Implementado; SQL simulado |
| DetalleVenta | B | ConsultarDetallesVenta | Implementado; SQL simulado |
| Envio | B | ConsultarEnvios | Implementado; SQL simulado |
| Auditoria | B | ConsultarAuditorias | Implementado; SQL simulado |

Categoria y Marca suman ocho operaciones A; las once tablas B suman 44. Total: 52/92 operaciones implementadas. Los demás módulos A siguen pendientes.

ConsultarDatos es administrativo y usa SELECT *; la API no lo expone. ObtenerCredencialLogin es interno y no debe publicar hashes. La API usa LoginUsuario para validar la clave y obtener un perfil coherente. La secuencia SecuenciaCodigoRepuesto y el verificador CLR se comprobaron; ver las [herramientas de mantenimiento](../../README.md#scripts-sql).

Los ajustes A están en [Nuevos_Y_Modificacion_SP.sql](../../scripts/Nuevos_Y_Modificacion_SP.sql), con aplicación reportada por persona 1. Los B están en [03](../../sql/ajustes/03_lote_B_usuarios_procedimientos.sql) y [04](../../sql/ajustes/04_lote_B_negocio_procedimientos.sql), aplicados y contrastados. Estos scripts requieren la estructura heredada del proyecto 1.

## 3. Reparto y dependencias entre compañeros

| Responsable | Lote | Tablas | Revisor |
| --- | --- | --- | --- |
| Persona 1 | A | Categoria, Marca, Modelo, Repuesto, RepuestoModelo, Bodega, Proveedor, Inventario, Compra, DetalleCompra, Incidencia, Movimiento | Persona 2 |
| Persona 2 | B | Rol, Usuario, Empleado, Aseguradora, Caso, Cotizacion, DetalleCotizacion, Venta, DetalleVenta, Envio, Auditoria | Persona 1 |

El reparto original preveía 48 puntos por persona incluyendo pruebas, documentación y revisión. La cantidad de tablas no mide por sí sola el esfuerzo; acordar entre ambos cualquier reasignación y revisión cruzada, sin dar por aceptadas tareas que aún carecen de evidencia.

Movimiento necesita Empleado; Caso necesita Modelo; los detalles de cotización/venta necesitan Repuesto y la venta necesita Bodega. Los niveles FK de la tabla técnica sirven de referencia, pero el orden de carga también depende de triggers y saldos conciliados. No cargar a la vez un saldo final de inventario y las operaciones que lo reconstruyen sin controlar sus efectos.

## 4. Carga y evidencia pendientes

Para cada una de las 23 tablas registrar archivo/hoja/formato, herramienta, conteos antes/después, validación de PK/FK y capturas de resultado. Usar SSMS y bcp al menos una vez cada uno, conservar los originales y preparar el Word/PDF con la [plantilla de evidencias](../PLANTILLA_EVIDENCIAS.md).

Acordar el tratamiento de identity, NULL, codificación, restricciones y triggers antes de importar. No ejecutar una propuesta de vaciado de datos como parte de estas verificaciones. Los datos preexistentes y los scripts de ajustes no sustituyen la carga documentada.
