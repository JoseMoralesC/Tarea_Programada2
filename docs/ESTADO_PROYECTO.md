# Estado del proyecto frente al PDF y al roadmap

Fecha de corte: **29 de octubre de 2026**. Alcance: copia local compartida y comprobaciones de solo lectura en RepuestosAutomotrices. Este informe documenta avance técnico y evidencia disponible; no certifica la calificación ni atribuye horas de trabajo individuales.

## 1. Fuentes y criterio de evaluación

Las fuentes documentales son el [PDF original de requisitos](requeriemientos/Tarea%20programada%202.pdf), de cinco páginas, y el [ROADMAP.md actual](roadmap/ROADMAP.md). El PDF define la obligación académica. El roadmap distribuye responsabilidades, fechas y 48 puntos de esfuerzo por persona; esos puntos no son una rúbrica del docente.

El roadmap conserva su planificación del 21–22/10: sus afirmaciones de que el backend no existe y de que había 34 SP describen aquella fecha. Para determinar el estado actual se contrastaron con el código, el [inventario](info_bd/INVENTARIO.md), los tests, la colección Postman y los metadatos/permisos del servidor. Se utilizó el archivo de roadmap que está presente actualmente; no se sustituyó por otra versión de Git.

Se distinguen tres niveles:

- **Implementado:** existe el código/objeto correspondiente.
- **Verificado localmente:** pasó una prueba reproducible; en CRUD se usó SQL simulado.
- **Aceptado de extremo a extremo:** funciona con SQL real y permisos de los roles, tiene evidencia y cumple la revisión cruzada del roadmap. Este nivel sigue pendiente para los ciclos CRUD completos.

La presencia de un SP no prueba su CRUD completo; las filas existentes no prueban carga con SSMS/bcp. La autoría personal no se infiere de los archivos: el avance por persona se asigna según la responsabilidad del lote y las tareas del roadmap, incluyendo el material integrado durante esta colaboración.

## 2. Resultado principal

**El lote B tiene su cobertura CRUD completa en código, pero el proyecto aún no cumple la entrega completa.** Faltan diez módulos GraphQL A, seguridad SQL efectiva, integración real, carga/evidencias y el paquete académico.

| Indicador de código | Persona 1: lote A | Persona 2: lote B | Proyecto |
| --- | ---: | ---: | ---: |
| Tablas asignadas | 12 | 11 | 23 |
| Tablas con cuatro operaciones GraphQL | 2 | 11 | 13 |
| Operaciones CRUD previstas | 48 | 44 | 92 |
| Operaciones CRUD implementadas y verificadas con SQL simulado | 8 | 44 | 52 |
| Cobertura CRUD de código | **16,7 %** | **100 %** | **56,5 %** |
| Operaciones CRUD por implementar | 40 | 0 | 40 |

Estos porcentajes miden cobertura de operaciones, no esfuerzo, tareas aceptadas, calificación ni porcentaje total del proyecto. **Persona 2 no está al 100 % de sus responsabilidades: ese 100 % corresponde exclusivamente a sus 44 operaciones de código.**

No hay base documental suficiente para asignar un porcentaje global de cumplimiento académico o un porcentaje de los 96 puntos: el PDF no pondera los requisitos y no se encontró un registro actual de cierres por tarea con revisión cruzada. Presentar el 56,5 % como avance total del proyecto sería incorrecto.

## 3. Evidencia verificada en esta revisión

