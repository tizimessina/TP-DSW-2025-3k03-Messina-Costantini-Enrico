# Auditoría de coherencia del negocio

Relevamiento completo del sistema anterior (13 módulos del backend, `core/*`, schema Prisma y sus dos
migraciones, seed, las 21 páginas del front, capa de API, tests, CI y deploy) buscando incoherencias
entre **lo que el negocio dice que pasa** y **lo que el código realmente hace**.

Salieron **53 hallazgos**, que se suman a los 14 que ya habíamos detectado a ojo (vocabulario
equivocado, insumos propios cobrados, falta de cancelación, cercanía por domicilio del usuario, etc.).
Todos se resolvieron en la tercera etapa: PR #11 (`refactor/dominio`), PR #12 (`feat/ui-v2`) y
PR #13 (`docs/coherencia`).

Leyenda de severidad: **GRAVE** = rompe o falsea el negocio; **MEDIA** = deja datos o respuestas
inconsistentes; **LEVE** = calidad, accesibilidad o mantenimiento.

---

## GRAVE

### 1. El comprador fijaba el precio de los insumos del vendedor

**Estaba mal:** el front mandaba `precio_unit` de cada insumo y el servidor lo multiplicaba tal cual.
Un productor podía pedir 500 litros de gasoil a $1 y el total quedaba firme en la base.

**Por qué hubo que cambiarlo:** el precio de lo que aporta el contratista no puede depender de quien
paga; es una regla de negocio, no un dato de formulario.

**Cómo quedó:** el precio sale siempre del catálogo (`insumo.precio_referencia`) y se guarda como
snapshot en la solicitud. Además, los insumos que aporta el productor se registran pero no se cobran.

**Ventaja:** los importes son auditables y no manipulables desde el cliente.

### 2. Se mostraba un precio distinto del que se iba a cobrar

**Estaba mal:** el listado y el detalle de servicio traían el último precio por fecha descendente,
incluyendo precios con fecha futura, y la UI lo rotulaba "precio vigente". El cobro, en cambio, usaba
el último precio con fecha menor o igual a hoy.

**Por qué hubo que cambiarlo:** publicar un precio y cobrar otro es engañoso y rompe la confianza en el
catálogo.

**Cómo quedó:** una única definición de vigente aplicada en listado, detalle y cálculo.

**Ventaja:** el precio que ve el productor es el que se le cobra, siempre.

### 3. Un servicio publicado de noche nacía sin precio

**Estaba mal:** el precio inicial se creaba con la fecha y hora actuales sobre una columna de tipo
fecha. Después de las 21 de Argentina la fecha en horario universal ya es la del día siguiente, así que
el precio quedaba con fecha futura y el servicio respondía "sin precio vigente" hasta el otro día.

**Por qué hubo que cambiarlo:** un error que aparece solo a ciertas horas es imposible de explicar y
bloquea el alta de servicios.

**Cómo quedó:** un helper de fechas civiles construye el día sin desfase de zona horaria, usado en todo
el sistema.

**Ventaja:** el comportamiento es idéntico a cualquier hora del día.

### 4. Los permisos viajaban dentro del token y no se revalidaban

**Estaba mal:** los roles se firmaban dentro del token, con ocho horas de vida. Si un administrador le
quitaba un rol a alguien, esa persona conservaba los permisos hasta que el token venciera.

**Por qué hubo que cambiarlo:** revocar un permiso tiene que tener efecto inmediato.

**Cómo quedó:** el token lleva solo el identificador del usuario. El middleware de autenticación
resuelve los roles contra la base en cada petición y rechaza usuarios eliminados.

**Ventaja:** un cambio de rol impacta en la petición siguiente.

### 5. Editar un usuario podía dejarlo a medio actualizar con un mensaje falso

**Estaba mal:** primero se confirmaba la actualización y después se sincronizaban los perfiles. Si el
usuario tenía campos o servicios, el borrado del perfil disparaba un error de clave foránea que se
traducía como "Localidad inexistente", con el usuario ya modificado y roles que no coincidían con sus
perfiles.

