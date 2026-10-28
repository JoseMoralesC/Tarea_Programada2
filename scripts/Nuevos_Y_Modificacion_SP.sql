/* =====================================================================
   Proyecto 2 · TI-156 · Lote A (Persona 1)
   Ajustes y procedimientos de consulta para las APIs GraphQL
   
   Parte 1. ALTER de los Mantenimiento<Tabla> del lote A:
     - SET NOCOUNT ON
     - function 1 devuelve el ID nuevo con SCOPE_IDENTITY()
     - function 2 da error si el registro no existe (antes devolvía éxito
       aunque no modificara nada)
     
   Parte 2. Procedimientos de consulta para el CRUD:
     - ConsultarModelos: se agregan columnas (compatible con el uso actual)
     - Nuevos: ConsultarRepuestos, ConsultarRepuestoModelo, ConsultarBodegas,
       ConsultarProveedores, ConsultarInventario, ConsultarCompras,
       ConsultarDetalleCompra, ConsultarIncidencias, ConsultarMovimientos
     - Todos con filtro opcional por ID (NULL = todos), para que las
       consultas puedan crecer en el proyecto web

   ===================================================================== */

USE RepuestosAutomotrices;
GO

--parte1 

ALTER PROCEDURE dbo.MantenimientoCategoria
(@function int, @IdCategoria int = null, @Nombre nvarchar(60) = null)
AS
SET NOCOUNT ON;
IF @function = 1 -- insert
BEGIN
    INSERT INTO Categoria(Nombre) VALUES(@Nombre);
    SELECT CAST(SCOPE_IDENTITY() AS int) AS IdCategoria;
END
IF @function = 2 -- update (si el parametro viene nulo se mantiene el dato actual)
BEGIN
    UPDATE Categoria SET Nombre = ISNULL(@Nombre, Nombre)
    WHERE IdCategoria = @IdCategoria;
    IF @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Error, la modificacion no encontro el dato', 16, 1);
        RETURN -1;
    END
END
IF @function = 3 -- borrar
BEGIN
    DELETE FROM Categoria WHERE IdCategoria = @IdCategoria;
    IF @@ERROR <> 0 OR @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Error, el borrado no encontro dato o fallo', 16, 1);
        RETURN -1;
    END
END
GO

ALTER PROCEDURE dbo.MantenimientoMarca
(@function int, @IdMarca int = null, @Nombre nvarchar(50) = null)
AS
SET NOCOUNT ON;
IF @function = 1 -- insert
BEGIN
    INSERT INTO Marca(Nombre) VALUES(@Nombre);
    SELECT CAST(SCOPE_IDENTITY() AS int) AS IdMarca;
END
IF @function = 2 -- update
BEGIN
    UPDATE Marca SET Nombre = ISNULL(@Nombre, Nombre)
    WHERE IdMarca = @IdMarca;
    IF @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Error, la modificacion no encontro el dato', 16, 1);
        RETURN -1;
    END
END
IF @function = 3 -- borrar
BEGIN
    DELETE FROM Marca WHERE IdMarca = @IdMarca;
    IF @@ERROR <> 0 OR @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Error, el borrado no encontro dato o fallo', 16, 1);
        RETURN -1;
    END
END
GO

ALTER PROCEDURE dbo.MantenimientoModelo
(@function int, @IdModelo int = null, @IdMarca int = null, @Nombre nvarchar(60) = null,
 @AnioInicio int = null, @AnioFin int = null)
AS
SET NOCOUNT ON;
IF @function = 1 -- insert
BEGIN
    INSERT INTO Modelo(IdMarca, Nombre, AnioInicio, AnioFin)
    VALUES(@IdMarca, @Nombre, @AnioInicio, @AnioFin);
    SELECT CAST(SCOPE_IDENTITY() AS int) AS IdModelo;
END
IF @function = 2 -- update
BEGIN
    UPDATE Modelo SET
        IdMarca = ISNULL(@IdMarca, IdMarca),
        Nombre = ISNULL(@Nombre, Nombre),
        AnioInicio = ISNULL(@AnioInicio, AnioInicio),
        AnioFin = ISNULL(@AnioFin, AnioFin)
    WHERE IdModelo = @IdModelo;
    IF @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Error, la modificacion no encontro el dato', 16, 1);
        RETURN -1;
    END
