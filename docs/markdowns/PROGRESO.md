# Seguimiento del proyecto

Actualización: 22/10/2026. Plan inicial: 21/10/2026. Equipo: **persona 1** y **persona 2**. Fuente del alcance: [análisis](../analisis/ANALISIS_REQUERIMIENTOS.md); asignación y criterios de salida: [roadmap](../roadmap/ROADMAP.md).

## Preparación documental realizada

- [x] Leer el enunciado de cinco páginas y documentar requisitos, riesgos y aceptación.
- [x] Crear roadmap por fases con presupuesto 48/48 y revisión cruzada.
- [x] Crear README inicial, matrices de inventario y plantilla de evidencias.
- [x] Crear `.env` y `.env.example` con host, puerto y base; plantilla sin secretos y configuración local separada por función.
- [x] Crear `.gitignore` y `.ignore`.

La conexión de mantenimiento y las dependencias técnicas ya fueron verificadas; no se han implementado APIs ni acreditado cargas, seguridad por rol o entrega académica. Los puntos siguientes requieren cierre y revisión cruzada de las tareas completas; no se asignan a los compañeros por verificaciones realizadas durante esta asistencia. **Ejecución: persona 1 = 0/48; persona 2 = 0/48; total = 0/96 (0 %).** Ninguna tarea de ejecución se marca completada por anticipado.

## Cambio de base y avances comprobados

- [x] Adoptar **RepuestosAutomotrices** como base oficial y actualizar `.env.example`.
- [x] Identificar 23 tablas, 34 SP y 13 triggers; registrar el inventario heredado.
- [x] Verificar conexión de mantenimiento desde este equipo.
- [x] Verificar secuencia, ensamblado y función CLR; sin referencias locales faltantes detectadas.
- [x] Ejecutar la corrección idempotente: conservó la secuencia existente y no creó objetos.
- [x] Registrar que no se cargaron ni modificaron registros; las cargas las realizará el usuario.
- [ ] Cerrar contratos, reparto ponderado y matriz de seguridad de ambos roles.

Evidencia y alcance: [Base de datos oficial](../info_bd/BASE_DATOS.md). Referencia de datos: 105 filas preexistentes observadas el 22/10/2026, no una carga académica acreditada.

## Estados y forma de medir

Estados válidos: `Pendiente`, `En curso`, `Bloqueado`, `En revisión`, `Completado`. Una actividad se completa cuando existe su producto, una evidencia enlazada y aprobación del compañero revisor. Si no aplica el rol genérico, documentar esa decisión y probar la política resultante; no eliminar el resto de la actividad.

`Progreso por persona = puntos de sus tareas completadas / 48 × 100`.

`Progreso global = puntos completados de ambos / 96 × 100`.

No otorgar puntos parciales por “casi terminado”. Si se necesita granularidad, dividir antes la tarea en subtareas con puntos cuya suma conserve su presupuesto. Actualizar tabla y métricas a la vez. El porcentaje de puntos mide ejecución planificada; la cobertura de tablas y requisitos se controla aparte.

| Métrica | Estado al 22/10/2026 | Meta |
| --- | --- | --- |
| Puntos persona 1 | 0/48 | 48/48 |
| Puntos persona 2 | 0/48 | 48/48 |
| Puntos globales | 0/96 | 96/96 |
| Tablas identificadas N | 23; contratos y reparto por cerrar | 23 tablas revisadas y alcance cerrado |
| Tablas con carga y evidencia aceptadas | 0/23 acreditadas para este avance | 23/23 con archivos y evidencia |
| Operaciones CRUD GraphQL implementadas y probadas | 0/92 | 92/92 como mínimo; más queries si se definen |
| Operaciones CRUD con SP identificado | Mapeo preliminar 92/92; contratos y permisos sin cerrar | 92/92 revisadas y probadas |
| Herramientas con evidencia exitosa | 0/2 | SSMS y bcp |
| Casos de permisos ejecutados | Pendiente definir matriz | Todos los casos definidos, permitidos y denegados |
| Entregables obligatorios terminados | 0/4 | 4/4 |
| Horas reales persona 1 / persona 2 | 0 / 0 | Esfuerzo revisado diariamente |
| Entrega en Teams confirmada | No | Sí, dentro del plazo |

## Tablero de actividades