**Por qué hubo que cambiarlo:** dejaba datos inconsistentes y además mentía sobre la causa del error.

**Cómo quedó:** roles y perfiles se sincronizan dentro de la misma transacción, con chequeo previo de
dependencias y un conflicto explícito cuando el usuario está en uso.

**Ventaja:** o se aplica todo o no se aplica nada, y el mensaje dice la verdad.

### 6. Borrar una localidad dejaba usuarios sin ubicación, en silencio

**Estaba mal:** la clave foránea estaba definida para anular la referencia al borrar, así que eliminar
una localidad vaciaba el domicilio de todos sus usuarios sin ningún aviso. Provincia sí tenía la
protección, localidad no.

**Por qué hubo que cambiarlo:** una baja de catálogo no puede corromper datos de personas.

**Cómo quedó:** se cuentan los usuarios y campos asociados y se devuelve un conflicto si hay
dependencias.

**Ventaja:** criterio uniforme en todos los catálogos del sistema.

### 7. Se podía mudar una localidad de provincia

**Estaba mal:** el esquema de modificación era idéntico al de alta, así que una modificación podía
cambiar la provincia de una localidad. Todos sus usuarios cambiaban de provincia y el filtro por
cercanía empezaba a mentir.

**Por qué hubo que cambiarlo:** la pertenencia de una localidad a una provincia es un hecho, no un
campo editable.

**Cómo quedó:** la provincia es inmutable en la modificación.

**Ventaja:** la jerarquía geográfica no se puede falsear desde la interfaz de administración.

### 8. El correo y el domicilio de los usuarios eran públicos

**Estaba mal:** la proyección pública de usuario incluía correo y domicilio, y los listados de servicios
y de prestadores eran abiertos. Cualquier visitante anónimo podía recolectar los datos de contacto.

**Por qué hubo que cambiarlo:** es dato personal y no hace falta para elegir un contratista.

**Cómo quedó:** dos proyecciones separadas. La pública no trae contacto. La de contacto se usa solo
entre las dos partes de una solicitud.

**Ventaja:** el contacto se entrega cuando existe una relación comercial, no antes.

### 9. Trabajos terminados sin fecha de inicio, y fechas al revés

**Estaba mal:** la validación de coherencia de fechas existía solo en el alta. Al cambiar de estado, la
fecha de fin podía ser anterior a la de inicio, y marcar "completada" ponía fecha de fin aunque el
inicio siguiera vacío.

**Por qué hubo que cambiarlo:** un trabajo terminado que nunca empezó no es un dato defendible.

**Cómo quedó:** al aceptar se fija la fecha de inicio, al completar la de fin, y la coherencia se valida
también en cada transición de estado.

**Ventaja:** toda solicitud completada tiene una línea de tiempo consistente.

### 10. Dos fuentes de verdad contradictorias sobre quién es cliente

**Estaba mal:** los módulos de cliente, prestamista y administrador creaban perfiles uno a uno sin tocar
los roles, mientras que la edición de usuario borraba cualquier perfil cuyo rol faltara. Un perfil creado
por un lado desaparecía en la siguiente edición.

**Por qué hubo que cambiarlo:** el mismo concepto no puede vivir en dos lugares que se pisan entre sí.

**Cómo quedó:** se eliminaron esos CRUD. El perfil es consecuencia del rol y se sincroniza en un único
lugar.

**Ventaja:** un solo camino para asignar roles, sin registros fantasma.

### 11. Borrar un perfil con servicios devolvía un error genérico del servidor

**Estaba mal:** el borrado de perfiles no capturaba el error de clave foránea, así que salía un 500 sin
explicación.

**Por qué hubo que cambiarlo:** un error del servidor no le dice nada al usuario ni a quien mantiene el
sistema.

**Cómo quedó:** el caso desapareció junto con los CRUD de perfil, y las bajas que sí existen devuelven un
conflicto con código estable.

**Ventaja:** errores esperables, con código que el front puede interpretar.

### 12. Las restricciones prometidas en el modelo no existían en la base

