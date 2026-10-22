# Roadmap para dos personas

Base: [análisis de requisitos](../analisis/ANALISIS_REQUERIMIENTOS.md). Plan elaborado el 21/10/2026 y actualizado el 22/10/2026 por la adopción de RepuestosAutomotrices. Periodo propuesto: **22/10–03/11/2026**; demostración y entrega académica el **04/11/2026, a más tardar las 9:00 a. m.**, según el PDF. El calendario usa provisionalmente `America/Mexico_City`; confirmar la zona del curso en F1. No se ha indicado disponibilidad diaria, por lo que son fechas objetivo, no una garantía de capacidad.

## Base de trabajo confirmada

Se reutiliza **RepuestosAutomotrices** en `100.124.109.126,15002`: 23 tablas, 34 SP y 13 triggers. La conexión de mantenimiento y las dependencias técnicas ya fueron verificadas, sin cargas ni cambios en registros. El backend no está implementado; se prevén al menos 92 operaciones CRUD. Ver [decisión y pendientes BD01–BD07](../info_bd/BASE_DATOS.md). Los 105 registros observados son datos preexistentes y no acreditan la importación exigida por el curso.

F1 parte del inventario identificado, para validar contratos y seguridad. F2 conserva la validación de ambos equipos y roles, aunque la cuenta de mantenimiento ya conectó. El usuario ejecutará las cargas; el equipo coordina archivos, comprobaciones y evidencia. La asignación 48/48 se mantiene y los puntos requieren revisión cruzada real.

## Reglas de equilibrio y trabajo

- **Persona 1: 48 puntos. Persona 2: 48 puntos. Total: 96 puntos.** Los puntos expresan esfuerzo relativo, no horas ni porcentaje de calificación. Cada fase tiene el mismo presupuesto por persona, incluidas implementación, pruebas, documentación y revisión.
- Cada tarea tiene una persona responsable y la otra como revisora. El responsable aporta código, pruebas y evidencia; el revisor verifica el resultado. El tiempo de revisión está incluido en el presupuesto de cada fase, no se considera trabajo gratuito.
- Ambos desarrollan datos, SQL y GraphQL. Se alterna la responsabilidad sobre infraestructura, documentación y demostración; no se deja a una persona solo programando y a la otra solo documentando.
- El equilibrio planificado es exacto en puntos; la igualdad de esfuerzo real se ajusta con el inventario y las horas registradas. La distribución definitiva requiere ponderar las 23 tablas conocidas, sus ajustes pendientes y la disponibilidad real.
- Al cierre de cada jornada registrar avances, tiempo real, bloqueos y esfuerzo restante. Si la diferencia acumulada de horas supera el 10 % del promedio entre ambos, o el esfuerzo pendiente deja de ser equivalente, transferir una tarea o subtarea revisable. Actualizar responsable y puntos de ambos lados; conservar presupuestos iguales o aprobar entre compañeros una reestimación simétrica.
- Si hay un bloqueo, el otro compañero toma una actividad independiente de la misma fase; no se marca terminada la tarea bloqueada. Los cambios en la BD compartida requieren coordinación entre los dos.

## Resumen por fases

| Fase | Fechas objetivo 2026 | Resultado | Persona 1 | Persona 2 | Dependencia |
| --- | --- | --- | ---: | ---: | --- |
| F1 | 22 oct. | Inventario, alcance y asignación de tablas | 4 | 4 | Artefactos/acceso del proyecto 1 |
| F2 | 23 oct. | Base Node.js, conexiones por rol y pilotos de herramientas | 6 | 6 | F1 cerrada |
| F3 | 24–25 oct. | Carga masiva completa y evidencias originales | 8 | 8 | F2; orden de FK |
| F4 | 26–28 oct. | CRUD GraphQL y SP completos | 10 | 10 | F2 y contratos F1; datos F3 para integración |
| F5 | 29–31 oct. | Seguridad y pruebas integrales | 12 | 12 | F3 y F4 |
| F6 | 1–2 nov. | Evidencia final, exportación y paquete reproducible | 5 | 5 | F5 aceptada |
| F7 | 3 nov. | Ensayo, revisión final y margen de corrección | 3 | 3 | F6 |
| **Total** | | | **48** | **48** | |

F3 y F4 pueden solaparse únicamente en módulos cuyos contratos y datos estén listos; no elimina sus criterios de salida. La ruta crítica es inventario → configuración/pilotos → carga y CRUD completos → pruebas → exportación/documento → revisión → entrega.

