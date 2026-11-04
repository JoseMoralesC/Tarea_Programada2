-- Acordamos distinguir un campo omitido de uno que queremos dejar vacío.
-- Estos cambios conservan el comportamiento de los clientes anteriores.
SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE [dbo].[MantenimientoModelo]
(@function int, @IdModelo int = null, @IdMarca int = null, @Nombre nvarchar(60) = null,
 @AnioInicio int = null, @AnioFin int = null, @CambiarAnioFin bit = 0)
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
        AnioFin = CASE WHEN @CambiarAnioFin = 1 THEN @AnioFin ELSE ISNULL(@AnioFin, AnioFin) END
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
CREATE OR ALTER PROCEDURE [dbo].[MantenimientoProveedor]
(@function int, @IdProveedor int = null, @Nombre nvarchar(100) = null, @Telefono varchar(15) = null,
 @Correo varchar(100) = null, @DiasEntrega int = null, @CambiarTelefono bit = 0, @CambiarCorreo bit = 0)
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
        Telefono = CASE WHEN @CambiarTelefono = 1 THEN @Telefono ELSE ISNULL(@Telefono, Telefono) END,
        Correo = CASE WHEN @CambiarCorreo = 1 THEN @Correo ELSE ISNULL(@Correo, Correo) END,
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
CREATE OR ALTER PROCEDURE [dbo].[MantenimientoCompra]
(@function int, @IdCompra int = null, @IdProveedor int = null, @IdBodega int = null, @Fecha date = null,
 @FechaRecepcion date = null, @Total decimal(12,2) = null, @CambiarFechaRecepcion bit = 0)
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
        FechaRecepcion = CASE WHEN @CambiarFechaRecepcion = 1 THEN @FechaRecepcion ELSE ISNULL(@FechaRecepcion, FechaRecepcion) END,
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
CREATE OR ALTER PROCEDURE [dbo].[MantenimientoIncidencia]
(@function int, @IdIncidencia int = null, @IdRepuesto int = null, @IdProveedor int = null,
 @IdCompra int = null, @Tipo varchar(20) = null, @Cantidad int = null, @Fecha datetime = null, @CambiarIdCompra bit = 0)
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
        IdCompra = CASE WHEN @CambiarIdCompra = 1 THEN @IdCompra ELSE ISNULL(@IdCompra, IdCompra) END,
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
CREATE OR ALTER PROCEDURE [dbo].[MantenimientoMovimiento]
(@function int, @IdMovimiento int = null, @IdRepuesto int = null, @IdBodegaOrigen int = null,
 @IdBodegaDestino int = null, @IdEmpleado int = null, @Tipo varchar(15) = null, @Cantidad int = null,
 @Fecha datetime = null, @CambiarIdBodegaOrigen bit = 0, @CambiarIdBodegaDestino bit = 0)
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
        IdBodegaOrigen = CASE WHEN @CambiarIdBodegaOrigen = 1 THEN @IdBodegaOrigen ELSE ISNULL(@IdBodegaOrigen, IdBodegaOrigen) END,
        IdBodegaDestino = CASE WHEN @CambiarIdBodegaDestino = 1 THEN @IdBodegaDestino ELSE ISNULL(@IdBodegaDestino, IdBodegaDestino) END,
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