END
IF @function = 3 -- borrar
BEGIN
    DELETE FROM Modelo WHERE IdModelo = @IdModelo;
    IF @@ERROR <> 0 OR @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Error, el borrado no encontro dato o fallo', 16, 1);
        RETURN -1;
    END
END
GO

ALTER PROCEDURE dbo.MantenimientoRepuesto
(@function int, @IdRepuesto int = null, @IdCategoria int = null, @Codigo varchar(30) = null,
 @Nombre nvarchar(120) = null, @PrecioVenta decimal(10,2) = null, @Costo decimal(10,2) = null,
 @Activo bit = null)
AS
SET NOCOUNT ON;
IF @function = 1 -- insert
BEGIN
    INSERT INTO Repuesto(IdCategoria, Codigo, Nombre, PrecioVenta, Costo, Activo)
    VALUES(@IdCategoria, @Codigo, @Nombre, @PrecioVenta, @Costo, ISNULL(@Activo, 1));
    SELECT CAST(SCOPE_IDENTITY() AS int) AS IdRepuesto;
END
IF @function = 2 -- update
BEGIN
    UPDATE Repuesto SET
        IdCategoria = ISNULL(@IdCategoria, IdCategoria),
        Codigo = ISNULL(@Codigo, Codigo),
        Nombre = ISNULL(@Nombre, Nombre),
        PrecioVenta = ISNULL(@PrecioVenta, PrecioVenta),
        Costo = ISNULL(@Costo, Costo),
        Activo = ISNULL(@Activo, Activo)
    WHERE IdRepuesto = @IdRepuesto;
    IF @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Error, la modificacion no encontro el dato', 16, 1);
        RETURN -1;
    END
END
IF @function = 3 -- borrar
BEGIN
    DELETE FROM Repuesto WHERE IdRepuesto = @IdRepuesto;
    IF @@ERROR <> 0 OR @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Error, el borrado no encontro dato o fallo', 16, 1);
        RETURN -1;
    END
END
GO

ALTER PROCEDURE dbo.MantenimientoBodega
(@function int, @IdBodega int = null, @Nombre nvarchar(60) = null, @Ubicacion nvarchar(150) = null)
AS
SET NOCOUNT ON;
IF @function = 1 -- insert
BEGIN
    INSERT INTO Bodega(Nombre, Ubicacion) VALUES(@Nombre, @Ubicacion);
    SELECT CAST(SCOPE_IDENTITY() AS int) AS IdBodega;
END
IF @function = 2 -- update
BEGIN
    UPDATE Bodega SET
        Nombre = ISNULL(@Nombre, Nombre),
        Ubicacion = ISNULL(@Ubicacion, Ubicacion)
    WHERE IdBodega = @IdBodega;
    IF @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Error, la modificacion no encontro el dato', 16, 1);
        RETURN -1;
    END
END
IF @function = 3 -- borrar
BEGIN
    DELETE FROM Bodega WHERE IdBodega = @IdBodega;
    IF @@ERROR <> 0 OR @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Error, el borrado no encontro dato o fallo', 16, 1);
        RETURN -1;
    END
END
GO

ALTER PROCEDURE dbo.MantenimientoProveedor
(@function int, @IdProveedor int = null, @Nombre nvarchar(100) = null, @Telefono varchar(15) = null,
 @Correo varchar(100) = null, @DiasEntrega int = null)
AS
SET NOCOUNT ON;
IF @function = 1 -- insert
BEGIN
    INSERT INTO Proveedor(Nombre, Telefono, Correo, DiasEntrega)
    VALUES(@Nombre, @Telefono, @Correo, @DiasEntrega);
    SELECT CAST(SCOPE_IDENTITY() AS int) AS IdProveedor;
END
IF @function = 2 -- update
BEGIN
    UPDATE Proveedor SET
        Nombre = ISNULL(@Nombre, Nombre),
        Telefono = ISNULL(@Telefono, Telefono),
        Correo = ISNULL(@Correo, Correo),
        DiasEntrega = ISNULL(@DiasEntrega, DiasEntrega)
    WHERE IdProveedor = @IdProveedor;
    IF @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Error, la modificacion no encontro el dato', 16, 1);
        RETURN -1;
    END