**Estaba mal:** el esquema comentaba que esas tablas tenían restricciones de control, pero la migración
generada no creaba ninguna. Una base levantada desde cero no protegía contra hectáreas o precios
negativos.

**Por qué hubo que cambiarlo:** la integridad no puede depender de que la aplicación se acuerde de
validar.

**Cómo quedó:** la migración única incluye diez restricciones reales: hectáreas mayores a cero, rangos
válidos de latitud y longitud, precios positivos, cantidades positivas, puntaje entre uno y cinco, y
fecha de fin posterior a la de inicio.

**Ventaja:** la base rechaza datos imposibles aunque se escriba desde fuera de la aplicación.

### 13. El contratista no podía ver el campo donde tenía que trabajar

**Estaba mal:** el detalle de la solicitud enlazaba al campo, pero ese recurso era accesible solo para
el cliente dueño o el administrador. El prestador asignado recibía un error de permisos.

**Por qué hubo que cambiarlo:** necesita la ubicación y las hectáreas justamente para hacer el trabajo.

**Cómo quedó:** el contratista con una solicitud sobre ese campo puede leerlo, y solo ve las solicitudes
que le corresponden.

**Ventaja:** el flujo operativo se completa dentro del sistema, sin pedir datos por fuera.

---

## MEDIA

### 14. Sin paginación en ningún listado relevante

**Estaba mal:** servicios, solicitudes, usuarios, localidades y prestadores devolvían todo, con
relaciones anidadas profundas y sin total, así que ni siquiera se podía dibujar un paginador.

**Por qué hubo que cambiarlo:** no escala y la cátedra pide listados usables.

**Cómo quedó:** contrato uniforme con elementos, total, página, tamaño y cantidad de páginas.

**Ventaja:** respuestas acotadas y un paginador real en la interfaz.

### 15. Las rutas inexistentes devolvían HTML

**Estaba mal:** no había manejador final para rutas desconocidas, así que una dirección equivocada
devolvía la página de error del framework en lugar de datos.

**Por qué hubo que cambiarlo:** un cliente que espera datos estructurados se rompe al recibir HTML.

**Cómo quedó:** manejador final que responde con el mismo formato de error que el resto.

**Ventaja:** el contrato de error es único para todos los casos.

### 16. Un recurso no encontrado devolvía error del servidor

**Estaba mal:** el módulo de categorías lanzaba un error sin código de estado, que el middleware
interpretaba como falla interna.

**Por qué hubo que cambiarlo:** "no existe" es un 404, no una falla del sistema.

**Cómo quedó:** un juego de helpers de error usado por todos los módulos.

**Ventaja:** códigos de estado correctos y consistentes.

### 17. Dos módulos rompían el contrato de códigos de error

**Estaba mal:** insumos y categorías lanzaban errores con estado pero sin código, así que el front
recibía un código genérico y no podía distinguir un caso de otro.

**Por qué hubo que cambiarlo:** el front elige los mensajes según el código.

**Cómo quedó:** todos los errores respetan el mismo formato de código, mensaje y detalle.

**Ventaja:** mensajes específicos en la interfaz sin tener que interpretar texto libre.

### 18. Importaciones con extensión equivocada

**Estaba mal:** dos módulos importaban con extensión de código fuente en un proyecto donde la
convención es la extensión compilada. Funcionaba solo porque eran importaciones de tipos.

**Por qué hubo que cambiarlo:** si alguien convertía esa importación en valor, la compilación fallaba.

**Cómo quedó:** convención única en todo el backend.

**Ventaja:** una sola regla, sin excepciones que memorizar.

### 19. Parámetros de URL sin validar tumbaban el servidor

**Estaba mal:** varios controladores convertían el identificador directamente a número grande. Un
identificador no numérico lanzaba un error de sintaxis y devolvía error del servidor.

**Por qué hubo que cambiarlo:** una dirección mal escrita no puede tumbar un recurso.

**Cómo quedó:** todos los parámetros de ruta y de consulta pasan por validación.

