# Inventario de nuestra base

Trabajamos con 23 tablas de RepuestosAutomotrices. Cada una tiene sus operaciones GraphQL y sus procedimientos de consulta y mantenimiento. `sysdiagrams` pertenece a los diagramas de SSMS y no forma parte del modelo del proyecto.

Conservamos aquí las claves, columnas y relaciones para revisar el trabajo de ambos lotes. El resultado actualizado de las pruebas está en [Estado del proyecto](../ESTADO_PROYECTO.md).

## Tablas y relaciones

El nivel indicado solo expresa el orden topológico de las FK. Para cargar datos también tenemos en cuenta cómo cambian las existencias y los totales. Evitamos sumar dos veces los saldos y las operaciones que los originaron.

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

Los conteos de esta tabla corresponden al inventario inicial del 22 de octubre; los conservamos como referencia histórica, no como conteos actuales. RepuestoModelo tiene PK compuesta (IdRepuesto, IdModelo). Inventario dispone de unicidad por bodega/repuesto.

### Columnas y tipos

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

### Reglas que se ejecutan al cambiar datos

Obtenido con la consulta 4 de [script_InventarioBD.sql](script_InventarioBD.sql). Mantenemos estas reglas para actualizar los saldos y revisar que las relaciones sean correctas.

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

## Reparto y procedimientos

| Lote | Tablas que agrupamos |
| --- | --- |
| A | Categoria, Marca, Modelo, Repuesto, RepuestoModelo, Bodega, Proveedor, Inventario, Compra, DetalleCompra, Incidencia y Movimiento |
| B | Rol, Usuario, Empleado, Aseguradora, Caso, Cotizacion, DetalleCotizacion, Venta, DetalleVenta, Envio y Auditoria |

Uno de nosotros se encargó del lote A y el otro del B; ambos participamos en las revisiones y en el cierre. El lote A reúne 48 operaciones y el B 44, para un total de 92.

Usamos `Mantenimiento<Tabla>` para agregar, modificar y borrar, con los valores 1, 2 y 3 del parámetro `function`. Cada tabla tiene una consulta específica. En DetalleCompra y RepuestoModelo usamos `ConsultarDetalleCompra` y `ConsultarRepuestoModelo`; en los detalles del lote B usamos `ConsultarDetallesCotizacion` y `ConsultarDetallesVenta`.

Conservamos las definiciones completas en [la exportación SQL](../../db/RepuestosAutomotrices.sql). Los permisos están en [05_permisos_api.sql](../../db/sql/05_permisos_api.sql) y los cambios para campos opcionales en [06_campos_opcionales.sql](../../db/sql/06_campos_opcionales.sql).

Las evidencias de carga existentes se dan por suficientes. Para instalar y comprobar una copia seguimos [la guía SQL](../INSTALACION_SQL.md).
