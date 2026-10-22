# Tarea Programada 2 — Bases de datos avanzadas

Proyecto universitario del curso **TI-156 Bases de datos avanzadas, III Cuatrimestre de 2026**, desarrollado por dos compañeros identificados como **persona 1** y **persona 2**. Continúa el proyecto 1 y prepara el backend para una futura aplicación web.

El proyecto comprende la carga masiva de todas las tablas con **SSMS y bcp**, y servicios **GraphQL en Node.js** que ejecutan procedimientos almacenados en **SQL Server**. Desde el **22 de octubre de 2026**, la base oficial es **`RepuestosAutomotrices`**, accesible mediante Tailscale. El nombre de la carpeta y del proyecto académico sigue siendo Tarea Programada 2.

## Estado actual — 22/10/2026

Se analizó el enunciado y se adoptó la base existente de repuestos automotrices: **23 tablas, 34 procedimientos almacenados y 13 triggers**, con 105 filas preexistentes según el diagnóstico del 22/10/2026. El dominio comprende catálogo, compras, inventario por bodega, aseguradoras, casos, cotizaciones, ventas y envíos.

La conexión de mantenimiento quedó validada, al igual que la secuencia de códigos y el ensamblado/función CLR de autenticación. La secuencia ya existía en el servidor; el script idempotente la conservó y no fue necesario crear objetos. **No se realizaron cargas ni cambios en registros.** Los datos existentes no acreditan todavía la carga académica con SSMS y bcp; esa ejecución queda a cargo del usuario/equipo.

**El backend GraphQL aún no está implementado.** La referencia inicial es de al menos 92 operaciones CRUD para las 23 tablas, más autenticación y consultas adicionales. Siguen pendientes la separación de cuentas/permisos por rol, los ajustes funcionales de procedimientos y las evidencias de carga. La decisión y el estado técnico están registrados en [Base de datos oficial](docs/info_bd/BASE_DATOS.md).

## Documentación

| Archivo | Contenido |
| --- | --- |
| [Enunciado original](docs/requeriemientos/Tarea%20programada%202.pdf) | Fuente oficial de requisitos; se conserva la ruta original. |
| [Análisis](docs/analisis/ANALISIS_REQUERIMIENTOS.md) | Requisitos por página, alcance, arquitectura propuesta, riesgos y aceptación. |
| [Roadmap](docs/roadmap/ROADMAP.md) | Fases, dependencias y reparto de 48 puntos por persona. |
| [Progreso](docs/markdowns/PROGRESO.md) | Actividades, responsables, métricas y checklist final. |
| [Inventario](docs/info_bd/INVENTARIO.md) | Matrices por tabla, procedimiento, operación, permiso y evidencia. |
| [Plantilla de evidencias](docs/PLANTILLA_EVIDENCIAS.md) | Base para redactar el Word o PDF obligatorio. |
| [Base de datos oficial](docs/info_bd/BASE_DATOS.md) | Decisión de adoptar RepuestosAutomotrices, verificación y ajustes pendientes. |

## Conexión y configuración

El archivo `.env` local ya está creado con los datos conocidos:

| Parámetro | Valor |
| --- | --- |
| Servidor | `100.124.109.126` |
| Puerto TCP | `15002` |
| Base de datos | `RepuestosAutomotrices` |
| Destino en SSMS/bcp | `100.124.109.126,15002` |

Cada compañero debe mantener su propio `.env`. `DB_CLIENT_*` y `DB_EMPLOYEE_*` corresponden a las identidades SQL de cliente y empleado de la aplicación, independientemente de quién desarrolla el código. `DB_SETUP_*` es una cuenta separada de mantenimiento; no debe utilizarse como conexión habitual de la API. La conexión de mantenimiento ya fue comprobada desde este equipo. Las credenciales de empleado y la matriz de permisos siguen pendientes; no se ha validado el funcionamiento por ambos roles ni desde ambos equipos.

Si una contraseña contiene `#`, debe ir entre comillas para evitar que Node.js la interprete parcialmente como comentario. `.env.example` contiene únicamente campos vacíos para las credenciales.

Si un compañero no tiene `.env`, puede crear uno desde PowerShell sin sobrescribir uno existente:

```powershell
Copy-Item -LiteralPath .env.example -Destination .env -ErrorAction Stop -NoClobber
```

No guardar contraseñas en documentación ni capturas. `.gitignore` excluye `.env`; `.env.example` sí se comparte. `.ignore` excluye archivos locales de búsquedas compatibles y no sustituye a `.gitignore`. Esta carpeta todavía no tiene un repositorio Git inicializado.

El backend deberá convertir `DB_PORT` a número y las opciones booleanas comparando con la cadena `"true"`. No usar `Boolean("false")`. Deberá construir un pool independiente por rol usando el servidor y la base comunes. `DB_GENERIC_ENABLED=false` mantiene desactivado el acceso genérico hasta justificarlo por el dominio. Para este servidor se acordó `DB_ENCRYPT=true` y `DB_TRUST_SERVER_CERTIFICATE=true`: la conexión va cifrada y confía en el certificado presentado, sin validar su cadena. Tailscale no determina por sí mismo las opciones TLS de SQL Server.

Los scripts de mantenimiento utilizan Node.js y el `sqlcmd` instalado. El diagnóstico lee metadatos y conteos; la validación ejecuta además el verificador CLR sin devolver hashes ni autenticar una cuenta:

```powershell
node --env-file=.env scripts/dependencias-db.mjs diagnostico
node --env-file=.env scripts/dependencias-db.mjs validar
```

El modo `aplicar` se reserva para completar la secuencia si falta en una instalación del mismo modelo. En el servidor actual no hizo cambios porque la secuencia ya estaba presente. No hay scripts de carga automática en estas herramientas.

## Desarrollo previsto

Se utilizará Node.js con GraphQL y un cliente SQL Server capaz de ejecutar procedimientos almacenados; se propone `mssql`. La versión de Node.js y las dependencias se fijarán al iniciar la implementación. No existen todavía `package.json`, scripts de npm ni un servidor que se pueda arrancar.

El flujo previsto es: solicitud GraphQL → identidad y rol verificados → operación autorizada → pool del rol → procedimiento almacenado → respuesta. Cada tabla deberá tener operaciones de agregar, modificar, borrar y consultar. No basta con una API de ejemplo.

La carga masiva debe realizarse con las herramientas exigidas en el curso, aunque Node.js ayude a preparar o validar archivos. No se incluye frontend en este avance.

## Entrega académica

El PDF indica **miércoles 4 de noviembre de 2026, a más tardar las 9:00 a. m.**, en el directorio **“entregable Proyecto 2”** del canal del grupo en Teams. La funcionalidad se prueba en clase y el código se revisa después. El enunciado no especifica zona horaria: confirmar la del curso; el calendario del roadmap usa provisionalmente `America/Mexico_City`.

Deben entregarse el script generado desde SSMS con **estructura y datos**, el documento Word o PDF de evidencias por tabla, los archivos originales de carga y el código de todas las APIs. El objetivo interno es dejar el paquete revisado el **3 de noviembre**.
