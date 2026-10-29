-- Validaciones de solo lectura. No devuelve hashes ni consume secuencias.
SET NOCOUNT ON;
IF OBJECT_ID(N'dbo.SecuenciaCodigoRepuesto', N'SO') IS NULL
    THROW 51010, 'Falta dbo.SecuenciaCodigoRepuesto.', 1;
IF OBJECT_ID(N'dbo.VerificarClave', N'FS') IS NULL
    THROW 51011, 'Falta dbo.VerificarClave como funcion CLR.', 1;
IF OBJECT_ID(N'dbo.LoginUsuario', N'P') IS NULL
    THROW 51012, 'Falta dbo.LoginUsuario.', 1;
IF OBJECT_ID(N'dbo.GuardarRepuestoApp', N'P') IS NULL
    THROW 51013, 'Falta dbo.GuardarRepuestoApp.', 1;

IF EXISTS (
    SELECT 1 FROM sys.sql_expression_dependencies
    WHERE referenced_id IS NULL AND referenced_entity_name IS NOT NULL
      AND referenced_server_name IS NULL AND referenced_database_name IS NULL
      AND referenced_entity_name NOT IN ('inserted', 'deleted')
      AND is_caller_dependent = 0
)
    THROW 51014, 'Hay referencias locales sin resolver; revisar el diagnostico.', 1;

-- Prueba de activación y ejecución real del verificador con un hash ya existente.
-- No autentica usuarios, no cambia contraseñas y no devuelve datos de credenciales.
DECLARE @Hash varchar(255), @Resultado bit;
SELECT TOP (1) @Hash = Contrasena FROM dbo.Usuario ORDER BY IdUsuario;
IF @Hash IS NULL THROW 51015, 'No hay hash existente para verificar la activacion CLR sin cargar datos.', 1;
SET @Resultado = dbo.VerificarClave(N'__PruebaTecnica_NoEsCredencialDeUsuario__', @Hash);
IF @Resultado IS NULL THROW 51016, 'El verificador CLR devolvio NULL.', 1;
SELECT N'Correcto: dependencias presentes y verificador CLR ejecutado' AS Verificacion;

SELECT COUNT(*) AS Tablas FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo');
SELECT COUNT(*) AS Procedimientos FROM sys.procedures WHERE schema_id = SCHEMA_ID('dbo');
SELECT COUNT(*) AS Triggers FROM sys.triggers WHERE parent_class = 1 AND is_ms_shipped = 0;
SELECT t.name AS Tabla, SUM(p.rows) AS FilasActuales
FROM sys.tables t JOIN sys.partitions p ON p.object_id = t.object_id AND p.index_id IN (0,1)
WHERE SCHEMA_NAME(t.schema_id) = 'dbo'
GROUP BY t.name ORDER BY t.name;