END
IF @function = 3 -- borrar
BEGIN
    DELETE FROM Proveedor WHERE IdProveedor = @IdProveedor;
    IF @@ERROR <> 0 OR @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Error, el borrado no encontro dato o fallo', 16, 1);
        RETURN -1;
    END
END
GO

ALTER PROCEDURE dbo.MantenimientoInventario
(@function int, @IdInventario int = null, @IdBodega int = null, @IdRepuesto int = null, @Cantidad int = null)
AS
SET NOCOUNT ON;
IF @function = 1 -- insert
BEGIN
    INSERT INTO Inventario(IdBodega, IdRepuesto, Cantidad) VALUES(@IdBodega, @IdRepuesto, @Cantidad);
    SELECT CAST(SCOPE_IDENTITY() AS int) AS IdInventario;
END
IF @function = 2 -- update
BEGIN
    UPDATE Inventario SET
        IdBodega = ISNULL(@IdBodega, IdBodega),
        IdRepuesto = ISNULL(@IdRepuesto, IdRepuesto),
        Cantidad = ISNULL(@Cantidad, Cantidad)
    WHERE IdInventario = @IdInventario;
    IF @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Error, la modificacion no encontro el dato', 16, 1);
        RETURN -1;
    END
END
IF @function = 3 -- borrar
BEGIN
    DELETE FROM Inventario WHERE IdInventario = @IdInventario;
    IF @@ERROR <> 0 OR @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Error, el borrado no encontro dato o fallo', 16, 1);
        RETURN -1;
    END
END
GO

ALTER PROCEDURE dbo.MantenimientoCompra
(@function int, @IdCompra int = null, @IdProveedor int = null, @IdBodega int = null, @Fecha date = null,
 @FechaRecepcion date = null, @Total decimal(12,2) = null)
AS
SET NOCOUNT ON;
IF @function = 1 -- insert
BEGIN
    INSERT INTO Compra(IdProveedor, IdBodega, Fecha, FechaRecepcion, Total)
    VALUES(@IdProveedor, @IdBodega, ISNULL(@Fecha, CAST(GETDATE() AS date)), @FechaRecepcion, ISNULL(@Total, 0));
    SELECT CAST(SCOPE_IDENTITY() AS int) AS IdCompra;
END
IF @function = 2 -- update
BEGIN
    UPDATE Compra SET
        IdProveedor = ISNULL(@IdProveedor, IdProveedor),
        IdBodega = ISNULL(@IdBodega, IdBodega),
        Fecha = ISNULL(@Fecha, Fecha),
        FechaRecepcion = ISNULL(@FechaRecepcion, FechaRecepcion),
        Total = ISNULL(@Total, Total)
    WHERE IdCompra = @IdCompra;
    IF @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Error, la modificacion no encontro el dato', 16, 1);
        RETURN -1;
    END
END
IF @function = 3 -- borrar
BEGIN
    DELETE FROM Compra WHERE IdCompra = @IdCompra;
    IF @@ERROR <> 0 OR @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Error, el borrado no encontro dato o fallo', 16, 1);
        RETURN -1;
    END
END
GO

ALTER PROCEDURE dbo.MantenimientoDetalleCompra
(@function int, @IdDetalle int = null, @IdCompra int = null, @IdRepuesto int = null, @Cantidad int = null,
 @Costo decimal(10,2) = null)
AS
SET NOCOUNT ON;
IF @function = 1 -- insert
BEGIN
    INSERT INTO DetalleCompra(IdCompra, IdRepuesto, Cantidad, Costo)
    VALUES(@IdCompra, @IdRepuesto, @Cantidad, @Costo);
    SELECT CAST(SCOPE_IDENTITY() AS int) AS IdDetalle;
END
IF @function = 2 -- update
BEGIN
    UPDATE DetalleCompra SET
        IdCompra = ISNULL(@IdCompra, IdCompra),
        IdRepuesto = ISNULL(@IdRepuesto, IdRepuesto),
        Cantidad = ISNULL(@Cantidad, Cantidad),
        Costo = ISNULL(@Costo, Costo)
    WHERE IdDetalle = @IdDetalle;
    IF @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Error, la modificacion no encontro el dato', 16, 1);
        RETURN -1;
    END