## F1 — Inventario y contrato de trabajo

Objetivo: convertir el enunciado en un listado real de tablas, procedimientos, roles y paquetes de trabajo. No empezar APIs para tablas supuestas.

| ID | Persona 1 | Puntos | ID | Persona 2 | Puntos |
| --- | --- | ---: | --- | --- | ---: |
| F1-P1-A | Validar y completar el inventario heredado de 23 tablas, columnas, PK/FK y datos existentes | 2 | F1-P2-A | Revisar los 34 SP heredados, parámetros, cobertura CRUD y permisos pendientes | 2 |
| F1-P1-B | Ponderar paquetes de tablas, proponer lotes equilibrados y revisar inventario de SP | 2 | F1-P2-B | Definir matriz de seguridad/login, decidir rol genérico, confirmar interpretación de API por tabla y horario de entrega; revisar lotes | 2 |

Salida: [INVENTARIO.md](../info_bd/INVENTARIO.md) completo, cantidad de tablas conocida, lotes A/B con esfuerzo equivalente, formato de datos acordado, alcance de autenticación y zona horaria registrados. Cada compañero debe tener acceso a los artefactos necesarios; esto no requiere compartir sus contraseñas en el repositorio.

## F2 — Base técnica y pilotos

| ID | Persona 1 | Puntos | ID | Persona 2 | Puntos |
| --- | --- | ---: | --- | --- | ---: |
| F2-P1-A | Inicializar Node.js, fijar dependencias/lockfile, configuración validada y composición del servicio GraphQL | 3 | F2-P2-A | Implementar configuraciones/pools por rol y base de identidad/contexto según permisos existentes | 3 |
| F2-P1-B | Ejecutar piloto SSMS con capturas, revisar pools y probar denegación según rol | 3 | F2-P2-B | Ejecutar piloto bcp con capturas, revisar schema base y validar conexión desde su equipo | 3 |

Salida: servicio base reproducible, parámetros de conexión leídos desde `.env`, conexiones distintas demostradas, mecanismo de identidad acordado y un piloto exitoso de cada herramienta. Las pruebas de SQL deben realizarse desde ambos equipos. Las tablas piloto se acreditan en F3 sin volver a cargarlas por duplicado; aquí se mide la preparación del procedimiento y en F3 la cobertura final de tablas.

## F3 — Carga masiva y evidencias por tabla

| ID | Persona 1 | Puntos | ID | Persona 2 | Puntos |
| --- | --- | ---: | --- | --- | ---: |
| F3-P1-A | Preparar formatos y archivos originales; ejecutar cargas pendientes del lote A respetando FK | 5 | F3-P2-A | Preparar formatos y archivos originales; ejecutar cargas pendientes del lote B respetando FK | 5 |
| F3-P1-B | Validar conteos, claves y capturas del lote A; revisar evidencia del lote B | 3 | F3-P2-B | Validar conteos, claves y capturas del lote B; revisar evidencia del lote A | 3 |

Salida: todas las tablas inventariadas tienen archivo de carga, resultado exitoso y comprobación; al menos un uso exitoso de SSMS y uno de bcp. Los archivos originales y las capturas están identificados por tabla. Las tablas padre pueden requerir ejecución antes que las hijas aunque pertenezcan al otro lote.

## F4 — Procedimientos y CRUD GraphQL

| ID | Persona 1 | Puntos | ID | Persona 2 | Puntos |
| --- | --- | ---: | --- | --- | ---: |
| F4-P1-A | Ajustar contratos de SP (IDs, errores y NULL) y cuatro operaciones GraphQL de cada tabla del lote A, con parámetros y tipos reales | 7 | F4-P2-A | Ajustar contratos de SP (IDs, errores y NULL) y cuatro operaciones GraphQL de cada tabla del lote B, con parámetros y tipos reales | 7 |
| F4-P1-B | Integrar módulos y contratos de errores; revisar código y SP del lote B | 3 | F4-P2-B | Integrar identidad/selección del pool y reglas de autorización; revisar código y SP del lote A | 3 |

Salida: todas las tablas tienen agregar, modificar, borrar y consultar, cada operación con SP identificado e invocado. Errores y tipos se manejan consistentemente, y no hay consultas de negocio directas que sustituyan SP. Revisar identidad/PK compuesta y permisos antes de dar por cerrado un módulo.

## F5 — Pruebas y correcciones