**Ventaja:** respuesta de petición inválida con mensaje claro, en lugar de un 500.

### 20. El filtro por rol aceptaba cualquier texto

**Estaba mal:** el parámetro de rol se tomaba como texto libre, así que un error de tipeo devolvía una
lista vacía en vez de un error.

**Por qué hubo que cambiarlo:** "no hay resultados" y "parámetro inválido" son cosas distintas.

**Cómo quedó:** validado contra la enumeración de roles.

**Ventaja:** quien consume la API se entera de su propio error.

### 21. Parámetros de consulta sin tipo llegaban hasta la capa de datos

**Estaba mal:** el parámetro de búsqueda se pasaba forzando el tipo. Una consulta con sintaxis de
arreglo entregaba un objeto directamente al filtro de la base.

**Por qué hubo que cambiarlo:** es una vía para inyectar estructuras no previstas en la consulta.

**Cómo quedó:** validado como texto.

**Ventaja:** la capa de datos solo recibe los tipos que espera.

### 22. Código muerto de paginación

**Estaba mal:** los repositorios de insumos y categorías implementaban página y tamaño, pero los
servicios nunca se los pasaban.

**Por qué hubo que cambiarlo:** código que aparenta una funcionalidad que en realidad no existe.

**Cómo quedó:** la paginación se conectó de punta a punta donde corresponde.

**Ventaja:** lo que está escrito es lo que se ejecuta.

### 23. Alta de usuario fuera de transacción

**Estaba mal:** la sincronización de perfiles corría fuera de la transacción del alta. Si fallaba,
quedaba un usuario con roles y sin perfil, y la respuesta de creación ya se había armado con la fila
previa.

**Por qué hubo que cambiarlo:** el mismo problema del hallazgo 5, pero del lado del alta.

**Cómo quedó:** todo dentro de una transacción.

**Ventaja:** no existen usuarios a medio crear.

### 24. La columna de auditoría nunca se actualizaba

**Estaba mal:** la fecha de última modificación del usuario tenía valor por defecto y nadie la escribía
al modificar.

**Por qué hubo que cambiarlo:** una columna de auditoría que no audita es peor que no tenerla, porque
induce a error.

**Cómo quedó:** la gestiona el ORM automáticamente.

**Ventaja:** se sabe cuándo se tocó cada usuario.

### 25. El CUIT estaba guardado dos veces y sin validar

**Estaba mal:** vivía en el usuario y otra vez en cada perfil, sin unicidad ni control de formato. El
seed escribía los dos y la edición de perfil actualizaba uno solo.

**Por qué hubo que cambiarlo:** duplicar un identificador garantiza que en algún momento las dos copias
difieran.

**Cómo quedó:** una sola columna, única, validada con expresión regular.

**Ventaja:** el CUIT identifica de verdad y no se puede repetir entre usuarios.

### 26. El mismo insumo se podía cobrar varias veces

**Estaba mal:** no había unicidad por solicitud e insumo, y el servicio no eliminaba duplicados.

**Por qué hubo que cambiarlo:** infla el total sin que se note en el detalle.

**Cómo quedó:** unicidad en la base más un tope de insumos por solicitud.

**Ventaja:** el detalle de costos es fiel a lo que se cobra.

### 27. Fechas de precio sin límite y etiqueta "actual" equivocada

**Estaba mal:** se podía cargar un precio con cualquier fecha, pasada o futura, y la pantalla marcaba
como actual la primera fila aunque tuviera fecha futura, contradiciendo su propio subtítulo.

**Por qué hubo que cambiarlo:** la pantalla se contradecía a sí misma.

**Cómo quedó:** rango permitido de un año hacia atrás y uno hacia adelante, y el vigente se calcula como
el último con fecha menor o igual a hoy.

**Ventaja:** el historial de precios se lee sin ambigüedad.

### 28. Un error de carga se veía como "no hay datos"

**Estaba mal:** la pantalla de precios nunca mostraba el estado de error, solo cargando y vacío.

**Por qué hubo que cambiarlo:** el usuario creía que el servicio no tenía precios cuando en realidad
había fallado la petición.

