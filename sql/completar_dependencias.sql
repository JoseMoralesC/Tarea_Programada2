-- Único cambio: crear dbo.SecuenciaCodigoRepuesto cuando no exista.
-- No crea/reemplaza bases, tablas, usuarios, permisos, funciones ni ensamblados.
-- No realiza cargas ni cambios de datos; no consume valores de la secuencia.
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF ISNULL(HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'VIEW DEFINITION'), 0) <> 1
    THROW 51000, 'Se requiere VIEW DEFINITION para comprobar las dependencias completas.', 1;

IF EXISTS (
    SELECT 1 FROM (VALUES
        ('Aseguradora'), ('Auditoria'), ('Bodega'), ('Caso'), ('Categoria'), ('Compra'),
        ('Cotizacion'), ('DetalleCompra'), ('DetalleCotizacion'), ('DetalleVenta'),
        ('Empleado'), ('Envio'), ('Incidencia'), ('Inventario'), ('Marca'), ('Modelo'),
        ('Movimiento'), ('Proveedor'), ('Repuesto'), ('RepuestoModelo'), ('Rol'),
        ('Usuario'), ('Venta')
    ) AS esperadas(Nombre)
    WHERE OBJECT_ID(N'dbo.' + esperadas.Nombre, N'U') IS NULL
)
    THROW 51001, 'La base destino no contiene las 23 tablas del modelo analizado. No se ha modificado.', 1;

IF COL_LENGTH('dbo.Repuesto', 'Codigo') IS NULL
    THROW 51002, 'Falta dbo.Repuesto.Codigo. No se ha modificado la base.', 1;

IF OBJECT_ID(N'dbo.GuardarRepuestoApp', N'P') IS NULL
    THROW 51003, 'Falta GuardarRepuestoApp: revisar el diagnostico antes de completar esta dependencia.', 1;

IF NOT EXISTS (
    SELECT 1 FROM sys.sql_modules WHERE object_id = OBJECT_ID(N'dbo.GuardarRepuestoApp')
    AND definition LIKE N'%SecuenciaCodigoRepuesto%'
)
    THROW 51004, 'El procedimiento destino difiere del analizado. Revisar antes de modificar objetos.', 1;

BEGIN TRY
    BEGIN TRANSACTION;
    DECLARE @Bloqueo int;
    EXEC @Bloqueo = sys.sp_getapplock
        @Resource = N'TareaProgramada2_CompletarSecuencia',
        @LockMode = N'Exclusive', @LockOwner = N'Transaction', @LockTimeout = 10000;
    IF @Bloqueo < 0 THROW 51005, 'No se pudo obtener el bloqueo de mantenimiento.', 1;

    IF OBJECT_ID(N'dbo.SecuenciaCodigoRepuesto') IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM sys.sequences
                       WHERE object_id = OBJECT_ID(N'dbo.SecuenciaCodigoRepuesto'))
        THROW 51006, 'El nombre SecuenciaCodigoRepuesto corresponde a otro tipo de objeto.', 1;

    IF EXISTS (SELECT 1 FROM sys.sequences
               WHERE object_id = OBJECT_ID(N'dbo.SecuenciaCodigoRepuesto'))
    BEGIN
        IF EXISTS (SELECT 1 FROM sys.sequences
                   WHERE object_id = OBJECT_ID(N'dbo.SecuenciaCodigoRepuesto')
                     AND (CONVERT(bigint, increment) <> 1 OR is_cycling = 1))
            THROW 51007, 'La secuencia existente tiene configuracion distinta: revisar sin reiniciarla.', 1;
        PRINT N'La secuencia ya existe; se conserva sin reiniciar ni consumir valores.';
    END
    ELSE
    BEGIN
        DECLARE @Maximo bigint;
        -- Se consideran solamente códigos REP- seguidos por dígitos ASCII.
        SELECT @Maximo = MAX(TRY_CONVERT(bigint, SUBSTRING(Codigo, 5, 30)))
        FROM dbo.Repuesto
        WHERE LEFT(Codigo, 4) = 'REP-' AND LEN(Codigo) > 4
          AND SUBSTRING(Codigo, 5, 30) COLLATE Latin1_General_100_BIN2 NOT LIKE '%[^0-9]%';

        IF @Maximo = 9223372036854775807
            THROW 51008, 'No queda rango BIGINT para la secuencia; revisar codificacion.', 1;
        DECLARE @Inicio bigint = COALESCE(@Maximo + CONVERT(bigint, 1), CONVERT(bigint, 1));
        DECLARE @SQL nvarchar(max) = N'CREATE SEQUENCE dbo.SecuenciaCodigoRepuesto AS bigint START WITH '
            + CONVERT(nvarchar(30), @Inicio) + N' INCREMENT BY 1 MINVALUE 1 NO CYCLE NO CACHE;';
        EXEC sys.sp_executesql @SQL;
        PRINT N'Secuencia creada; no se insertaron, actualizaron ni borraron filas.';
    END;
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

SELECT DB_NAME() AS BaseActual, SCHEMA_NAME(schema_id) AS Esquema, name AS Secuencia,
       CONVERT(nvarchar(50), start_value) AS Inicio,
       CONVERT(nvarchar(50), current_value) AS ValorActual,
       CONVERT(nvarchar(50), increment) AS Incremento
FROM sys.sequences WHERE object_id = OBJECT_ID(N'dbo.SecuenciaCodigoRepuesto');