END
IF @function = 3 -- borrar
BEGIN
    DELETE FROM DetalleCompra WHERE IdDetalle = @IdDetalle;
    IF @@ERROR <> 0 OR @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Error, el borrado no encontro dato o fallo', 16, 1);
        RETURN -1;
    END
END
GO

ALTER PROCEDURE dbo.MantenimientoIncidencia
(@function int, @IdIncidencia int = null, @IdRepuesto int = null, @IdProveedor int = null,
 @IdCompra int = null, @Tipo varchar(20) = null, @Cantidad int = null, @Fecha datetime = null)
AS
SET NOCOUNT ON;
IF @function = 1 -- insert
BEGIN
    INSERT INTO Incidencia(IdRepuesto, IdProveedor, IdCompra, Tipo, Cantidad, Fecha)
    VALUES(@IdRepuesto, @IdProveedor, @IdCompra, @Tipo, @Cantidad, ISNULL(@Fecha, GETDATE()));
    SELECT CAST(SCOPE_IDENTITY() AS int) AS IdIncidencia;
END
IF @function = 2 -- update
BEGIN
    UPDATE Incidencia SET
        IdRepuesto = ISNULL(@IdRepuesto, IdRepuesto),
        IdProveedor = ISNULL(@IdProveedor, IdProveedor),
        IdCompra = ISNULL(@IdCompra, IdCompra),
        Tipo = ISNULL(@Tipo, Tipo),
        Cantidad = ISNULL(@Cantidad, Cantidad),
        Fecha = ISNULL(@Fecha, Fecha)
    WHERE IdIncidencia = @IdIncidencia;
    IF @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Error, la modificacion no encontro el dato', 16, 1);
        RETURN -1;
    END
END
IF @function = 3 -- borrar
BEGIN
    DELETE FROM Incidencia WHERE IdIncidencia = @IdIncidencia;
    IF @@ERROR <> 0 OR @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Error, el borrado no encontro dato o fallo', 16, 1);
        RETURN -1;
    END
END
GO

ALTER PROCEDURE dbo.MantenimientoMovimiento
(@function int, @IdMovimiento int = null, @IdRepuesto int = null, @IdBodegaOrigen int = null,
 @IdBodegaDestino int = null, @IdEmpleado int = null, @Tipo varchar(15) = null, @Cantidad int = null,
 @Fecha datetime = null)
AS
SET NOCOUNT ON;
IF @function = 1 -- insert
BEGIN
    INSERT INTO Movimiento(IdRepuesto, IdBodegaOrigen, IdBodegaDestino, IdEmpleado, Tipo, Cantidad, Fecha)
    VALUES(@IdRepuesto, @IdBodegaOrigen, @IdBodegaDestino, @IdEmpleado, @Tipo, @Cantidad, ISNULL(@Fecha, GETDATE()));
    SELECT CAST(SCOPE_IDENTITY() AS int) AS IdMovimiento;
END
IF @function = 2 -- update
BEGIN
    UPDATE Movimiento SET
        IdRepuesto = ISNULL(@IdRepuesto, IdRepuesto),
        IdBodegaOrigen = ISNULL(@IdBodegaOrigen, IdBodegaOrigen),
        IdBodegaDestino = ISNULL(@IdBodegaDestino, IdBodegaDestino),
        IdEmpleado = ISNULL(@IdEmpleado, IdEmpleado),
        Tipo = ISNULL(@Tipo, Tipo),
        Cantidad = ISNULL(@Cantidad, Cantidad),
        Fecha = ISNULL(@Fecha, Fecha)
    WHERE IdMovimiento = @IdMovimiento;
    IF @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Error, la modificacion no encontro el dato', 16, 1);
        RETURN -1;
    END
END
IF @function = 3 -- borrar
BEGIN
    DELETE FROM Movimiento WHERE IdMovimiento = @IdMovimiento;
    IF @@ERROR <> 0 OR @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Error, el borrado no encontro dato o fallo', 16, 1);
        RETURN -1;
    END
END
GO

--parte2

-- Se agregan IdMarca, AnioInicio y AnioFin; se conservan Id y Nombre

