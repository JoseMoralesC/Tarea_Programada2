# Tarea Programada 2 — Bases de datos avanzadas

Backend GraphQL de repuestos automotrices para TI-156, III Cuatrimestre de 2026. Usa Node.js, Apollo Server y mssql para ejecutar procedimientos almacenados en SQL Server sobre RepuestosAutomotrices.

## Instalación y ejecución

Requiere Node.js 22 o posterior y acceso al servidor SQL por la red acordada con el equipo.

```powershell
npm ci
# Solo si todavía no existe .env:
Copy-Item -LiteralPath .env.example -Destination .env -ErrorAction Stop -NoClobber
# Completar las variables locales antes de iniciar:
npm start
```

La API se sirve en http://localhost:4000/ por defecto. `npm run dev` activa la recarga al editar código; `npm test` ejecuta las pruebas locales sin SQL Server.

Completar en .env el servidor, puerto, base y credenciales SQL distintas para cliente y empleado. DB_SETUP es solo mantenimiento. Las contraseñas que contienen # deben ir entre comillas. .env, node_modules y archivos temporales están excluidos de Git; .env.example se comparte sin credenciales. La API abre las conexiones cuando las necesita: el arranque HTTP no acredita acceso a SQL.

## Estado del proyecto — 29/10/2026

- Modelo identificado: 23 tablas; cobertura prevista de al menos 92 operaciones CRUD, más autenticación.
- Persona 1, lote A: Categoría y Marca implementadas (8 operaciones); faltan diez módulos.
- Persona 2, lote B: los once módulos están implementados (44 operaciones), con login, sesiones, conexiones por rol y autorización.
- Total declarado y verificado con SQL simulado: 52/92 operaciones; 39 pruebas automatizadas aprobadas.
- El usuario aplicó SQL 03/04. Se comprobaron sus 22 definiciones/parámetros y once consultas de solo lectura, sin exponer columnas de credenciales.
- El generador de contraseñas se comprobó contra el CLR real con una clave ficticia correcta y otra incorrecta.

La implementación y las pruebas locales no acreditan todavía los ciclos CRUD reales, aislamiento entre clientes, inventario, totales o concurrencia.

## Documentación y herramientas

| Archivo | Uso |
| --- | --- |
| [Guía API](docs/API.md) | Configuración, login, permisos, operaciones y pruebas. |
| [Estado frente al requerimiento](docs/ESTADO_PROYECTO.md) | Evidencia y pendientes de ambas personas frente al PDF y al roadmap. |
| [Roadmap](docs/roadmap/ROADMAP.md) | Plan de fases, responsables y puntos; sus estados iniciales son históricos. |
| [Inventario](docs/info_bd/INVENTARIO.md) | Tablas, columnas, relaciones, triggers y reparto por lote. |
| [Colección Postman](docs/pruebas/lote_B.postman_collection.json) | 44 operaciones B, login/logout y comprobaciones de ausencia; sin credenciales reales. |
| [Enunciado original](docs/requeriemientos/Tarea%20programada%202.pdf) | Requisitos académicos. |
| [Plantilla de evidencias](docs/PLANTILLA_EVIDENCIAS.md) | Preparación del documento Word/PDF de carga. |

Los módulos viven en src/modules, la autenticación en src/auth y la composición del esquema en src/server.js. Los tests están en test/.

## Scripts SQL

Conservar los scripts aunque estén aplicados para que el equipo pueda reproducir los ajustes. Requieren la estructura heredada del proyecto 1; no son una creación completa de la base.

| Archivo | Función / estado |
| --- | --- |
| [Ajustes lote A](scripts/Nuevos_Y_Modificacion_SP.sql) | Consultas y mantenimientos de persona 1; aplicación reportada por el compañero, pendiente de revisión integral. |
| [03: usuarios y perfiles](sql/ajustes/03_lote_B_usuarios_procedimientos.sql) | Aplicado y contrastado con el servidor. |
| [04: negocio y auditoría](sql/ajustes/04_lote_B_negocio_procedimientos.sql) | Aplicado y contrastado con el servidor. |
| [Completar dependencias](sql/completar_dependencias.sql) | Crea la secuencia de códigos únicamente si falta; en el servidor verificado ya existía. |
| [Diagnóstico](sql/diagnostico_dependencias.sql) | Lectura de metadatos, conteos y permisos. |
| [Validación](sql/validar_dependencias.sql) | Comprueba dependencias y ejecuta el verificador CLR sin modificar datos. |
| [Inventario SQL](docs/info_bd/script_InventarioBD.sql) | Consulta columnas, FK, procedimientos y triggers. |

Las herramientas de dependencias usan sqlcmd instalado y las credenciales DB_SETUP locales:

```powershell
node --env-file=.env scripts/dependencias-db.mjs diagnostico
node --env-file=.env scripts/dependencias-db.mjs validar
npm run verify:hash
```

verify:hash comprueba el generador con una clave ficticia mediante el CLR, sin consultar hashes almacenados ni modificar registros. Ninguna de estas herramientas realiza cargas masivas.

## Pendientes

1. Completar/verificar las credenciales de empleado y restringir permisos SQL por rol. En la última comprobación la cuenta cliente tenía db_owner y las credenciales de empleado estaban incompletas.
2. Ejecutar ciclos CRUD reales en una base de pruebas: entradas inválidas, FK, dos clientes, stock, totales, rollback y concurrencia. Repetir desde ambos equipos.
3. Completar los diez módulos A: Modelo, Repuesto, RepuestoModelo, Bodega, Proveedor, Inventario, Compra, DetalleCompra, Incidencia y Movimiento. Revisar ambos lotes entre compañeros.
4. Realizar la carga masiva con SSMS y bcp, conservar originales y obtener evidencia por tabla. Acordar el efecto de triggers antes de importar para evitar doble contabilización.
5. Preparar la exportación SSMS con estructura/datos, el Word/PDF de evidencias, los archivos de carga y el código reproducible.
6. Confirmar con el docente la interpretación de API por tabla y la zona horaria de entrega. El reparto por lotes es el del inventario; su equilibrio y la revisión cruzada se acuerdan entre ambos.

## Entrega académica

El enunciado indica miércoles 4 de noviembre de 2026, a más tardar las 9:00 a. m., en “entregable Proyecto 2” de Teams. No especifica zona horaria. La funcionalidad se prueba en clase y luego se revisa el código. El objetivo interno es tener el paquete revisado el 3 de noviembre.

Entregar: script generado desde SSMS con estructura y datos, documento Word/PDF con evidencia de carga por tabla, archivos originales de carga y código de todas las APIs. La plantilla Markdown y los datos preexistentes no sustituyen la evidencia real.