| Comprobación | Resultado | Límite |
| --- | --- | --- |
| Lectura del PDF | Revisadas sus cinco páginas | Las páginas 2–3 ilustran evidencia; Libros/Subsistema son ejemplos, no tablas de este modelo |
| Lectura del roadmap | Revisadas F1–F7, sus tareas y 48/48 puntos | Es planificación, no registro de aceptación |
| Introspección del esquema Apollo | 13 queries de tablas y 39 mutations CRUD; además sesion, login y cerrarSesion | 52 operaciones CRUD más tres de autenticación/sesión |
| npm test | **39 pruebas aprobadas, 0 fallidas** | CRUD con SQL simulado; incluye HTTP local, no SQL de negocio real |
| Colección Postman | 57 solicitudes: 44 CRUD B, once comprobaciones de ausencia, login y logout | Plantilla preparada; no se acreditó su ejecución completa contra SQL |
| Metadatos SQL actuales | 23 tablas de modelo y 13 triggers | Se excluyó sysdiagrams del conteo de tablas de negocio |
| Procedimientos dbo actuales | 61: 54 de aplicación y siete auxiliares de diagramas de SSMS | No son 61 APIs ni 61 operaciones CRUD |
| SQL B | Presentes los 22 SP esperados: once consultas y once mantenimientos | Su presencia no prueba altas/cambios/borrados ni todos sus efectos |
| SQL A | Presentes los doce mantenimientos y las doce consultas específicas | Revisión estática; no se ejecutaron mantenimientos |
| Ajustes de mantenimiento A | Los once con identity muestran SCOPE_IDENTITY, NOCOUNT y revisión de @@ROWCOUNT; RepuestoModelo muestra NOCOUNT/ROWCOUNT | RepuestoModelo tiene PK compuesta y no debe evaluarse por SCOPE_IDENTITY; quedan por verificar sus contratos y errores en ejecución |
| Script A reintegrado | Los 21 procedimientos de scripts/Nuevos_Y_ModificacionSP.sql coinciden con las definiciones actuales: once mantenimientos y diez consultas | Comparación normalizada que omite comentarios, espacios y CREATE/ALTER; acredita el estado desplegado, no quién ejecutó el archivo ni sus ciclos CRUD |
| Dependencias reintegradas | SecuenciaCodigoRepuesto, GuardarRepuestoApp, LoginUsuario y VerificarClave presentes; ejecución CLR satisfactoria | Secuencia con inicio/valor actual 1, incremento 1 y sin ciclo; no se consumieron valores ni se volvió a aplicar el script de creación |
| Validación de dependencias | validar_dependencias.sql se detiene con error 51014 | Única referencia sin resolver: sp_upgraddiagrams → dbo.dtproperties, auxiliar de SSMS con microsoft_database_tools_support=1; cero referencias locales sin resolver en los demás objetos según ese filtro |
| Conexión cliente actual | Conecta; db_owner=1; puede ejecutar LoginUsuario y MantenimientoUsuario | No demuestra restricción SQL de cliente |
| Configuración local de la API | cargarConfig falla por DB_EMPLOYEE_USER ausente/vacío | No permite arrancar normalmente con las dos identidades requeridas |
| Archivos de carga/evidencia | No se localizaron originales de carga ni documento final de evidencia en esta copia; el único PDF de docs es el enunciado | Pueden existir fuera del repositorio; no se acreditan sin presentarlos |

Antecedentes comprobados durante la sesión: el usuario aplicó SQL 03/04 y se contrastaron sus 22 definiciones/parámetros y once consultas con ID 0; el generador de contraseña aceptó una clave ficticia y rechazó otra mediante el CLR real. Hoy se revalidó la presencia de los 22 SP B. Los archivos 03/04 ya no están localmente, por lo que no se repitió la comparación de sus cuerpos con archivos fuente.

El compañero reportó inicialmente haber probado Categoría/Marca. Se conserva ese antecedente, pero esta auditoría no ejecutó escrituras ni encontró un guion completo con resultados reales que permita dar por aceptados sus ocho casos. Las correcciones de sus errores iniciales sí están presentes y pasan las pruebas locales.

No se ejecutaron altas, modificaciones, borrados, cargas, cambios de permisos ni despliegues de SP durante este análisis. No se leyeron contraseñas o hashes para incluirlos en el informe.

## 4. Cumplimiento frente al PDF

