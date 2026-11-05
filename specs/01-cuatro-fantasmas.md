# SPEC 01 — Cuatro fantasmas con comportamientos distintos

> **Estado:** Approved
> **Depends on:** Ninguna
> **Date:** 2026-11-04
> **Objective:** Añadir cuatro fantasmas con comportamientos distintos para que cada uno reaccione de manera diferente ante Pac-Man y el laberinto.

## Scope

**In:**

- Cuatro fantasmas visualmente diferenciados por color y tipo de comportamiento.
- Un fantasma perseguidor que busca a Pac-Man por la ruta más corta y evita el túnel.
- Un fantasma emboscador que apunta delante de Pac-Man.
- Un fantasma patrullero que recorre esquinas del laberinto en orden fijo.
- Un fantasma errático que elige direcciones válidas al azar.
- Salida inmediata de la casa al iniciar la partida y tras perder una vida.
- Mantener las reglas actuales de puntuación, vidas, derrota y victoria.

**Out of scope (for future specs):**

- Poderes de Pac-Man adicionales.
- Nuevos modos de juego o niveles.
- IA compleja para evitar bucles, caminos de fuga o decisiones con varios pasos de anticipación.
- Multiplayer o sincronización en red.
- Cambios visuales del tablero ajenos a la identidad de los fantasmas.

## Data model

```js
const GHOST_STARTS = [
  { x: 13, y: 14, kind: "hunter" },
  { x: 14, y: 14, kind: "random" },
  { x: 12, y: 14, kind: "patrol" },
  { x: 15, y: 14, kind: "ambusher" },
];

const ghost = {
  x: 13,
  y: 14,
  dir: "up",
  nextDir: null,
  speed: 0.1,
  kind: "hunter",
  patrolIndex: 0,
};
```

Esta especificación reutiliza el modelo de juego ya existente en `src/js/game.js` y `src/js/maze.js`; no introduce una estructura nueva ajena a la lógica actual del juego.

## Implementation plan

1. Actualizar `src/js/maze.js` para definir cuatro posiciones distintas de salida de la casa y etiquetar cada fantasma con su comportamiento.
2. Añadir en `src/js/game.js` la lógica del fantasma perseguido para calcular la ruta transitable más corta hacia Pac-Man sin utilizar el túnel y permitiendo invertir la dirección cuando sea necesario.
3. Añadir la lógica del fantasma emboscador: calcular una última casilla cuatro celdas delante de Pac-Man según su dirección y usar la posición alcanzable más cercana cuando el punto primario no pueda resolverse.
4. Añadir la lógica del fantasma patrullero: recorrer cuatro esquinas transitables del laberinto en sentido horario, empezando por la esquina superior izquierda.
5. Mantener la lógica del fantasma errático actual: elegir una dirección válida al azar y evitar invertir el sentido salvo en callejones sin salida.
6. Ajustar el flujo de salida de la casa para que los cuatro fantasmas salgan inmediatamente al inicio y tras perder una vida, sin romper la lógica de reinicio de posiciones.
7. Verificar manualmente en el navegador que cada fantasma se comporta distinto, que la puerta y el túnel se respetan y que las vidas, la victoria y la derrota siguen funcionando.

## Acceptance criteria

- [ ] El juego muestra cuatro fantasmas con colores y comportamientos distintos.
- [ ] Los cuatro fantasmas salen de la casa al empezar la partida y al reiniciar tras perder una vida.
- [ ] El fantasma rojo persigue a Pac-Man por la ruta transitable más corta y no atraviesa el túnel.
- [ ] El fantasma cian apunta cuatro casillas delante de Pac-Man y tiene un fallback a la celda transitable más cercana.
- [ ] El fantasma rosa recorre las esquinas transitables en orden fijo y horario.
- [ ] El fantasma naranja elige direcciones válidas al azar con comportamiento errático.
- [ ] El perseguidor puede invertir su dirección cuando la ruta lo exige.
- [ ] Pac-Man y los fantasmas restantes pueden usar el túnel del laberinto según las reglas actuales.
- [ ] La velocidad y el alineado de movimiento se mantienen coherentes con el juego actual.
- [ ] La pérdida de vidas, el fin de partida y los overlays de victoria/derrota siguen funcionando sin regresiones.

## Decisions taken and discarded

- **Yes:** cuatro fantasmas distintos con comportamientos separados. Esto hace que el juego se sienta más vivo y menos repetitivo.
- **Yes:** el perseguido excluye el túnel tanto en la planificación como en el uso físico. Evita rutas artificiales que rompen la lógica del mapa.
- **Yes:** el emboscador usa cuatro casillas delante de Pac-Man. Esa regla da un comportamiento más predecible y legible que intentarlo perseguir en todas las situaciones.
- **Yes:** el patrullero sigue cuatro esquinas en sentido horario. Es fácil de seguir visualmente y ofrece un patrón constante.
- **Yes:** el errático conserva el comportamiento aleatorio básico. Se mantiene la biblioteca de decisiones actual y reduce la complejidad.
- **No:** no se agrega comportamiento de miedo o modo de fuga. Eso queda fuera del alcance para esta especificación.
- **No:** no se modifica la velocidad de los fantasmas. El cambio de dificultad se consigue con la decisión de movimiento, no con un ajuste de velocidad.

## Risks

| Risk                                                                | Mitigation                                                                                  |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| El perseguidor puede quedar bloqueado si no contempla giros de 180° | Permitir inversión de dirección cuando la ruta más corta lo requiera.                       |
| El emboscador puede apuntar a una celda imposible o no transitable  | Resolver primero el destino directo y luego elegir la casilla alcanzable más cercana.       |
| El patrullero puede quedarse atascado en una esquina                | Definir un orden fijo por esquinas transitables y validar la dirección antes de avanzar.    |
| El movimiento aleatorio puede parecer caótico                       | Mantener la política actual de elegir solo direcciones válidas y evitar giros innecesarios. |

## What is not in this spec

- Añadir poderes o mecánicas extra para Pac-Man.
- Rediseñar el mapa o cambiar el túnel.
- Crear un sistema de dificultad por niveles.
- Añadir redes sociales, guardado, o persistencia de partidas.

Cada una de estas ampliaciones debe ir en una especificación independiente.