**Cómo quedó:** todas las pantallas tienen las tres ramas: cargando, error y vacío.

**Ventaja:** el usuario sabe si tiene que reintentar o si realmente no hay nada.

### 29. Se podía achicar un campo por debajo de lo ya comprometido

**Estaba mal:** el control de hectáreas existía al crear la solicitud, pero no al editar el campo.

**Por qué hubo que cambiarlo:** dejaba solicitudes activas trabajando más hectáreas de las que el campo
declaraba tener.

**Cómo quedó:** conflicto con el mínimo permitido explicado en el mensaje.

**Ventaja:** el histórico nunca se vuelve imposible.

### 30. Los campos no tenían nombre y se identificaban por coordenadas

**Estaba mal:** la validación aceptaba un nombre pero la columna no existía y el servicio lo descartaba
en silencio. En los listados los campos aparecían como pares de coordenadas.

**Por qué hubo que cambiarlo:** nadie llama a su lote por su latitud, y la entrada descartada en
silencio es el peor tipo de error.

**Cómo quedó:** nombre obligatorio, localidad obligatoria y coordenadas opcionales con mapa.

**Ventaja:** listados legibles y búsqueda por nombre.

### 31. Un servicio no se podía dar de baja nunca

**Estaba mal:** cualquier servicio con solicitudes quedaba imposible de borrar y no existía un estado de
activo o inactivo, así que seguía en el catálogo público para siempre.

**Por qué hubo que cambiarlo:** un contratista que dejó de ofrecer algo necesita retirarlo sin perder el
historial de trabajos.

**Cómo quedó:** baja lógica. El catálogo muestra solo los activos y el dueño puede reactivar.

**Ventaja:** el catálogo refleja la oferta real y las solicitudes viejas se conservan.

### 32. Un administrador podía dejarse afuera del sistema

**Estaba mal:** borrarse la propia cuenta estaba bloqueado, pero quitarse el rol de administrador no. El
último administrador podía perder el acceso sin forma de recuperarlo.

**Por qué hubo que cambiarlo:** no hay ningún proceso de recuperación fuera de tocar la base a mano.

**Cómo quedó:** guarda de último administrador, tanto para quitar el rol como para borrar la cuenta.

**Ventaja:** el sistema siempre conserva al menos un administrador.

### 33. Límite de peticiones solo en el inicio de sesión

**Estaba mal:** el límite cubría inicio de sesión y registro, pero no el resto de la API.

**Por qué hubo que cambiarlo:** las rutas de escritura y el catálogo público quedaban expuestos a abuso.

**Cómo quedó:** límite global suave más el específico de autenticación, activos solo en producción para
no entorpecer el desarrollo ni los tests.

**Ventaja:** protección real sin romper el entorno local.

### 34. Solicitudes con miles de insumos

**Estaba mal:** el arreglo de insumos no tenía máximo. Lo único que lo frenaba era el límite de tamaño
del cuerpo de la petición.

**Por qué hubo que cambiarlo:** una solicitud con miles de líneas no tiene sentido de negocio.

**Cómo quedó:** tope de veinte insumos, sin repetidos.

**Ventaja:** límites explícitos y fáciles de justificar.

### 35. Recursos duplicados y sin consumidor

**Estaba mal:** dos rutas duplicaban la de usuarios, y la consulta de precios sin parámetro devolvía una
lista vacía en lugar de un error de petición inválida.

**Por qué hubo que cambiarlo:** superficie de API que nadie usa y que igual hay que mantener, documentar
y proteger.

**Cómo quedó:** se eliminaron esas rutas. Los precios se consultan siempre por servicio.

**Ventaja:** una API más chica, toda documentada en Swagger y toda efectivamente en uso.

### 36. El alta de campo como administrador fallaba siempre

**Estaba mal:** el formulario nunca enviaba el dueño del campo, así que un administrador sin el rol de
cliente recibía un error de petición inválida sin explicación.

**Por qué hubo que cambiarlo:** el error no decía qué faltaba.

