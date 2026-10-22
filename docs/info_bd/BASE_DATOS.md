# Base de datos oficial: RepuestosAutomotrices

 Este documento registra la adopción de la base existente y reemplaza el supuesto inicial sobre qué base usar. 

## Decisión y alcance

Se utilizará **`RepuestosAutomotrices`** para el desarrollo, las consultas, los procedimientos, las cargas manuales y la entrega del proyecto. `Tarea_Programada2` era el nombre de base previsto inicialmente; deja de ser el destino de conexión. La carpeta `Tarea_Programada2`, el título académico, Node.js, GraphQL, Tailscale y el equipo de dos compañeros conservan su propósito.

Se reutiliza el modelo existente en lugar de crear una base vacía o copiar datos entre bases. No se renombró ni eliminó ninguna base. El enunciado sigue requiriendo continuidad con el proyecto 1; el equipo debe confirmar que el alcance heredado corresponda a lo aprobado en ese proyecto.

| Parámetro                      | Valor oficial                                             |
| ------------------------------- | --------------------------------------------------------- |
| Motor                           | Microsoft SQL Server                                      |
| Base                            | `RepuestosAutomotrices`                                 |
| Servidor Tailscale              | `100.124.109.126`                                       |
| Puerto TCP                      | `15002`                                                 |
| Destino SSMS/bcp                | `100.124.109.126,15002`                                 |
| Configuración compartida       | `.env.example`, con credenciales vacías                |
| Configuración privada          | `.env`, excluido por `.gitignore`                     |
| TLS acordado para este servidor | `DB_ENCRYPT=true`, `DB_TRUST_SERVER_CERTIFICATE=true` |

La confianza explícita en el certificado permite conectarse al servidor actual sin validar su cadena; el cifrado permanece habilitado. Las contraseñas con `#` se escriben entre comillas en `.env`. No se documentan contraseñas, hashes ni tokens.

## Modelo identificado

| Área                      | Tablas                                                          |
| -------------------------- | --------------------------------------------------------------- |
| Usuarios y perfiles        | Rol, Usuario, Empleado, Aseguradora                             |
| Catálogo y compatibilidad | Categoria, Marca, Modelo, Repuesto, RepuestoModelo              |
| Abastecimiento             | Proveedor, Compra, DetalleCompra, Incidencia                    |
| Existencias                | Bodega, Inventario, Movimiento                                  |
| Atención y venta          | Caso, Cotizacion, DetalleCotizacion, Venta, DetalleVenta, Envio |
| Trazabilidad               | Auditoria                                                       |

El inventario identifica **23 tablas**, **34 procedimientos**, **13 triggers** y **32 claves foráneas en el script analizado**. La revisión del servidor confirmó las cantidades de tablas, procedimientos y triggers. Se observaron **105 filas preexistentes** en los conteos del catálogo; es una referencia fechada, no una promesa sobre conteos futuros ni evidencia de importación académica.

El alcance mínimo de GraphQL es de **92 operaciones CRUD** (23 × 4), además de autenticación y las consultas necesarias. Hay un mantenimiento por tabla y un selector de consulta para las 23, pero eso no significa que existan 92 APIs implementadas ni que sus permisos y contratos estén listos.

## Verificaciones ya realizadas

| Elemento                          | Resultado del 22/10/2026                                                        |
| --------------------------------- | ------------------------------------------------------------------------------- |
| Conexión de mantenimiento        | Correcta desde este equipo contra RepuestosAutomotrices                         |
| `dbo.SecuenciaCodigoRepuesto`   | Ya existía; conservada sin reiniciar ni consumir valores                       |
| `dbo.GuardarRepuestoApp`        | Presente; utiliza la secuencia existente                                        |
| Ensamblado`Repuestos.Passwords` | Presente con`UNSAFE_ACCESS`                                                   |
| `dbo.VerificarClave`            | Presente; activación y ejecución CLR comprobadas                              |
| `dbo.LoginUsuario`              | Presente; no se probó un login real de la futura aplicación                   |
| CLR y seguridad estricta          | Habilitados                                                                     |
| Referencias SQL locales           | No se detectaron referencias sin resolver, excluyendo`inserted` y `deleted` |
| Corrección idempotente           | Ejecutada; no necesitó crear o reemplazar objetos                              |
| Datos                             | No se cargaron ni modificaron registros durante esta intervención              |

