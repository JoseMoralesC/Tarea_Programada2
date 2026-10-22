-- Solo metadatos y conteos: no modifica objetos ni registros.
SET NOCOUNT ON;

SELECT DB_NAME() AS BaseActual,
       CONVERT(nvarchar(128), SERVERPROPERTY('ProductVersion')) AS VersionSQL,
       HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'VIEW DEFINITION') AS PuedeVerDefiniciones,
       HAS_PERMS_BY_NAME(N'dbo', 'SCHEMA', 'CREATE SEQUENCE') AS PuedeCrearSecuencia;

SELECT t.name AS Tabla, SUM(p.rows) AS FilasActuales
FROM sys.tables t JOIN sys.partitions p ON p.object_id = t.object_id AND p.index_id IN (0,1)
WHERE SCHEMA_NAME(t.schema_id) = 'dbo'
GROUP BY t.name ORDER BY t.name;

SELECT SCHEMA_NAME(schema_id) AS Esquema, name AS Secuencia,
       CONVERT(nvarchar(50), start_value) AS Inicio,
       CONVERT(nvarchar(50), current_value) AS ValorActual,
       CONVERT(nvarchar(50), increment) AS Incremento, is_cycling AS Ciclica
FROM sys.sequences;

SELECT OBJECT_SCHEMA_NAME(d.referencing_id) AS EsquemaOrigen,
       OBJECT_NAME(d.referencing_id) AS ObjetoOrigen,
       d.referenced_database_name AS BaseReferida,
       d.referenced_schema_name AS EsquemaReferido,
       d.referenced_entity_name AS ObjetoReferido
FROM sys.sql_expression_dependencies d
WHERE d.referenced_id IS NULL AND d.referenced_entity_name IS NOT NULL
  AND d.referenced_server_name IS NULL
  AND d.referenced_entity_name NOT IN ('inserted', 'deleted')
ORDER BY ObjetoOrigen, ObjetoReferido;

SELECT name AS Ensamblado, permission_set_desc AS Permisos
FROM sys.assemblies WHERE is_user_defined = 1;
SELECT name AS Opcion, value_in_use AS Valor FROM sys.configurations
WHERE name IN ('clr enabled', 'clr strict security');

SELECT OBJECT_SCHEMA_NAME(am.object_id) AS Esquema,
       OBJECT_NAME(am.object_id) AS Funcion, a.name AS Ensamblado,
       am.assembly_class AS Clase, am.assembly_method AS Metodo
FROM sys.assembly_modules am JOIN sys.assemblies a ON a.assembly_id = am.assembly_id;

SELECT name AS Procedimiento FROM sys.procedures
WHERE schema_id = SCHEMA_ID('dbo') ORDER BY name;

SELECT p.name AS UsuarioBD, p.type_desc AS Tipo, r.name AS RolSQL
FROM sys.database_principals p
LEFT JOIN sys.database_role_members rm ON rm.member_principal_id = p.principal_id
LEFT JOIN sys.database_principals r ON r.principal_id = rm.role_principal_id
WHERE p.principal_id > 4 AND p.type IN ('S','U','G') ORDER BY p.name, r.name;

SELECT USER_NAME(grantee_principal_id) AS Destinatario, state_desc AS Estado,
       permission_name AS Permiso, class_desc AS Clase,
       CASE WHEN class = 1 THEN OBJECT_SCHEMA_NAME(major_id) + '.' + OBJECT_NAME(major_id)
            WHEN class = 3 THEN SCHEMA_NAME(major_id) ELSE DB_NAME() END AS Objeto
FROM sys.database_permissions
WHERE class <> 1 OR OBJECTPROPERTY(major_id, 'IsMSShipped') = 0
ORDER BY Destinatario, Clase, Objeto, Permiso;
