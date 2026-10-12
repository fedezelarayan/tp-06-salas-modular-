# Trabajo práctico 06

## Proyecto de partida y cambios

Partí de una copia funcional del TP 05 (reservas de salas de estudio), sin `node_modules` ni `.git`. El TP 05 funcionaba según el contrato de la unidad 5, por lo que no fue necesario repararlo antes de refactorizar.

La refactorización reorganiza el código en módulos sin cambiar el comportamiento visible: mismas vistas EJS, layout, CSS, datos iniciales, Morgan, ID de solicitud, medición de duración, validación del POST y respuestas HTTP.

Único cambio funcional permitido: el puerto y el formato de registro ahora se configuran desde el entorno.

## Instalación y ejecución

```bash
npm install
npm start
```

La app queda en http://localhost:3000. Para verificar formato y análisis estático:

```bash
npm run format
npm run check
```

## Configuración del entorno

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `PORT` | Puerto de escucha (entero entre 1 y 65535) | `3000` |
| `NODE_ENV` | `production` usa Morgan `combined`; cualquier otro valor usa `dev` | `development` |

- `NODE_ENV` solo diferencia el formato del registro de Morgan.
- `npm start` funciona sin `.env`. El archivo `.env.example` es una plantilla con valores no secretos.
- `npm run start:local` usa `node --env-file=.env` y requiere crear un `.env` local, que no se versiona (está en `.gitignore`, igual que `node_modules/`).
- Un `PORT` inválido hace que la app no inicie y muestra un mensaje claro.

Pruebas de puerto (PowerShell):

```powershell
$env:PORT=4000; npm start     # responde en http://localhost:4000
$env:PORT="abc"; npm start    # no inicia, muestra el error
Remove-Item Env:PORT
```

## Mapa de módulos y dependencias

| Archivo | Responsabilidad |
|---|---|
| `src/index.js` | Crea la semilla, el servicio, el controlador, el router y la app; escucha en el puerto |
| `src/configuracion.js` | Convierte y valida `PORT` y `NODE_ENV` |
| `src/app.js` | Configura Express, el pipeline, monta el router y el 404 final |
| `src/rutas/reservas.js` | Relaciona método y camino con middleware y controlador |
| `src/controladores/reservas.js` | Lee parámetros, renderiza, responde JSON, 404 y redirige |
| `src/servicios/reservas.js` | Lista, busca, cuenta y crea reservas en memoria |
| `src/middleware/solicitudes.js` | ID de solicitud y medición de duración |
| `src/middleware/reservas.js` | Sección y validación del formulario |

Dependencias: `index.js` usa `configuracion`, `servicio`, `controlador`, `rutas`, `middleware/solicitudes` y `app`. El servicio no depende de ningún otro módulo.

## Pipeline y contrato de rutas

Pipeline:

```
Morgan -> identificarSolicitud -> medirDuracion -> layouts -> static
 -> urlencoded -> json -> rutas de aplicación -> router /reservas -> 404
```

Como Morgan va antes de `static`, también se registran los pedidos a recursos como `/css/estilos.css`.

| Ruta | Respuesta |
|---|---|
| `GET /` | 200, inicio |
| `GET /estado` | 200, JSON con cantidad e ID |
| `GET /reservas` | 200, listado |
| `GET /reservas/nueva` | 200, formulario |
| `GET /reservas/:id` | 200, o 404 HTML si no existe |
| `POST /reservas` | 302 si es válido, 400 si es inválido |
| `GET /css/estilos.css` | 200 la primera vez, 304 con caché del navegador |
| Otra URL | 404 HTML |

## Matriz antes/después

Los logs de evidencia corresponden a la versión modular. La versión original dio los mismos códigos de estado.

| Caso | Antes (TP 05) | Después | Evidencia |
|---|---|---|---|
| Inicio | 200 | 200 | `[BIB-0001] GET / 200 - 9ms` |
| `/estado` | 200 | 200 | `[BIB-0002] GET /estado 200 - 1ms` |
| Listado | 200 | 200 | `[BIB-0003] GET /reservas 200 - 2ms` |
| Formulario | 200 | 200 | `[BIB-0004] GET /reservas/nueva 200 - 2ms` |
| Detalle existente | 200 | 200 | `[BIB-0005] GET /reservas/1 200 - 4ms` |
| Detalle inexistente | 404 | 404 | `[BIB-0006] GET /reservas/999 404 - 2ms` |
| CSS | 200 (304 con caché) | 200 (304 con caché) | Estilos cargados en el navegador |
| URL inexistente | 404 | 404 | `[BIB-0007] GET /url-inexistente 404 - 2ms` |
| POST inválido | 400 | 400 | `[BIB-0008] POST /reservas 400 - 10ms` |
| POST válido | 302 | 302 | `[BIB-0009] POST /reservas 302 - 2ms` |
| Reinicio | vuelve a 4 reservas | vuelve a 4 reservas | Pasó de 5 a 4 tras `Ctrl + C` y `npm start` |
| Puerto alternativo | — | 200 en 4000 | `GET / (puerto 4000) -> 200` |
| Puerto inválido | — | No inicia | `PORT inválido: "abc". Debe ser un entero entre 1 y 65535.` |

## Formato y análisis estático

Comandos ejecutados:

- `npm run format`: sin cambios en ningún módulo.
- `npm run check`: Prettier sin diferencias y ESLint sin errores.

## Persistencia temporal y límites

- **Por qué el servicio no usa `res`:** el servicio no usa `res` porque no maneja comunicación HTTP, solo maneja datos. El trabajo de comunicación HTTP le corresponde al controlador. Por ejemplo, `buscarPorId` solo devuelve la reserva o `undefined`, y es el controlador el que decide responder 404.

- **Qué hace el controlador:** el controlador es el intermediario entre la petición HTTP y el servicio. Recibe `req` y `res` (por ejemplo `req.params.id` o `req.reservaValidada`), le pide al servicio lo que necesita y decide cómo responder: renderizar una vista, enviar JSON, redirigir o devolver un 404. No guarda el arreglo ni ejecuta `listen`.

- **Por qué el router declara caminos relativos:** el router declara caminos relativos para ser más flexible al crear rutas. La flexibilidad consiste en que, si el prefijo cambia, se modifica en un solo lugar (`app.js`) y el router no se toca.

- **Dónde vive el único arreglo de reservas:** el arreglo de reservas vive dentro de `crearServicioReservas`, en `servicios/reservas.js`, como una variable privada. Solo se accede a través de `listar`, `buscarPorId`, `crear` y `contar`. Todos miran el mismo arreglo, porque si cada parte tuviera el suyo, el conteo de `/estado` quedaría desactualizado respecto del que modifica el POST. Por ejemplo, después de un POST válido, `/estado` pasa de 4 a 5 reservas porque ambos usan el mismo servicio.

- **Qué pasa con él al reiniciar:** el arreglo de reservas vive solo en la memoria del proceso de Node.js, dentro de `crearServicioReservas`. Cuando el servidor se corta y se vuelve a iniciar, `index.js` se ejecuta de nuevo, vuelve a crear `datosIniciales` y el servicio hace una copia nueva del arreglo. Por eso el arreglo regresa a las 4 reservas originales y se pierde todo lo que se agregó con POST. Esto pasa porque no hay base de datos ni archivos: el arreglo es volátil y existe únicamente mientras el servidor está corriendo. Por ejemplo, después de un POST válido `/estado` muestra 5, pero tras cortar con `Ctrl + C` y volver a ejecutar `npm start`, el arreglo vuelve a tener 4 reservas.

No hay base de datos ni persistencia: las reservas nuevas se pierden al reiniciar.