| Requisito documental | Fuente | Evidencia actual | Estado frente a la entrega |
| --- | --- | --- | --- |
| Continuar el proyecto 1 | p. 1 y p. 4 | Base existente, 23 tablas, SP, FK y triggers; inventario disponible | Base técnica disponible; procedencia/alcance aprobado se confirma con el equipo |
| Preparar Excel/CSV/TXT para carga masiva | p. 1 | No se localizaron archivos de carga en esta copia | **Pendiente de acreditar** |
| Usar SSMS y bcp al menos una vez cada uno | p. 1 | No hay evidencia de importaciones exitosas por herramienta | **Pendiente de acreditar: 0/2 herramientas** |
| Cargar y documentar todas las tablas | pp. 1–3 | Tablas inventariadas; sin archivos/capturas de carga aceptados por tabla | **0/23 tablas acreditadas con la evidencia disponible** |
| Word/PDF con portada, índice por tabla y capturas del proceso/resultado | pp. 1–3 | Existe plantilla Markdown, no documento final | **Pendiente** |
| API GraphQL por tabla con agregar/modificar/borrar/consultar | p. 4 | 13/23 tablas, 52/92 operaciones en el esquema | **Parcial: faltan 40 operaciones A** |
| Invocar SP y crear los faltantes | p. 4 | Los resolvers usan execute parametrizado; existen mantenimientos y consultas específicas para las 23 tablas | Implementación disponible para 13 tablas; falta integración/cobertura de las otras diez |
| Preparar las consultas para el crecimiento de la aplicación | p. 4 | Módulos por tabla, filtros en B y consultas específicas | Avance técnico consistente; aceptación conjunta pendiente |
| Validación de usuario/rol según el dominio | p. 4 | LoginUsuario integrado, sesión/token y perfil; pruebas locales y antecedente CLR | Implementado; falta login positivo real y flujo completo de aplicación |
| Dos conexiones SQL distintas y seguridad efectiva según usuario | p. 4 | Gestor de pools y autorización en código; empleado sin credenciales completas y cliente con db_owner | **Requisito todavía no demostrado** |
| Tercer rol genérico si el proyecto lo necesita | p. 4 | Soporte opcional; previsto desactivado y limitado al catálogo cuando se habilita | Condicional; no es obligatorio habilitarlo si no hay acceso público. Falta cerrar/documentar la decisión del equipo |
| Probar funcionalidad en clase | p. 5 | Tests y colección de Postman preparados | Preparación parcial; falta guion ejecutado sobre SQL y ensayo |
| Script generado desde SSMS con estructura y datos | p. 5 | No se localizó la exportación completa | **Pendiente** |
| Entregar evidencia, originales y código de todas las APIs | p. 5 | Código parcial, Postman y plantilla; faltan evidencia/originales y diez módulos | **Paquete incompleto** |
| Teams, “entregable Proyecto 2”, miércoles 4/11 a más tardar 9 a. m. | p. 5 | Plazo identificado; sin comprobante de entrega | Pendiente; confirmar zona horaria del curso |

La carga masiva y la configuración de cuentas fueron aplazadas por decisión del equipo. Eso explica su estado, pero no elimina esas obligaciones del PDF. El frontend corresponde a una etapa futura y no se cuenta como faltante de esta entrega.

El PDF no fija cantidad de filas, número de tablas, framework Node, sistema de puntos 48/48 ni peso relativo de sus dos partes. Las 23 tablas/92 operaciones proceden del modelo y los puntos proceden del roadmap; no deben presentarse como cifras textuales del enunciado.

## 5. Persona 1: avance y pendientes

Su responsabilidad es el lote A y las tareas transversales de infraestructura, revisión B, exportación y ensayo indicadas en el roadmap.

**Avance acreditable:** inventario de tablas/columnas/relaciones/triggers; base Node/Apollo/mssql y lockfile; script de ajustes A conservado y sus 21 definiciones contrastadas con SQL (once mantenimientos y diez consultas); mantenimientos y consultas A presentes en SQL; Categoría y Marca con ocho operaciones corregidas, integradas y verificadas localmente. Los tres scripts auxiliares de dependencias también están reintegrados; sus resultados se detallan en la sección 9.

**Desarrollo pendiente:** Modelo, Repuesto, RepuestoModelo, Bodega, Proveedor, Inventario, Compra, DetalleCompra, Incidencia y Movimiento: diez módulos y 40 operaciones GraphQL. Las tablas/SP ya existentes no sustituyen estos resolvers, tipos y pruebas.