La comprobación del verificador utilizó una cadena técnica contra un hash existente sin devolver ese hash. No demuestra todavía autorización por rol, manejo de sesiones ni funcionalidad de todas las operaciones CRUD.

Herramientas disponibles en la raíz:

```powershell
node --env-file=.env scripts/dependencias-db.mjs diagnostico
node --env-file=.env scripts/dependencias-db.mjs validar
```

El modo `aplicar` crea únicamente la secuencia si falta y el modelo esperado está presente. Los scripts SQL están en `sql/`. No ejecutarlos como una carga de datos.

## Ajustes pendientes, todavía sin aplicar

| ID   | Ajuste                                                                                                                    | Fases previstas |
| ---- | ------------------------------------------------------------------------------------------------------------------------- | --------------- |
| BD01 | Definir identidades y permisos SQL separados para cliente y empleado; DB_SETUP es solo mantenimiento                      | F1, F2, F5      |
| BD02 | Unificar respuestas de SP: devolver ID de alta, detectar modificación sin registro y rechazar`@function` inválido     | F4, F5          |
| BD03 | Permitir limpiar campos nullable distinguiendo ausencia del parámetro de asignación explícita de NULL                  | F4, F5          |
| BD04 | Crear consultas apropiadas para GraphQL, con columnas y permisos definidos; mantener hashes fuera de respuestas públicas | F4, F5          |
| BD05 | Controlar cambios directos en totales, inventario y auditoría según reglas de negocio                                   | F4, F5          |
| BD06 | Definir estrategia de carga y triggers para evitar doble contabilización de inventario y validar restricciones           | F1–F3          |
| BD07 | Confirmar procedencia del modelo del proyecto 1, permisos de login y necesidad de acceso genérico                        | F1, F2          |

El diagnóstico encontró a `Jose` como usuario explícito con `db_owner`, además de los principales internos. No se alteraron sus permisos ni se crearon cuentas nuevas. Los roles de negocio Administrador/Empleado/Cliente no equivalen por sí mismos a identidades SQL separadas. Las credenciales `DB_EMPLOYEE_*` estaban pendientes al terminar la verificación; cualquier cambio local posterior debe comprobarse sin publicar secretos.

## Cargas y evidencia académica

El usuario realizará las cargas de datos. Se deben conservar archivos originales y capturas por tabla, usando SSMS y bcp al menos una vez cada uno. La existencia de datos y la exportación con INSERT no sustituyen ese requisito.

Antes de importar, acordar si se cargan saldos finales o se reconstruyen mediante operaciones. Compras, ventas y movimientos tienen triggers que afectan existencias; aplicar ambos enfoques sin conciliación puede duplicar sus efectos. Documentar también la ejecución de triggers y restricciones de cada herramienta. No hay autorización en esta actualización documental para modificar esos objetos o cargar registros.

## Documentos relacionados

- [README del proyecto](../../README.md).
- [Análisis actualizado](../analisis/ANALISIS_REQUERIMIENTOS.md).
- [Inventario por tabla y procedimiento](INVENTARIO.md).
- [Roadmap](../roadmap/ROADMAP.md).
- [Progreso](../markdowns/PROGRESO.md).
- [Plantilla de evidencias](../PLANTILLA_EVIDENCIAS.md).

La planificación conserva **48 puntos por persona**. Los avances técnicos comprobados se registran como antecedente del equipo; no se asignan puntos ni revisiones ficticias a persona 1 o persona 2.
