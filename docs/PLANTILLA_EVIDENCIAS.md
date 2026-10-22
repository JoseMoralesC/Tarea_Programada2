# Plantilla para el documento de evidencias

Esta es una guía de redacción. El PDF del curso exige entregar el documento final en **Word o PDF**, con capturas reales. Esta plantilla no es evidencia de una carga ejecutada y no reemplaza el archivo final.

Base oficial actualizada el 22/10/2026. Los datos preexistentes y las verificaciones de dependencias no sustituyen las capturas de carga. El usuario/equipo debe generar evidencias reales al importar, sin exponer secretos.

## Portada

- Institución: [completar].
- Curso: TI-156 Bases de datos avanzadas, III Cuatrimestre 2026.
- Proyecto: Proyecto 2 — carga masiva y backend GraphQL.
- Integrantes: persona 1 [nombre] y persona 2 [nombre].
- Docente y grupo: [completar].
- Fecha: [completar].
- Base de datos: `RepuestosAutomotrices`.

## Índice por tabla

Crear una entrada con el nombre real de cada tabla del [inventario](info_bd/INVENTARIO.md), vinculada a su apartado y página. Los nombres de herramientas no sustituyen los nombres de tablas en el índice. Actualizar numeración después de insertar todas las imágenes.

## Apartado que debe repetirse para cada tabla

### [esquema].[nombre_tabla]

| Dato | Valor real |
| --- | --- |
| Responsable y revisor | [completar] |
| Fecha/hora de ejecución | [completar con zona] |
| Herramienta utilizada | [SSMS Import and Export Wizard / bcp] |
| Archivo original y ruta | [completar] |
| Hoja Excel, si aplica | [completar o no aplica] |
| Formato, delimitador y codificación | [completar] |
| Destino | RepuestosAutomotrices.[esquema].[tabla] |
| Filas esperadas a insertar | [completar] |
| Conteo previo | [completar] |
| Filas importadas reportadas | [completar] |
| Conteo posterior | [completar] |
| Resultado final | [exitoso / fallido; describir] |

### Si se utilizó SSMS

1. Insertar captura legible del origen con archivo/ruta y hoja si aplica.
2. Insertar captura del destino y mapeo que permita identificar base y tabla.
3. Insertar captura del resumen final de operaciones con resultado exitoso.
4. Insertar captura de consulta que demuestre datos finales cargados en la tabla correcta.

### Si se utilizó bcp

1. Incluir instrucción real y parámetros utilizados, sin contraseñas ni secretos visibles. No inventar comandos antes de conocer el formato y el esquema.
2. Insertar captura de ejecución que muestre el resultado exitoso y las filas copiadas.
3. Insertar captura de la consulta sobre la tabla destino con los datos finales.

### Validación de la carga

Describir cómo se compararon conteos y filas esperadas, y cómo se comprobó PK, FK, NULL, tipos y caracteres relevantes. Identificar también la consulta de validación ejecutada. Si los datos ya existían, distinguir lo que se insertó en esta ejecución.

Si hubo un error, documentar qué pasó, la corrección y la evidencia de la repetición exitosa. Un intento fallido sin solución no acredita el requisito de carga final correcta.

### Referencias a archivos

- Archivo original incluido en el paquete: [ruta real].
- Capturas originales: [rutas reales].
- Operaciones GraphQL/SP de esta tabla: [referencia a inventario o código].
- Aprobación del compañero revisor: [nombre y fecha].

## Revisión final del documento

- [ ] Portada completa e índice por nombre de tabla.
- [ ] Todas las tablas reales tienen apartado.
- [ ] SSMS y bcp aparecen con al menos una ejecución exitosa cada uno.
- [ ] Se identifica tabla, herramienta, archivo y hoja cuando corresponda.
- [ ] Capturas legibles, con contexto, destino y resultados reales.
- [ ] No aparecen contraseñas, tokens ni información sensible innecesaria.
- [ ] Word/PDF exportado y abierto para verificar que las imágenes no queden cortadas.
- [ ] Documento final cotejado por ambos compañeros con el inventario y el paquete entregable.