| ID | Persona 1 | Puntos | ID | Persona 2 | Puntos |
| --- | --- | ---: | --- | --- | ---: |
| F5-P1-A | Probar funcionalidad del lote B: CRUD, entradas inválidas, FK y efecto real en BD; corregir defectos propios | 7 | F5-P2-A | Probar funcionalidad del lote A: CRUD, entradas inválidas, FK y efecto real en BD; corregir defectos propios | 7 |
| F5-P1-B | Probar manipulación del rol, permisos SQL y aislamiento/concurrencia de pools; revisar correcciones de seguridad | 5 | F5-P2-B | Preparar colección/guion reproducible, probar login/sesión y rol genérico si aplica; corregir e integrar seguridad | 5 |

Salida: cobertura CRUD completa, casos permitidos y denegados por rol, sin escalamiento mediante rol enviado por el cliente; ambos equipos ejecutan el guion. Los defectos críticos de funcionalidad, seguridad y datos quedan resueltos. La colección no contiene contraseñas ni tokens reales guardados.

## F6 — Documento y paquete de entrega

| ID | Persona 1 | Puntos | ID | Persona 2 | Puntos |
| --- | --- | ---: | --- | --- | ---: |
| F6-P1-A | Generar desde SSMS el script con estructura y datos; comprobarlo en una base de verificación y preparar instrucciones | 3 | F6-P2-A | Componer el Word/PDF con portada, índice y evidencias de todas las tablas; verificar legibilidad | 3 |
| F6-P1-B | Revisar documento, archivos originales, cobertura de capturas y empaquetado sin secretos | 2 | F6-P2-B | Revisar script generado, objetos/datos y reproducibilidad del código en otro equipo | 2 |

Salida: cuatro entregables obligatorios listos y revisados contra el inventario. Usar la [plantilla de evidencias](../PLANTILLA_EVIDENCIAS.md) como guía; el archivo Markdown no reemplaza al Word/PDF. El script de exportación debe generarse realmente con SSMS, no redactarse manualmente para aparentar esa exportación.

## F7 — Ensayo final y cierre interno

| ID | Persona 1 | Puntos | ID | Persona 2 | Puntos |
| --- | --- | ---: | --- | --- | ---: |
| F7-P1-A | Ensayar explicación de carga y ejecutar demostración del lote B con los roles correspondientes | 2 | F7-P2-A | Ensayar explicación de arquitectura/seguridad y ejecutar demostración del lote A con los roles correspondientes | 2 |
| F7-P1-B | Cotejar checklist final y paquete; preparar carga en Teams y registrar confirmación cuando se entregue | 1 | F7-P2-B | Revisar ubicación, plazo y contenido; comprobar que archivos entregados sean los revisados | 1 |

Salida: ensayo completo, ambos compañeros pueden explicar ambos lotes, paquete final disponible y cierre interno el 3/11. La entrega efectiva la realiza el equipo en Teams; **no se ha realizado desde esta preparación**. Si es posible entregarla antes del límite, registrar el comprobante real. El 4/11 se reserva para la prueba en clase y verificar la entrega, no para implementar funcionalidades pendientes.

## Reparto de las 23 tablas identificadas

1. Validar el inventario identificado y sus contratos antes de asignar las 23 tablas; no repartir solo 12 contra 11 sin ponderar complejidad.
2. Estimar cada paquete tabla con esta escala interna: carga **1–3**, SP/CRUD **1–5**, pruebas y evidencia **1–3**. Sumar las tres dimensiones. La escala compara complejidad y no se suma directamente a los 96 puntos del calendario.
3. Formar lotes de esfuerzo equivalente. Una persona puede tener menos tablas si esas tablas tienen más relaciones, reglas o procedimientos faltantes.
4. Si el total ponderado es impar o una tabla concentra demasiado esfuerzo, dividir una actividad concreta (p. ej., pruebas de una tabla o preparación del archivo) con responsable y evidencia propios; evitar un “compartido” sin dueño.
5. Normalizar los lotes a los presupuestos de F3/F4/F5, incluyendo sus tareas transversales. Si el trabajo real excede el presupuesto, reestimar ambas personas antes de mantener fechas inviables.
6. Cualquier reasignación mueve también pruebas, documentación y revisión pendientes. Registrar la decisión en la bitácora de progreso y verificar de nuevo el 50/50.

No se reduce la cobertura exigida para conservar una fecha: si aparece riesgo de capacidad, priorizar primero los requisitos obligatorios y ajustar disponibilidad/calendario de forma explícita.
