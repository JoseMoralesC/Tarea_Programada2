-- Solo lectura. Ejecutar en SSMS con una cuenta de mantenimiento.
-- Elegir UNA FILA y copiar sus tres IDs a las variables de la coleccion demo.
-- No mezclar IDs de filas diferentes. Revisar stock antes y despues de la demo.
USE [RepuestosAutomotrices];
GO
SET NOCOUNT ON;
SELECT TOP (20)
    rm.IdModelo AS idModeloReferencia,
    r.IdRepuesto AS idRepuestoReferencia,
    i.IdBodega AS idBodegaReferencia,
    r.Nombre AS Repuesto,
    b.Nombre AS Bodega,
    i.Cantidad AS StockAntesDeDemo
FROM dbo.Inventario AS i
JOIN dbo.Repuesto AS r ON r.IdRepuesto = i.IdRepuesto
JOIN dbo.RepuestoModelo AS rm ON rm.IdRepuesto = r.IdRepuesto
JOIN dbo.Bodega AS b ON b.IdBodega = i.IdBodega
WHERE r.Activo = 1 AND i.Cantidad >= 2
ORDER BY i.Cantidad DESC, r.IdRepuesto, i.IdBodega, rm.IdModelo;
