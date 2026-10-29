USE RepuestosAutomotrices;
GO

-- tablas y columnas 
SELECT TABLE_NAME AS Tabla,
       COLUMN_NAME AS Columna,
       DATA_TYPE   AS Tipo,
       IS_NULLABLE AS PermiteNull
FROM INFORMATION_SCHEMA.COLUMNS
ORDER BY TABLE_NAME, ORDINAL_POSITION;

-- dependencias 
SELECT OBJECT_NAME(parent_object_id)     AS TablaHija,
       OBJECT_NAME(referenced_object_id) AS TablaPadre
FROM sys.foreign_keys
ORDER BY TablaHija;

-- procedimientos almacenados 
SELECT name AS SP
FROM sys.procedures
ORDER BY name;

-- triggers
SELECT name                AS TriggerName,
       OBJECT_NAME(parent_id) AS Tabla
FROM sys.triggers
ORDER BY Tabla;