| Tarea roadmap | Puntos previstos | Estado evidenciable | Qué impide cerrarla |
| --- | ---: | --- | --- |
| F1-P1-A: inventario de tablas/columnas/PK/FK | 2 | Inventario disponible | Revisión cruzada y actualización final de contratos |
| F1-P1-B: ponderación de lotes/revisión SP | 2 | Lotes A/B definidos en el inventario | No hay ponderación completa ni horas/rebalanceo registrados |
| F2-P1-A: Node, dependencias, configuración y GraphQL | 3 | Base implementada y pruebas locales reproducibles | Revisión/aceptación del conjunto y arranque con configuración real completa |
| F2-P1-B: piloto SSMS y revisión/pruebas de roles | 3 | No se acreditó el piloto | Capturas y denegaciones reales por rol |
| F3-P1-A: archivos/cargas A | 5 | Pendiente de acreditar | Archivos originales y cargas de doce tablas |
| F3-P1-B: conteos/evidencia A y revisión B | 3 | Pendiente de acreditar | Evidencia por tabla y revisión cruzada |
| F4-P1-A: SP y CRUD A | 7 | SQL avanzado; código 8/48 | Diez módulos, manejo de NULL/errores y pruebas completas |
| F4-P1-B: integración/errores y revisión B | 3 | Composición del servicio disponible | Revisión del B y validación real de errores/contratos |
| F5-P1-A: pruebas cruzadas B | 7 | Material automatizado B disponible | Ejecución atribuible/revisada contra SQL real y comprobación de efectos |
| F5-P1-B: seguridad SQL/concurrencia/pools | 5 | Hay pruebas con SQL simulado en el proyecto | Restricciones SQL, concurrencia real y revisión de seguridad |
| F6-P1-A: exportación SSMS y verificación | 3 | No localizada | Script completo de estructura/datos y restauración en copia |
| F6-P1-B: revisar documento/originales/paquete | 2 | Pendiente | Los entregables todavía no están completos |
| F7-P1-A: ensayo de carga y demostración B | 2 | No acreditado | Guion y ensayo funcional con roles |
| F7-P1-B: checklist/paquete/Teams | 1 | Pendiente | Paquete aceptado y comprobante de entrega |
| **Presupuesto de persona 1** | **48** | No es porcentaje de ejecución aceptada | No se adjudican puntos por inferencia |

La revisión estática del SQL A demuestra trabajo previo al API, por lo que el 16,7 % no resume todo el esfuerzo de persona 1. Sus SP deben comprobarse también para rechazar selectores inválidos, diferenciar NULL explícito de omisión en columnas opcionales y resolver correctamente la PK compuesta de RepuestoModelo. La presencia de NOCOUNT/SCOPE_IDENTITY/ROWCOUNT no cierra esos contratos.

## 6. Persona 2: avance y pendientes

Su responsabilidad es el lote B, conexiones/contexto, autenticación/autorización, colección/guion, revisión A y composición de evidencias.

**Avance acreditable:** once módulos con 44 operaciones; login/sesiones; pools por rol; validación y traducción de errores; filtros por propietario; costo interno de DetalleVenta oculto al cliente; importes/fechas/estados; NULL explícito en contactos y entrega; revocación de sesiones al mantener usuarios; tests y colección Postman. Los 22 SP B están presentes en el servidor y su aplicación se verificó durante la sesión.

| Tarea roadmap | Puntos previstos | Estado evidenciable | Qué impide cerrarla |
| --- | ---: | --- | --- |
| F1-P2-A: revisión de SP/CRUD/permisos | 2 | Contratos B y metadatos revisados; permisos cliente comprobados | Cierre de todos los contratos y matriz SQL restringida |
| F1-P2-B: seguridad/login/genérico/docente/horario | 2 | Política API documentada | Decisión final de genérico, confirmación docente/zona y permisos |
| F2-P2-A: pools/contexto/identidad | 3 | Implementado y probado localmente | Credenciales empleado y demostración de ambas conexiones reales |
| F2-P2-B: piloto bcp/revisión/conexión propia | 3 | Piloto no acreditado | bcp con evidencia y validación real desde su equipo |
| F3-P2-A: archivos/cargas B | 5 | Pendiente de acreditar | Archivos originales y cargas de once tablas |
| F3-P2-B: conteos/evidencia B y revisión A | 3 | Pendiente de acreditar | Evidencia de carga y revisión cruzada |
| F4-P2-A: SP y CRUD B | 7 | 44/44 en código y SP desplegados | Ciclos CRUD reales, efectos/contratos y revisión del compañero |
| F4-P2-B: seguridad integrada/revisión A | 3 | Contexto, pools y autorización integrados | Permisos SQL efectivos y revisión del A completo |
| F5-P2-A: pruebas cruzadas A | 7 | Categoría/Marca verificadas localmente | Los diez módulos A restantes y pruebas reales de FK/efectos |
| F5-P2-B: colección/login/genérico/seguridad | 5 | 57 solicitudes y pruebas locales disponibles | Login positivo real, ejecutar el guion en ambos equipos y denegaciones SQL |
| F6-P2-A: documento Word/PDF de evidencias | 3 | Plantilla disponible | Documento final con capturas reales de todas las tablas |
| F6-P2-B: revisar exportación/reproducción | 2 | Pendiente | Exportación completa y prueba de reproducción en otro equipo |
| F7-P2-A: ensayo de arquitectura/seguridad y A | 2 | No acreditado | Ensayo con roles y A completo |
| F7-P2-B: verificar plazo/contenido entregado | 1 | Pendiente | Paquete final y comprobante de Teams |
| **Presupuesto de persona 2** | **48** | No es porcentaje de ejecución aceptada | El 100 % de código B no equivale a 48 puntos cerrados |