ALTER PROCEDURE dbo.ConsultarModelos @IdMarca INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdModelo AS Id, Nombre, IdMarca, AnioInicio, AnioFin
    FROM dbo.Modelo
    WHERE @IdMarca IS NULL OR IdMarca = @IdMarca
    ORDER BY Nombre;
END;
GO

-- Lista interna de repuestos (incluye Costo -- solo para empleados).
CREATE OR ALTER PROCEDURE dbo.ConsultarRepuestos @IdRepuesto INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdRepuesto, IdCategoria, Codigo, Nombre, PrecioVenta, Costo, Activo
    FROM dbo.Repuesto
    WHERE @IdRepuesto IS NULL OR IdRepuesto = @IdRepuesto
    ORDER BY Nombre;
END;
GO

CREATE OR ALTER PROCEDURE dbo.ConsultarRepuestoModelo @IdRepuesto INT = NULL, @IdModelo INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdRepuesto, IdModelo
    FROM dbo.RepuestoModelo
    WHERE (@IdRepuesto IS NULL OR IdRepuesto = @IdRepuesto)
      AND (@IdModelo IS NULL OR IdModelo = @IdModelo)
    ORDER BY IdRepuesto, IdModelo;
END;
GO

CREATE OR ALTER PROCEDURE dbo.ConsultarBodegas @IdBodega INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdBodega, Nombre, Ubicacion
    FROM dbo.Bodega
    WHERE @IdBodega IS NULL OR IdBodega = @IdBodega
    ORDER BY Nombre;
END;
GO

CREATE OR ALTER PROCEDURE dbo.ConsultarProveedores @IdProveedor INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdProveedor, Nombre, Telefono, Correo, DiasEntrega
    FROM dbo.Proveedor
    WHERE @IdProveedor IS NULL OR IdProveedor = @IdProveedor
    ORDER BY Nombre;
END;
GO

CREATE OR ALTER PROCEDURE dbo.ConsultarInventario @IdInventario INT = NULL, @IdBodega INT = NULL, @IdRepuesto INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdInventario, IdBodega, IdRepuesto, Cantidad
    FROM dbo.Inventario
    WHERE (@IdInventario IS NULL OR IdInventario = @IdInventario)
      AND (@IdBodega IS NULL OR IdBodega = @IdBodega)
      AND (@IdRepuesto IS NULL OR IdRepuesto = @IdRepuesto)
    ORDER BY IdBodega, IdRepuesto;
END;
GO

CREATE OR ALTER PROCEDURE dbo.ConsultarCompras @IdCompra INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdCompra, IdProveedor, IdBodega, Fecha, FechaRecepcion, Total
    FROM dbo.Compra
    WHERE @IdCompra IS NULL OR IdCompra = @IdCompra
    ORDER BY Fecha DESC, IdCompra DESC;
END;
GO

CREATE OR ALTER PROCEDURE dbo.ConsultarDetalleCompra @IdDetalle INT = NULL, @IdCompra INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdDetalle, IdCompra, IdRepuesto, Cantidad, Costo
    FROM dbo.DetalleCompra
    WHERE (@IdDetalle IS NULL OR IdDetalle = @IdDetalle)
      AND (@IdCompra IS NULL OR IdCompra = @IdCompra)
    ORDER BY IdCompra, IdDetalle;
END;
GO

CREATE OR ALTER PROCEDURE dbo.ConsultarIncidencias @IdIncidencia INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdIncidencia, IdRepuesto, IdProveedor, IdCompra, Tipo, Cantidad, Fecha
    FROM dbo.Incidencia
    WHERE @IdIncidencia IS NULL OR IdIncidencia = @IdIncidencia
    ORDER BY Fecha DESC, IdIncidencia DESC;
END;
GO

CREATE OR ALTER PROCEDURE dbo.ConsultarMovimientos @IdMovimiento INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdMovimiento, IdRepuesto, IdBodegaOrigen, IdBodegaDestino, IdEmpleado, Tipo, Cantidad, Fecha
    FROM dbo.Movimiento
    WHERE @IdMovimiento IS NULL OR IdMovimiento = @IdMovimiento
    ORDER BY Fecha DESC, IdMovimiento DESC;
END;
GO

