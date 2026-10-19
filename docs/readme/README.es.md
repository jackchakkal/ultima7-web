# Ultima VII Web

[English](../../README.md) · [Português do Brasil](README.pt-BR.md) · **Español**

*Ultima VII: The Black Gate* con *Forge of Virtue*, funcionando en el navegador con su motor original compilado a WebAssembly. Abre la página y juega: no hay nada que instalar, ni emulador, ni archivos que aportar.

**Jugar:** <https://ultimavii.vercel.app>

El objetivo del proyecto es que el juego funcione bien en línea. Arranca rápido, va fluido en ordenador y en móvil, se ve nítido en las pantallas actuales y nunca pierde tu progreso. Las traducciones salen del mismo trabajo: con un motor limpio y portable, añadir idiomas nuevos es fácil.

## Contenido

- [Rendimiento](#rendimiento)
- [Imagen y sonido](#imagen-y-sonido)
- [Partidas guardadas](#partidas-guardadas)
- [Controles](#controles)
- [Idiomas](#idiomas)
- [Privacidad y seguridad](#privacidad-y-seguridad)
- [Ejecutar y compilar](#ejecutar-y-compilar)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Cómo colaborar](#cómo-colaborar)
- [Agradecimientos y referencias](#agradecimientos-y-referencias)
- [Licencias](#licencias)
- [Aviso legal](#aviso-legal)

## Rendimiento

- **Motor nativo, sin emulación.** El código C/C++ de [Kitrinx/Ultima7_Decomp](https://github.com/Kitrinx/Ultima7_Decomp) se compila con Emscripten. El juego corre en un módulo WebAssembly de 4 MB, no dentro de un emulador de DOS.
- **Una sola descarga verificada.** Los 193 recursos del juego vienen en un paquete de 17,4 MiB, comprobado con SHA-256 y guardado en la caché del navegador. Desde la segunda visita, el juego arranca desde la caché.
- **Caché de larga duración.** El motor, los retratos y las imágenes del inventario tienen direcciones con la versión y se sirven como inmutables. Una versión nueva descarga solo lo que ha cambiado.
- **Imágenes listas antes de hacer falta.**
  - Las figuras y los botones del inventario se descargan y decodifican mientras carga el juego, así que el primer inventario ya se abre completo. Las figuras se han reducido al mayor tamaño que llega a mostrar la pantalla: 1 MB en total, antes 4,5 MB.
  - Los retratos del Avatar y del grupo se descargan al inicio. Los demás siguen al Avatar: el motor informa de la posición del Avatar y la página descarga los retratos de quienes viven o trabajan cerca, según las rutinas de cada personaje.
- **Poca memoria.**
  - La música se reproduce en streaming con un único elemento de audio.
  - Los efectos se decodifican bajo demanda en una caché pequeña.
  - El motor arranca con 64 MB de memoria.
- **Móviles.** Controles táctiles, pantalla en horizontal y juego a ventana completa. La cabecera de la página se oculta durante la partida.

## Imagen y sonido

- **Opciones de vídeo de Exult**, con el propio código de Exult compilado en el motor:
  - 14 filtros de escalado: Point, Interlaced, Bilinear, BilinearPlus, 2xSaI, SuperEagle, Super2xSaI, Scale2x, Hq2x/3x/4x y 2xBR/3xBR/4xBR.
  - Factor del filtro y ajuste final.
  - Ajustar, centrar o estirar.
  - 8:5 o 4:3.
  - Gamma por canal.
  - Fundidos en el juego y color del borde.
- **Texto en alta resolución.**
  - Las conversaciones, los libros y los pergaminos los dibuja el navegador a la resolución de la pantalla, pero cada frase y cada respuesta siguen decididas por la lógica del juego.
  - Los carteles conservan sus runas, con la transcripción en letras latinas debajo.
- **Inventario en alta resolución.**
  - El panel de cada personaje se ha repintado al estilo de los retratos.
  - Las líneas de las ranuras apuntan al cuerpo.
  - Los botones se han redibujado.
  - Los objetos, las bolsas abiertas y el cursor siguen encima, y la noche oscurece el panel como el resto del mundo.
- **Retratos redibujados** de todos los personajes.
- **Sonido.**
  - Música: síntesis OPL original, grabaciones de Roland MT-32 de Simon Quinn o el remix de JD Harding.
  - Efectos: OPL, el paquete SoundBlaster de Joseph Morris o el paquete MT-32 de Simon Quinn.

Valores por defecto: música de JD Harding, efectos SoundBlaster, volumen al 60 %, filtro Point en 8:5 y retrato automático del Avatar.

## Partidas guardadas

- **Continuar el viaje** reanuda el último guardado. **Cargar partida** muestra todas las partidas guardadas y abre cualquiera de ellas.
- El progreso se guarda en el navegador y no depende de la versión del sitio; las actualizaciones nunca lo borran.
- **Para llevar el progreso a otro navegador o dispositivo:**
  - **Descargar progreso (.u7save)** crea un archivo con todas las partidas, en todos los idiomas; **Abrir archivo .u7save** lo restaura.
  - Un **código de recuperación**, como `ABCD-EFGH-JKMN`, guarda ese mismo archivo en el servidor; escribe el código en el otro dispositivo. A partir de ahí, cada guardado actualiza el mismo código.
- El menú de guardar dentro del juego (`S`) tiene diez ranuras con nombre, guardar y cargar, descarga del archivo, códigos de recuperación e importación desde otro navegador.

## Controles

| Acción | Ratón y teclado | Táctil |
|---|---|---|
| Caminar | Mantén pulsado el botón derecho | Mantén pulsado (el Avatar sigue tu dedo) |
| Hablar, usar, abrir | Doble clic | Doble toque |
| Mover un objeto | Arrastra | Arrastra |
| Inventario | `I` | Botón Inventario |
| Menú de guardar | `S` | Botón Guardar |
| Cargar partida guardada | Botón Cargar | Botón Cargar |

Las respuestas y **Continuar** son botones en el panel de lectura. En **Lectura** eliges la posición de los diálogos, la fuente, el tamaño y el contraste. **Conversaciones** muestra el historial de esta sesión.

## Idiomas

Cada idioma guarda sus propias partidas. Elige el idioma en la cabecera de la página o abre `?lang=<código>`.

| Idioma | Código | Estado | Origen |
|---|---|---|---|
| English | `en` | Jugable | Juego original |
| Português do Brasil | `pt-BR` | Jugable | Este proyecto |
| Español | `es` | Jugable | Importado de la Final V1 de L@Zar0 / Clan DLAN |
| Italiano | `it` | Previsto | — |
| Русский | `ru` | Previsto | — |

Sobre las versiones en portugués y en español:

- **Portugués de Brasil.** Toda la campaña está traducida:
  - 21.182 cadenas en las 1.012 funciones del guion, más los nombres de objetos y los mensajes del motor.
  - Los botones del menú, los subtítulos de la introducción, los créditos, las etiquetas de los paneles y los avisos del cursor se han redibujado con las fuentes del propio juego.
  - El registro es arcaico (*tu/vós*), y cada frase funciona tanto con un Avatar hombre como con una Avatar mujer.
- **Español.** Se importan 21.476 cadenas de la traducción de fans. El bytecode del juego se mantiene byte a byte; solo se reconstruyen las referencias de cadenas y la caché de dependencias.

Cómo añadir un idioma, incluidas las fuentes cirílicas para el ruso, se explica en [docs/ADDING_A_LANGUAGE.md](../ADDING_A_LANGUAGE.md). Los idiomas se registran en `dist/languages.js`.

## Privacidad y seguridad

- **Sin rastreo.** No hay cuentas, cookies, analíticas ni peticiones a terceros: todos los archivos vienen del propio sitio.
- **Tus partidas se quedan contigo.**
  - Las partidas guardadas se conservan en el almacenamiento de tu navegador.
  - No se sube nada salvo que crees un código de recuperación. En ese caso, el servidor guarda solo ese archivo de guardado, bajo un código aleatorio de 60 bits. No se pide ni se guarda ningún nombre, correo ni otro dato personal.
  - Quien tenga el código puede leer y sobrescribir ese guardado, así que no lo compartas.
- **Cabeceras estrictas.**
  - Content-Security-Policy sin scripts incrustados y sin orígenes externos.
  - HSTS, prohibición de enmarcado, `nosniff`, política de referencia estricta, y una Permissions-Policy que desactiva cámara, micrófono, ubicación, pagos y funciones similares.
- **La entrada no fiable tiene límites.**
  - Los archivos y códigos de guardado se comprueban en tamaño y se descomprimen con un tope.
  - Las rutas dentro de un guardado se validan.
  - El servidor solo acepta copias de seguridad auténticas.
  - El traslado del progreso desde la dirección antigua solo acepta ese origen y esa ventana exactos, y pregunta antes de importar.

Informa de vulnerabilidades en privado, como se explica en [SECURITY.md](../../SECURITY.md).

## Ejecutar y compilar

Este repositorio contiene el código, las herramientas y el arte nuevo, pero **ningún dato original del juego**.

**Para ejecutarlo por tu cuenta:**
1. Ten una copia del juego (por ejemplo, *Ultima 7 Complete* en [GOG](https://www.gog.com/en/game/ultima_7_complete)).
2. Empaqueta su carpeta `STATIC/` con `node engine/package-game.mjs <ruta>/STATIC`.
3. Ejecuta `npm start` y abre `http://127.0.0.1:8077`. El servidor local sirve solo `dist/`, como el sitio alojado.

**Requisitos:**
- Node.js 22 o posterior.
- Git, Python 3, CMake y **Emscripten 6.0.12** para compilar el motor.

**Compilar el motor:**

```bash
bash engine/build.sh    # descarga Ultima7_Decomp en el commit 770e21a, aplica la capa del navegador y escribe dist/engine/
```

**Generar los archivos traducidos** (con `U7_GAME_DIR` apuntando a la carpeta que contiene `STATIC/`):

```bash
python engine/build_translation.py   # USECODE a partir de translation-overrides.json
python engine/build_linkdep.py       # LINKDEP1/LINKDEP2
python engine/patch_textflx.py       # TEXT.FLX
python engine/build_menu.py          # botones del menú, introducción, créditos
python engine/build_gumps.py         # etiquetas de los paneles y siluetas del inventario
python engine/build_pointers.py      # avisos del cursor
python engine/check-translation.py   # marcadores, caracteres, palabras clave
```

**Paquetes de audio.** Descarga los paquetes de Black Gate desde la [página de descargas de Exult](https://exult.sourceforge.io/download.html) y ejecuta `python engine/package-audio.py <paquete-exult>.zip <remix-jd-harding>.zip`.

**Comprobaciones:**

```bash
npm run release && npm run check                  # sello de versión y comprobación de archivos (también los ejecuta el alojamiento)
U7_SMOKE_MODE=save node engine/verify-flow.cjs    # juega la apertura, guarda y restaura
```

**Códigos de recuperación.** Los códigos necesitan un [Vercel Blob](https://vercel.com/docs/vercel-blob) conectado al proyecto (`BLOB_READ_WRITE_TOKEN`). Sin él, los archivos de guardado siguen funcionando y la página avisa de que los códigos están desactivados. En local, los códigos se guardan en `.local/saves`.

## Estructura del proyecto

| Ruta | Contenido |
|---|---|
| `dist/` | El sitio: página, estilos, scripts, fuentes, retratos, arte del inventario |
| `dist/languages.js` | Registro de idiomas |
| `api/save.js`, `lib/save-codes.js` | Función de los códigos de recuperación |
| `engine/` | Capa del navegador para el motor (`browser.c`, `prepare.py`, `CMakeLists.txt`), filtros de Exult, scripts de compilación y de prueba |
| `engine/build_*.py` | Herramientas que generan los archivos traducidos del juego |
| `translation-overrides.json` | Catálogo del guion en portugués (`FUNCIÓN:índice` → texto) |
| `translations/` | Glosario, guía de estilo, catálogo y licencia del español, tablas de los paneles y del cursor |
| `docs/` | Cómo añadir un idioma; este README en otros idiomas |

## Cómo colaborar

Los informes de errores, las correcciones, las pruebas de juego y los idiomas nuevos son bienvenidos; consulta [CONTRIBUTING.md](../../CONTRIBUTING.md). En los informes de traducción, indica la clave `FUNCIÓN:índice` del catálogo si la conoces.

## Agradecimientos y referencias

**Motor y herramientas**
- [Kitrinx/Ultima7_Decomp](https://github.com/Kitrinx/Ultima7_Decomp): el motor descompilado sobre el que se construye esta versión.
- [Exult](https://github.com/exult/exult): los filtros de imagen, la tabla de opcodes del usecode y décadas de conocimiento sobre los formatos de archivo.
- [Nuked OPL3](https://github.com/nukeykt/Nuked-OPL3), de Nuke.YKT: síntesis AdLib.

**Música y sonido** (paquetes distribuidos por [Exult](https://exult.sourceforge.io/download.html))
- Simon Quinn: música y efectos de Roland MT-32 en grabación digital.
- Joseph Morris: efectos SoundBlaster.
- JD Harding: el remix de la banda sonora.

**Fuentes**
- [Source Serif 4](https://github.com/adobe-fonts/source-serif) e [Inter](https://github.com/rsms/inter), bajo la SIL Open Font License.

**Traducciones de Ultima VII**

Estas son las traducciones que conocemos. Son las referencias para los próximos idiomas del proyecto. No se incluye ningún archivo suyo, salvo el de la traducción española, que se usa bajo su licencia GPL. Hay más detalles en la [lista de traducciones de Ultima Codex](https://wiki.ultimacodex.com/wiki/Translations_of_Ultima_VII).

- **Español:**
  - *Final V1* (2017), de **L@Zar0 / Clan DLAN**, que abarca *The Black Gate* y *Forge of Virtue*. Importada en este proyecto, bajo GPL-3.0; créditos en `translations/LEEME-es.txt`. También sirvió de referencia de sentido para el portugués.
  - Una traducción de fans anterior, con *Forge of Virtue*, del **grupo de Dantoine**.
- **Italiano:**
  - *Il Portale Oscuro* y *La Forgia della Virtù* (2009), del **Babylon Team** de OldGamesItalia, coordinada por **The Ancient One**, con revisión final de **Ragfox**.
  - Texto, gráficos y voces, para Exult.
  - Consulta la [página en Ultima Codex](https://wiki.ultimacodex.com/wiki/Ultima_VII_in_Italiano).
- **Ruso:**
  - Una traducción de fans de **Sleepy Emp & Quester** para Exult, listada en [PCGamingWiki](https://www.pcgamingwiki.com/wiki/Ultima_VII:_The_Black_Gate).
  - Reunida con otros mods en la [discusión de traducciones de Exult](https://github.com/exult/exult/discussions/260).
- **Alemán:**
  - La edición oficial alemana de Origin (solo en disquetes).
  - El parche de fans [*Ultima VII auf Deutsch*](https://wiki.ultimacodex.com/wiki/Ultima_VII_auf_Deutsch), de **Sir John**, que abarca *Forge of Virtue*, los gráficos y las voces.

Si hiciste una de estas traducciones o conoces otra, abre una *issue*. Corregiremos o añadiremos el crédito con gusto, y pediremos permiso antes de importar nada.

**Origin Systems y Richard Garriott** crearon el juego. Este proyecto existe por cariño hacia él.

## Licencias

- **Nuestro código** (`dist/*.js`, `dist/*.html`, `dist/*.css`, `api/`, `lib/`, los scripts de `engine/` y la capa del navegador): [GPL-3.0-or-later](../../LICENSE).
- **Nuestro arte** (retratos redibujados, figuras e iconos del inventario): [CC BY-SA 4.0](../../LICENSE-ART.md).
- **Las partes de terceros** conservan sus propias licencias; consulta [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md).
  - Filtros y tabla de opcodes de Exult: GPL-2.0-or-later.
  - Código nuevo de Ultima7_Decomp: MIT. Su código descompilado del juego sigue siendo propiedad de Electronic Arts; se descarga al compilar y no se guarda aquí.
  - Nuked OPL3: LGPL-2.1.
  - Traducción española: GPL-3.0.
  - Fuentes: OFL-1.1.

## Aviso legal

Este es un proyecto de fans sin fines comerciales. No está vinculado a Electronic Arts ni cuenta con su respaldo. *Ultima* es una marca registrada de Electronic Arts. El juego, sus datos, textos y arte original pertenecen a Electronic Arts y conservan sus licencias.

Este repositorio no contiene ningún archivo original del juego. La versión alojada los proporciona para que el juego funcione sin preparación; se retirarán a petición del titular de los derechos. Si te gusta el juego, cómpralo en [GOG](https://www.gog.com/en/game/ultima_7_complete).