En este momento, los pendientes principales de persona 2 son de integración, seguridad, pruebas cruzadas, carga y entrega. No se identifican operaciones CRUD faltantes en sus once módulos. La aplicación de SP en la base es un avance real, aunque las pruebas de escritura todavía no estén acreditadas.

## 7. Proyecto completo frente a las fases del roadmap

| Fase | Objetivo del plan | Situación al 29/10 |
| --- | --- | --- |
| F1, 22/10 | Inventario, contratos, seguridad y reparto | Inventario y lotes disponibles; faltan cierres de contratos/seguridad/acuerdos |
| F2, 23/10 | Base técnica, dos conexiones y pilotos | Backend disponible; credenciales/permisos y pilotos SSMS/bcp pendientes |
| F3, 24–25/10 | Carga completa y evidencia | Aplazada; ninguna carga acreditada por archivo/capturas en esta copia |
| F4, 26–28/10 | CRUD/SP completos | B implementado; A 8/48; falta aceptación SQL y revisión |
| F5, 29–31/10 | Seguridad y pruebas integrales | 39 tests locales; ejecución real y ambas identidades pendientes |
| F6, 1–2/11 | Exportación, documento y paquete | No hay paquete completo; los cuatro entregables no están cerrados |
| F7, 3/11 | Ensayo y revisión final | Pendiente; requiere completar lo anterior |

El plan situaba la carga y el CRUD completos antes de comenzar F5. Hoy F3 no está acreditada y F4 conserva 40 operaciones pendientes, por lo que existe retraso respecto a esa secuencia. Las fechas de F6/F7 aún no vencieron, pero sus dependencias no están listas. El corte del 29/10 deja seis días calendario hasta el plazo del 4/11; esto no equivale a seis jornadas disponibles de trabajo.

No se deben declarar completadas fases por disponer de los tests de una parte. La revisión cruzada exige que persona 1 pruebe B y persona 2 pruebe A, además de corregir cada uno sus defectos.

## 8. Estado de los cuatro entregables obligatorios

| Entregable PDF p. 5 | Estado | Evidencia faltante |
| --- | --- | --- |
| Script generado desde SSMS con estructura y datos | No localizado | Exportación real de la base completa, incluyendo SP vigentes y datos; prueba de reproducción |
| Documento Word/PDF de carga | No localizado | Portada, índice por tabla, herramienta/archivo y capturas de proceso/resultado/datos |
| Originales Excel/CSV/TXT de carga | No localizados | Archivos realmente usados para todas las tablas |
| Código de todas las APIs | Parcial | Diez módulos A y sus pruebas; empaquetado reproducible del conjunto |

**Resultado: 0/4 entregables acreditados como completos; uno tiene avance parcial claro (código).** Esto no significa que no exista trabajo: significa que aún no se dispone del paquete final que el PDF exige.

## 9. Hallazgos de reproducción y documentación tras la limpieza