Los IDs y presupuestos corresponden al roadmap. La otra persona es revisora de cada fila. Escribir rutas reales en “Evidencia” y fecha/aprobación al completar.

| ID | Responsable | Actividad | Puntos | Estado | Evidencia | Revisión / fecha |
| --- | --- | --- | ---: | --- | --- | --- |
| F1-P1-A | Persona 1 | Inventario de estructura y datos | 2 | Pendiente | — | — |
| F1-P1-B | Persona 1 | Ponderación de lotes y revisión de SP | 2 | Pendiente | — | — |
| F1-P2-A | Persona 2 | Inventario de SP y permisos | 2 | Pendiente | — | — |
| F1-P2-B | Persona 2 | Alcance de seguridad, docente/horario y revisión de lotes | 2 | Pendiente | — | — |
| F2-P1-A | Persona 1 | Base Node.js y GraphQL | 3 | Pendiente | — | — |
| F2-P1-B | Persona 1 | Piloto SSMS, revisión y prueba de roles | 3 | Pendiente | — | — |
| F2-P2-A | Persona 2 | Pools y contexto de identidad | 3 | Pendiente | — | — |
| F2-P2-B | Persona 2 | Piloto bcp y revisión técnica | 3 | Pendiente | — | — |
| F3-P1-A | Persona 1 | Archivos y cargas lote A | 5 | Pendiente | — | — |
| F3-P1-B | Persona 1 | Validación/evidencias A y revisión B | 3 | Pendiente | — | — |
| F3-P2-A | Persona 2 | Archivos y cargas lote B | 5 | Pendiente | — | — |
| F3-P2-B | Persona 2 | Validación/evidencias B y revisión A | 3 | Pendiente | — | — |
| F4-P1-A | Persona 1 | SP y CRUD lote A | 7 | Pendiente | — | — |
| F4-P1-B | Persona 1 | Integración, errores y revisión B | 3 | Pendiente | — | — |
| F4-P2-A | Persona 2 | SP y CRUD lote B | 7 | Pendiente | — | — |
| F4-P2-B | Persona 2 | Seguridad integrada y revisión A | 3 | Pendiente | — | — |
| F5-P1-A | Persona 1 | Pruebas cruzadas B y correcciones propias | 7 | Pendiente | — | — |
| F5-P1-B | Persona 1 | Pruebas de seguridad, SQL y concurrencia | 5 | Pendiente | — | — |
| F5-P2-A | Persona 2 | Pruebas cruzadas A y correcciones propias | 7 | Pendiente | — | — |
| F5-P2-B | Persona 2 | Colección, login y correcciones de seguridad | 5 | Pendiente | — | — |
| F6-P1-A | Persona 1 | Script SSMS con estructura/datos y verificación | 3 | Pendiente | — | — |
| F6-P1-B | Persona 1 | Revisar documento y paquete | 2 | Pendiente | — | — |
| F6-P2-A | Persona 2 | Documento final Word/PDF de evidencias | 3 | Pendiente | — | — |
| F6-P2-B | Persona 2 | Revisar script y reproducción del backend | 2 | Pendiente | — | — |
| F7-P1-A | Persona 1 | Ensayo de carga y demo lote B | 2 | Pendiente | — | — |
| F7-P1-B | Persona 1 | Checklist, paquete y coordinación de entrega | 1 | Pendiente | — | — |
| F7-P2-A | Persona 2 | Ensayo de arquitectura y demo lote A | 2 | Pendiente | — | — |
| F7-P2-B | Persona 2 | Verificación de paquete, ubicación y plazo | 1 | Pendiente | — | — |

## Control del esfuerzo real

Registrar horas de desarrollo, carga, pruebas, documentación, coordinación y revisión. Los puntos iguales son la estimación inicial; esta bitácora permite corregir desigualdades reales.

| Fecha | Horas persona 1 | Horas persona 2 | Acumulado P1 / P2 | Esfuerzo restante P1 / P2 | Reasignación acordada |
| --- | ---: | ---: | --- | --- | --- |
| Sin jornadas registradas | 0 | 0 | 0 / 0 | 48 / 48 puntos estimados | — |

Usar `diferencia relativa = abs(horas P1 − horas P2) / promedio(horas P1, horas P2) × 100`; si ambas son cero, no aplica. Si supera 10 %, revisar tareas transferibles sin dejar una persona como mero apoyo. Anotar transferencias y recalcular presupuestos en los documentos afectados.

