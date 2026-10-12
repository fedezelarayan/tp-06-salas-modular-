# Trabajo práctico 06

## Proyecto de partida y cambios

Partí de una copia funcional del TP 05 (reservas de salas de estudio), sin
`node_modules` ni `.git`. La refactorización reorganiza el código en módulos
sin cambiar el comportamiento visible: mismas vistas EJS, layout, CSS, datos
iniciales, Morgan, ID de solicitud, medición de duración, validación del POST
y respuestas HTTP.

Único cambio funcional permitido: el puerto y el formato de registro ahora
se configuran desde el entorno.

[Indicar si el TP 05 estaba completo o qué hubo que reparar antes de refactorizar.]

## Instalación y ejecución

```bash
npm install
npm start
```

La app queda en http://localhost:3000. Para verificar formato y lint:

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
- `npm start` funciona sin `.env`. El archivo `.env.example` es una plantilla.
- `npm run start:local` usa `node --env-file=.env` y requiere crear un `.env` local (no se versiona).
- Un `PORT` inválido hace que la app no inicie y muestra un mensaje claro.

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

Dependencias: `index.js` → (`configuracion`, `servicio`, `controlador`, `rutas`, `middleware/solicitudes`, `app`).
El servicio no depende de nadie.

## Pipeline y contrato de rutas

Pipeline:

```
Morgan -> identificarSolicitud -> medirDuracion -> layouts -> static
 -> urlencoded -> json -> rutas de aplicación -> router /reservas -> 404
```

Como Morgan va antes de `static`, también se registran los pedidos a recursos
como `/css/estilos.css`.

| Ruta | Respuesta |
|---|---|
| `GET /` | 200, inicio |
| `GET /estado` | 200, JSON con cantidad e ID |
| `GET /reservas` | 200, listado |
| `GET /reservas/nueva` | 200, formulario |
| `GET /reservas/:id` | 200, o 404 HTML si no existe |
| `POST /reservas` | 302 si es válido, 400 si es inválido |
| `GET /css/estilos.css` | 200 |
| Otra URL | 404 HTML |

## Matriz antes/después

| Caso | Antes (TP 05) | Después | Evidencia |
|---|---|---|---|
| Inicio | [ 200 ] | [ 200 ] | [ [BIB-0001] GET / 200 - 9ms ] |
| `/estado` | [ 200 ] | [ 200 ] | [ [BIB-0002] GET /estado 200 - 1ms ] |
| Listado | [ 200 ] | [ 200 ] | [ [BIB-0003] GET /reservas 200 - 2ms ] |
| Formulario | [ 200 ] | [ 200 ] | [ [BIB-0004] GET /reservas/nueva 200 - 2ms ] |
| Detalle existente | [ 200 ] | [ 200 ] | [ [BIB-0005] GET /reservas/1 200 - 4ms ] |
| Detalle inexistente | [ 404 ] | [ 404 ] | [ [BIB-0006] GET /reservas/999 404 - 2ms ] |
| POST inválido | [ 400 ] | [ 400 ] | [ [BIB-0008] POST /reservas 400 - 10ms ] |
| POST válido | [ 302 ] | [ 302 ] | [ [BIB-0009] POST /reservas 302 - 2ms ] |
| URL inexistente | [ 404 ] | [ 404 ] | [ [BIB-0007] GET /url-inexistente 404 - 2ms ] |
| Reinicio | [ vuelve a 4 reservas ] | [ vuelve a 4 reservas ] | [ pasó de 5 a 4 tras Ctrl+C y npm start ] |
| Puerto alternativo | — | [ 200 en 4000 ] | [ GET / (puerto 4000) -> 200 ] |
| Puerto inválido | — | [ no inicia  ] | [ PORT inválido: "abc". Debe ser un entero entre 1 y 65535. ] |

## Formato y análisis estático

Comandos ejecutados:

- `npm run format` → [resultado]
- `npm run check` → Prettier sin diferencias y ESLint sin errores.

## Persistencia temporal y límites

[Explicar con tus palabras:]

- Por qué el servicio no usa `res`: [...]
- Qué hace el controlador: [...]
- Por qué el router declara caminos relativos: [...]
- Dónde vive el único arreglo de reservas: [...]
- Qué pasa con él al reiniciar: [...]

No hay base de datos ni persistencia: las reservas nuevas se pierden al reiniciar.