1. Los archivos locales sql/ajustes/03_lote_B_usuarios_procedimientos.sql y 04_lote_B_negocio_procedimientos.sql ya no existen. Los 22 SP B sí existen en el servidor. Falta una fuente SQL disponible en esta copia para reproducir esos ajustes, hasta recuperar los scripts o generar la exportación completa desde SSMS. Las definiciones presentes en una instancia no sustituyen el entregable SQL del PDF.
2. **Actualizado tras la reintegración:** sql/completar_dependencias.sql, diagnostico_dependencias.sql y validar_dependencias.sql vuelven a existir en las rutas esperadas por scripts/dependencias-db.mjs. La secuencia que crearía completar_dependencias.sql ya existe y tiene incremento 1, sin ciclo; no hace falta recrearla para recuperar esa dependencia. LoginUsuario, GuardarRepuestoApp y la función CLR VerificarClave están presentes, y el CLR ejecutó una comprobación sin exponer credenciales. Esto confirma el estado actual necesario, sin demostrar el historial de ejecución de cada archivo. Diagnóstico y validación son herramientas de comprobación, no migraciones que deban aplicarse a la base.
3. **Advertencia del validador reintegrado:** al ejecutar su contenido de solo lectura devuelve 51014 antes de alcanzar su prueba CLR. La única referencia local sin resolver es sp_upgraddiagrams → dbo.dtproperties. El procedimiento tiene la propiedad microsoft_database_tools_support=1 y pertenece a las herramientas de diagramas de SSMS, aunque is_ms_shipped=0. En los demás objetos no aparecen referencias sin resolver según el mismo filtro. La prueba CLR se ejecutó separadamente con éxito. No se debe crear dtproperties ni volver a aplicar migraciones de negocio para corregir esta advertencia: queda pendiente ajustar el criterio del validador para distinguir auxiliares de SSMS sin ocultar dependencias reales.
4. Tras recuperar los tres SQL, quedan **ocho enlaces locales a archivos ausentes** entre README, API, inventario y roadmap: seis a los ajustes B 03/04 y dos a documentación histórica eliminada. Además, aún hay dos archivos del script A en scripts/: Nuevos_Y_Modificacion_SP.sql y Nuevos_Y_ModificacionSP.sql. Su diferencia observada corresponde a codificación de comentarios y salto final, no a cambios SQL; queda pendiente consolidar una única fuente. La carpeta docs/scripts ya no existe.
5. Git muestra archivos de implementación y pruebas sin seguimiento, además de cambios y borrados pendientes. El avance medido corresponde al directorio de trabajo, no al último commit ni a lo que el compañero puede obtener mediante pull. Falta preparar/revisar el commit y el paquete compartido.
6. .env y dependencias locales están excluidos de Git; la plantilla compartible está presente. La exclusión no reemplaza la revisión final de secretos y capturas antes de entregar.

Estos hallazgos se documentan; este análisis no restaura archivos, modifica credenciales ni cambia la base.

## 10. Orden de trabajo recomendado para cerrar el requerimiento

| Prioridad | Responsable según roadmap | Resultado verificable |
| --- | --- | --- |
| 1 | Persona 2, revisa persona 1 | Dos identidades SQL restringidas; API arranca con ambas configuraciones; cliente no ejecuta mantenimiento de usuarios |
| 2 | Persona 1, revisa persona 2 | Diez módulos A y 40 operaciones incorporados al esquema mediante SP |
| 3 | Ambos; persona 1 prueba B y persona 2 prueba A | Guion real de CRUD y errores, login, dos clientes, permisos, stock/totales, rollback y concurrencia; resultados desde ambos equipos |
| 4 | Cada responsable de lote | Archivos de carga y ejecución real de SSMS/bcp, con originales y evidencia por cada tabla |
| 5 | Persona 1 exporta; persona 2 revisa | Exportación SSMS de estructura/datos y reproducción en copia; recuperar además una fuente de los SP retirados si se necesita antes |
| 6 | Persona 2 compone; persona 1 revisa | Word/PDF de evidencias completo y legible |
| 7 | Ambos | Referencias/documentación coherentes, código compartido, ensayo, paquete completo y comprobante de Teams en plazo |

Las prioridades 1 y 2 pueden avanzar en paralelo. La preparación de archivos/capturas no debe esperar al último día; coordinar cargas con los triggers y dependencias. La exportación final debe reflejar la base después de los ajustes/cargas que vayan a entregarse. Recuperar reproducibilidad y reparar referencias puede hacerse antes de esa exportación final.

Para asignar progreso por puntos, cada compañero debe registrar el cierre y la revisión de los IDs del roadmap. Hasta entonces, las métricas defendibles son las de cobertura de código, pruebas ejecutadas y entregables acreditados que aparecen en este informe.