## Bloqueos y decisiones

| ID | Fecha | Bloqueo / decisión pendiente | Responsable | Próxima acción | Estado |
| --- | --- | --- | --- | --- | --- |
| B01 | 22/10/2026 | Inventario básico resuelto; contratos, alcance y reparto pendientes | Persona 1 | Completar y revisar el inventario heredado de RepuestosAutomotrices en F1 | Parcialmente resuelto |
| B02 | 22/10/2026 | Mantenimiento conecta; faltan cuenta empleado y permisos por rol/segundo equipo | Persona 2 | Definir identidades de aplicación y comprobar permisos; mantener DB_SETUP separado | Parcialmente resuelto |
| B03 | 21/10/2026 | Zona del curso y organización de “API por tabla” sin confirmar | Persona 2 | Confirmar y registrar acuerdos en F1 | Abierto |

Estos pendientes no invalidan la conexión de mantenimiento ni la verificación de dependencias ya realizadas. Impiden cerrar la configuración por roles, el reparto y las tareas de ejecución que aún faltan. Los ajustes BD01–BD07 están registrados en el documento de base oficial y no se han aplicado.

## Checklist de aceptación y entrega

- [ ] Inventario N cerrado y paquetes A/B equilibrados con esfuerzo real revisado.
- [ ] Credenciales locales completadas y conexión validada desde ambos equipos.
- [ ] Identidades SQL separadas para cliente y empleado verificadas; genérico resuelto si aplica.
- [ ] Todas las tablas cargadas y comprobadas; archivos originales conservados.
- [ ] Al menos una carga exitosa con SSMS y una con bcp, con capturas.
- [ ] Por cada tabla: agregar, modificar, borrar y consultar mediante GraphQL y SP.
- [ ] Procedimientos faltantes completados y pruebas de errores/relaciones aceptadas.
- [ ] Autenticación, rol verificado y permisos efectivos demostrados.
- [ ] Colección o guion de prueba reproducible en los dos equipos, sin secretos.
- [ ] **Entregable 1:** script generado con SSMS, estructura y datos, probado en base de verificación.
- [ ] **Entregable 2:** documento Word/PDF con portada, índice por tabla y todas las evidencias legibles.
- [ ] **Entregable 3:** archivos originales Excel/CSV/TXT utilizados en cada carga.
- [ ] **Entregable 4:** código de todas las APIs, dependencias fijadas e instrucciones de ejecución actualizadas.
- [ ] Paquete sin `.env`, contraseñas, tokens reales ni capturas con secretos.
- [ ] Ensayo en clase preparado; ambos explican carga, backend y seguridad.
- [ ] Ubicación Teams “entregable Proyecto 2” y zona horaria confirmadas.
- [ ] Entrega real registrada el 4/11/2026 a más tardar a las 9:00 a. m. del curso, o antes.

## Bitácora de decisiones

| Fecha | Cambio | Efecto sobre la planificación |
| --- | --- | --- |
| 22/10/2026 | Se adopta RepuestosAutomotrices como base oficial | Actualizar documentación, configuración de ejemplo e inventario; conservar 48 puntos por persona |
| 22/10/2026 | Dependencias técnicas presentes y conexión de mantenimiento comprobada | Aprovechar el estado existente; quedan pendientes seguridad, ajustes funcionales y backend |
| 22/10/2026 | Cargas de datos reservadas al usuario/equipo | No se ejecutan importaciones durante esta actualización documental |

## Registro de hitos y entrega real

| Hito | Fecha objetivo | Fecha real | Evidencia / aprobación |
| --- | --- | --- | --- |
| Inventario y reparto cerrados | 22/10/2026 | — | — |
| Herramientas y conexiones listas | 23/10/2026 | — | — |
| Cargas completas | 25/10/2026 | — | — |
| CRUD completo | 28/10/2026 | — | — |
| Pruebas aceptadas | 31/10/2026 | — | — |
| Paquete completo | 02/11/2026 | — | — |
| Cierre interno y ensayo | 03/11/2026 | — | — |
| Entrega Teams | 04/11/2026, ≤ 9:00 a. m. del curso | — | Persona que entregó, hora/zona y comprobante |