**Cómo quedó:** el backend acepta el productor explícito cuando lo envía un administrador, deriva el
dueño del token cuando es un productor, y el código de error nombra exactamente lo que falta. El panel
de administración lista los campos de todos los productores.

**Ventaja:** el caso queda cerrado con un mensaje que se entiende.

### 37. El código postal no se podía borrar

**Estaba mal:** vaciar el campo del formulario enviaba un valor indefinido y el backend conservaba el
valor anterior.

**Por qué hubo que cambiarlo:** no había forma de corregir un dato cargado por error.

**Cómo quedó:** se envía un nulo explícito y el backend lo interpreta como limpiar.

**Ventaja:** los campos opcionales se pueden vaciar de verdad.

### 38. Las tablas de ejemplo del framework seguían en producción

**Estaba mal:** la primera migración creaba las tablas de ejemplo de la plantilla y nadie las borraba,
así que existían en la base local, en la de integración continua y en la de producción.

**Por qué hubo que cambiarlo:** ensucia el modelo y confunde a cualquiera que mire la base o el
diagrama.

**Cómo quedó:** una migración única que define el modelo nuevo y nada más.

**Ventaja:** la base coincide exactamente con el diagrama del informe.

---

## LEVE

### 39. Mensajes con el género equivocado

**Estaba mal:** la pantalla genérica de catálogos decía "Insumo creada", "Insumo eliminada".

**Cómo quedó:** el género y el artículo se pasan como propiedades a la pantalla genérica.

**Ventaja:** los textos suenan bien en todas las entidades que la reutilizan.

### 40. Pantalla muda para contratistas y administradores

**Estaba mal:** en el detalle de servicio, el aviso de "ingresá para solicitar" aparecía solo a
visitantes anónimos. Un contratista con sesión iniciada no veía nada donde debía estar el botón.

**Cómo quedó:** mensaje explicativo según el rol de quien mira.

**Ventaja:** ninguna pantalla queda sin explicar por qué falta una acción.

### 41. Seis funciones de la capa de API sin usar

**Estaba mal:** había funciones exportadas que ningún componente importaba, entre ellas la del precio
vigente, que dejaba un recurso del backend sin ningún cliente.

**Cómo quedó:** capa de API reescrita y agrupada por recurso, con lo que efectivamente se usa.

**Ventaja:** menos código que mantener y ninguna función que aparente una integración inexistente.

### 42. Middleware exportado y nunca montado

**Estaba mal:** el middleware de autenticación opcional existía pero no estaba montado en ningún lado.

**Cómo quedó:** se usa en el catálogo de servicios, que responde distinto según haya sesión o no.

**Ventaja:** un mismo recurso sirve a visitantes y a usuarios con sesión, sin duplicar rutas.

### 43. El lint cubría solo la mitad del proyecto

**Estaba mal:** el backend no tenía ni configuración ni tarea de lint, así que la tarea del monorepo solo
miraba el front y la configuración de la raíz no se ejecutaba nunca. Al conectarlo apareció un problema
anterior: una restricción de dependencias pedía una versión de la librería de validación de esquemas que
no existe en la serie instalada, se resolvía a una versión mayor incompatible y rompía la herramienta de
lint en los dos paquetes.

**Cómo quedó:** configuración y tarea de lint en el backend, restricción corregida al rango correcto y
plugin de reglas de hooks agregado en el front. Backend y front pasan el lint sin errores.

**Ventaja:** la tarea de lint de la integración continua revisa todo el código y, sobre todo, corre.

### 44. Una parte del modo estricto de TypeScript estaba apagada

**Estaba mal:** el backend desactivaba el control de tipos implícitos, anulando parte del modo estricto
que el propio proyecto declaraba usar.

**Cómo quedó:** activado, y la compilación pasa sin errores.

**Ventaja:** el compilador avisa de los tipos implícitos en lugar de dejarlos pasar.

### 45. El parche de serialización vivía fuera de la aplicación

