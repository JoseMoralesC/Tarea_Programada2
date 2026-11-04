# Revisión general y ajustes del proyecto

El 3 de noviembre revisamos el proyecto completo contra el enunciado. Aunque ya estaban escritas las 92 operaciones, encontramos que diez módulos no podían trabajar con las cuentas SQL de la aplicación. También aparecieron detalles en las fechas, los campos opcionales y la atribución de movimientos.

Acordamos resolver primero los permisos y después revisar las reglas de los datos, la instalación y la documentación. Conservamos las evidencias existentes como suficientes y dejamos `docs/doc master` sin cambios.

## Qué encontramos y cómo lo atendimos

| Referencia | Situación encontrada | Decisión y resultado |
| --- | --- | --- |
| H1 | Faltaban permisos en los diez módulos nuevos | Asignamos permisos por procedimiento a cada rol SQL. Las cuentas de la API siguen sin tener `db_owner` |
| H2 | Tres importaciones no coincidían en mayúsculas con el nombre real del archivo | Unificamos los nombres para que las rutas sean las mismas en cualquier equipo |
| H3 | Enviar `null` conservaba algunos valores que queríamos borrar | Distinguimos campos omitidos de campos que deben quedar vacíos, tanto en la API como en los procedimientos |
| H4 | Algunas entradas inválidas llegaban a SQL; una fecha inexistente se convertía en otra | Compartimos las validaciones del lote A y agregamos pruebas para fechas, cantidades, textos, IDs y cambios sin campos |
| H5 | Un empleado podía indicar otro empleado en un movimiento | Tomamos su identidad de la sesión y reservamos esa selección al administrador |
| H6 | Había rutas de herramientas incorrectas y faltaban elementos para recrear el entorno | Corregimos las rutas, incluimos secuencia y permisos en la exportación y escribimos la guía de instalación |
| H7 | Las guías seguían describiendo el avance del 29 de octubre | Actualizamos la documentación con el estado actual y una explicación más directa de nuestras decisiones |
| H8 | npm señalaba dos dependencias transitivas afectadas por un aviso de seguridad | Actualizamos las dependencias y la comprobación terminó con cero vulnerabilidades reportadas |

## Cómo comprobamos los cambios

Las **45 pruebas locales** terminaron correctamente. Incluyen los casos que provocaron los ajustes y las comprobaciones anteriores de usuarios, sesiones y negocio.

Después ejecutamos `npm run test:integration` contra SQL Server. Primero restauramos la exportación con sus datos en una base temporal y verificamos las 23 tablas. En otra copia vacía recorrimos las **92 operaciones CRUD**, comprobando que los cambios y borrados quedaran guardados como esperábamos.

También revisamos el login, la separación entre dos clientes, los costos internos que no debe ver el cliente, los campos vacíos y las fechas. Comprobamos los totales, el rechazo de operaciones sin existencias y la conservación de los datos cuando una relación no es válida. En una prueba con dos ventas simultáneas solo una consumió las existencias disponibles.

Las copias temporales se eliminaron al terminar. Los registros de negocio de la base compartida no se usaron para estas escrituras. En esa base únicamente aplicamos los permisos y las nuevas definiciones de los cinco procedimientos que necesitaban admitir campos vacíos. Conservamos las definiciones anteriores en el respaldo local de la revisión.

El validador de dependencias ya encuentra sus archivos y termina correctamente. La comprobación del CLR acepta una contraseña ficticia correcta y rechaza una distinta.

## Resultado del cierre

Los problemas encontrados en esta revisión quedaron atendidos y el ensayo de funcionamiento terminó correctamente. El estado de cada requisito está en [Estado del proyecto](ESTADO_PROYECTO.md).

La recreación se probó dentro de la misma instancia SQL Server. Para instalar en otro servidor debemos preparar sus logins y el componente CLR como indica [la guía de instalación](INSTALACION_SQL.md). Las pruebas no sustituyen la demostración en clase ni significan que ya se haya realizado la entrega en Teams.
