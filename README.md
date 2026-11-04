# Proyecto 2 — Repuestos automotrices

Continuamos el proyecto del curso TI-156 Bases de datos avanzadas con una API GraphQL para nuestra base `RepuestosAutomotrices`. Nos repartimos el trabajo en dos lotes y mantuvimos un módulo por tabla para poder revisar juntos el funcionamiento.

El proyecto incluye las cuatro operaciones de las 23 tablas: agregar, consultar, modificar y borrar. Usamos Node.js, Apollo Server y SQL Server. Las operaciones se resuelven con procedimientos almacenados y cada tipo de usuario utiliza la conexión SQL que le corresponde.

## Para ejecutar el proyecto

Necesitamos Node.js 22 o posterior y acceso al servidor SQL que usamos como equipo.

```powershell
npm ci
# Si todavía no tenemos el archivo de configuración:
Copy-Item -LiteralPath .env.example -Destination .env -NoClobber
```

Completamos `.env` con el servidor, la base y las cuentas de cliente, empleado y, si lo habilitamos, genérico. Las cuentas SQL son distintas de los usuarios que inician sesión en la aplicación. Dejamos las contraseñas entre comillas cuando contienen `#` y conservamos este archivo solo en cada equipo.

```powershell
npm start
```

La dirección predeterminada es http://localhost:4000/. Con `npm run dev` podemos trabajar con recarga automática.

## Decisiones que tomamos

- Administrador y empleado comparten la conexión de personal, pero la API limita las operaciones de cada uno.
- El cliente consulta sus propios datos. No puede cambiar su rol enviándolo en una solicitud.
- Si habilitamos el acceso genérico, permitimos consultar categorías, marcas, modelos y compatibilidades.
- Validamos fechas, textos, cantidades e importes antes de enviarlos a SQL. Omitir un campo conserva su valor; enviar `null` limpia los campos que permiten quedar vacíos.
- Las ventas, compras y movimientos actualizan existencias y totales con las reglas de la base. Un empleado no puede registrar un movimiento a nombre de otro.
- Conservamos las evidencias que ya tenemos y las damos por suficientes para el cierre.

## Comprobaciones

```powershell
npm test
npm run demo:check
npm run verify:hash
node --env-file=.env scripts/dependencias-db.mjs validar
npm audit --omit=dev
```

Para probar el CRUD con SQL real usamos `npm run test:integration`. Este comando necesita la cuenta de mantenimiento con permiso para crear bases. Restaura la exportación en una base temporal, prepara otra para las pruebas y elimina únicamente las copias que creó. Comprueba los cambios y borrados, las restricciones por usuario, las existencias y los totales sin escribir registros de negocio en nuestra base compartida.

Los resultados y el alcance de cada revisión están en [Estado del proyecto](docs/ESTADO_PROYECTO.md).

## Archivos que usamos

| Archivo o carpeta | Para qué lo conservamos |
| --- | --- |
| [Guía de la API](docs/API.md) | Login, permisos, consultas y ejemplos |
| [Preparación de SQL Server](docs/INSTALACION_SQL.md) | Pasos para instalar la base en otro entorno |
| [Inventario](docs/info_bd/INVENTARIO.md) | Tablas, relaciones y reparto del trabajo |
| [Plan de cierre](docs/roadmap/ROADMAP.md) | Orden que seguimos para revisar y entregar |
| [Revisión general](docs/AUDITORIA_GENERAL_2026-11-03.md) | Problemas encontrados y cómo los atendimos |
| [Guía de Postman](docs/pruebas/DEMO_CRUD.md) | Recorrido de demostración del lote B |
| [Exportación SQL](db/RepuestosAutomotrices.sql) | Estructura, datos, procedimientos, triggers, secuencia y permisos |
| [Enunciado](docs/requeriemientos/Tarea%20programada%202.pdf) | Requisitos del curso |

En `db/sql` conservamos los permisos, los cambios de campos opcionales y las herramientas de revisión. `DB_SETUP` se usa para mantenimiento y pruebas; la API no la utiliza para atender solicitudes.

## Entrega

El enunciado fija la entrega para el miércoles 4 de noviembre de 2026, a más tardar a las 9:00 a. m., en “entregable Proyecto 2” de Teams. No indica zona horaria.

Reunimos la exportación con estructura y datos, los documentos de evidencias, los archivos originales de carga y el código de las APIs. La demostración se realiza con GraphQL durante la clase. El frontend queda para la siguiente etapa del curso.