**Estaba mal:** la conversión de identificadores grandes a texto estaba solo en el punto de entrada y
duplicada en los tests, así que los de integración dependían de acordarse de repetirla.

**Cómo quedó:** dentro de la función que construye la aplicación, en un solo lugar.

**Ventaja:** cualquiera que instancie la aplicación obtiene el mismo comportamiento.

### 46. Registros de desarrollo en producción

**Estaba mal:** el registro de peticiones usaba el formato de desarrollo, con colores de terminal,
también en el servidor desplegado.

**Cómo quedó:** formato estándar cuando el entorno es producción.

**Ventaja:** registros legibles y procesables en el panel del proveedor.

### 47. Datos de prueba con fecha fija y claves frágiles

**Estaba mal:** un precio con fecha escrita a mano hacía que, antes de esa fecha, ningún servicio tuviera
precio vigente y fallaran los tests de integración y los de extremo a extremo. Además las localidades se
indexaban solo por nombre, lo que colisiona entre provincias, y una variable quedaba sin usar.

**Cómo quedó:** datos de prueba idempotentes con fechas relativas al día de hoy, claves compuestas y
contenido completo: usuarios de los tres roles, campos con coordenadas reales, servicios con historial de
precios, solicitudes en los cinco estados y valoraciones cargadas.

**Ventaja:** la carga inicial funciona cualquier día y alcanza para mostrar el sistema entero en la
defensa.

### 48. Una petición por cada tecla

**Estaba mal:** el texto de búsqueda era dependencia directa del hook de datos, sin ningún retardo.

**Cómo quedó:** un hook de retardo en todos los buscadores.

**Ventaja:** menos carga en el servidor y una búsqueda que no parpadea mientras se escribe.

### 49. Errores de carga tragados en silencio

**Estaba mal:** si fallaba la carga de localidades, el manejo del error dejaba el selector vacío sin
explicación. Además se traían todas las localidades sin paginar.

**Cómo quedó:** el error se muestra y los selectores se alimentan de recursos acotados.

**Ventaja:** el usuario entiende por qué no puede elegir.

### 50. Cambio de contraseña sin pedir la actual

**Estaba mal:** bastaba con tener la sesión abierta para cambiar la contraseña.

**Por qué importa:** una sesión olvidada en una máquina ajena alcanzaba para quedarse con la cuenta.

**Cómo quedó:** el cambio exige la contraseña actual.

**Ventaja:** una barrera más frente al secuestro de cuentas.

### 51. Datos existentes que el perfil no dejaba editar

**Estaba mal:** el CUIT de los perfiles estaba en la base y la carga inicial lo llenaba, pero la pantalla
de perfil no lo exponía.

**Cómo quedó:** al unificar el CUIT en el usuario (hallazgo 25), el perfil lo edita y lo valida.

**Ventaja:** todo lo que se guarda se puede corregir desde la interfaz.

### 52. El diálogo de confirmación no era accesible

**Estaba mal:** no cerraba con la tecla de escape, no atrapaba el foco dentro del diálogo ni lo devolvía
al cerrarse.

**Cómo quedó:** diálogos construidos sobre una librería accesible.

**Ventaja:** se opera con teclado y con lector de pantalla.

### 53. Orden incorrecto en la declaración de exportaciones del paquete de base de datos

**Estaba mal:** la entrada de tipos figuraba después de la de código. TypeScript exige que los tipos vayan
primero para resolverlos de forma confiable.

**Cómo quedó:** los tipos primero.

**Ventaja:** el paquete compartido resuelve tipos sin depender del orden en que se lea la declaración.

---

## Cómo se verificó

| Verificación | Resultado |
|:-|:-|
| Tests unitarios y de integración del backend | 54 |
| Tests de componente del frontend | 10 |
| Tests de extremo a extremo | 4 |
| Restricciones de control en la migración | 10 |
| Lint de backend y frontend | sin errores |

A eso se suma el recorrido manual con los usuarios de la carga inicial en los tres roles, en 375, 768 y
1280 píxeles de ancho, en modo claro y oscuro, y el flujo completo verificado contra producción.
