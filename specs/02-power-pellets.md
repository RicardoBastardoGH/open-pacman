# SPEC 02 — Power pellets y modo asustado

> **Status:** Approved
> **Depends on:** SPEC 01
> **Date:** 2026-11-05
> **Objective:** Añadir cuatro power pellets en zonas cercanas a las esquinas, activar el modo asustado durante 8 segundos por pellet y permitir que Pac-Man coma fantasmas vulnerables sin alterar la mecánica actual de puntuación, vidas y victoria.

## Scope

**In:**

- Cuatro power pellets por partida, uno por zona de esquina del mapa.
- Cada pellet se coloca al azar entre tres celdas transitables disponibles cerca de la esquina asignada y conserva esa posición durante toda la partida.
- Comer un pellet suma 50 puntos y activa el modo asustado de Pac-Man durante 8 segundos.
- Si se activa otro pellet antes de que termine el efecto, se suma el tiempo restante nuevo y el contador de terror se prolonga.
- Durante el modo asustado, Pac-Man dibuja un efecto visual distintivo y los fantasmas cambian a un estado asustado con color azul y ruta de huida.
- Si Pac-Man toca a un fantasma asustado, recibe 200 puntos, el fantasma vuelve a la casa por el laberinto como ojos y queda invulnerable mientras regresa.
- Si el efecto del pellet sigue activo cuando el fantasma sale de la casa, vuelve a entrar en estado asustado.
- La partida sigue considerando victoria exclusivamente por los puntos normales; los power pellets no son requisito adicional para ganar.
- La duración del modo asustado solo cuenta mientras el juego está activo, sin descontar tiempo cuando la ventana queda en segundo plano.

**Out of scope (for future specs):**

- Añadir nuevos niveles o cambios de tablero.
- Crear poderes extra para Pac-Man distintos del modo asustado.
- Alterar la IA de los fantasmas más allá de la huida en estado asustado y la ruta de retorno a la casa.
- Añadir persistencia, partidas guardadas o reanudación.
- Rediseñar el arte visual del juego en general más allá del efecto requerido para pellets y fantasmas asustados.

## Data model

```js
const POWER_PELLET_CANDIDATES = {
  topLeft: [
    { x: 1, y: 1 },
    { x: 1, y: 2 },
    { x: 2, y: 1 },
  ],
  topRight: [
    { x: 26, y: 1 },
    { x: 26, y: 2 },
    { x: 25, y: 1 },
  ],
  bottomLeft: [
    { x: 1, y: 29 },
    { x: 1, y: 28 },
    { x: 2, y: 29 },
  ],
  bottomRight: [
    { x: 26, y: 29 },
    { x: 26, y: 28 },
    { x: 25, y: 29 },
  ],
};

const ghost = {
  x: 13,
  y: 14,
  dir: "up",
  nextDir: null,
  speed: 0.1,
  kind: "hunter",
  patrolIndex: 0,
  state: "normal", // 'normal' | 'frightened' | 'returning'
  frightenedTimer: 0,
  returnTarget: { x: 13, y: 14 },
};

const game = {
  score: 0,
  lives: 3,
  dotsRemaining: 0,
  frightenedTimer: 0,
  powerPellets: [
    { x: 1, y: 1, eaten: false },
    { x: 26, y: 1, eaten: false },
    { x: 1, y: 29, eaten: false },
    { x: 26, y: 29, eaten: false },
  ],
};
```

Esta especificación reutiliza el modelo existente de `src/js/maze.js`, `src/js/game.js` y `src/js/render.js`; lo único nuevo es el estado de poder, el temporizador y la señal visual para Pac-Man y los fantasmas.

## Implementation plan

1. Añadir en `src/js/maze.js` la lista de posiciones candidatas para cada esquina con celdas transitables y preparar una estructura para que cada nueva partida elija cuatro pellets aleatorios manteniendo sus ubicaciones fijas durante la misma ejecución.
2. Actualizar `src/js/game.js` para incluir el estado de poder global, el temporizador de 8 segundos por pellet y la lógica de consumo de pellets sin afectar la cuenta principal de puntos normales.
3. Añadir la regla de colisión para fantasmas asustados: al tocar a un fantasma vulnerable, aumentar la puntuación, marcarlo como devuelto a la casa y activar su recorrido de regreso hasta la pen.
4. Implementar la lógica de retorno del fantasma: al salir de la casa, seguir una ruta hacia la pen y visualizarlos como ojos, sin poder dañar a Pac-Man ni volver a ser comido mientras regresa.
5. Añadir la lógica de huida para fantasmas asustados para que intenten alejarse de Pac-Man y no sigan las rutas predictables del comportamiento normal.
6. Ajustar el bucle de juego para que el timer de poder avance solo cuando el juego está activo y se mantenga el efecto visual y la duración acumulada al comer más pellets.
7. Actualizar `src/js/render.js` para dibujar el aura de Pac-Man y la apariencia azul de los fantasmas asustados, además de la versión de ojos durante el retorno a la casa.
8. Verificar manualmente en el navegador: comida de pellets, duración acumulada, colisiones con fantasmas asustados, retorno a la casa, pérdida de vida y overlays de victoria/derrota.

## Acceptance criteria

- [ ] El juego crea cuatro power pellets por partida, cada uno en una zona cercana a sus esquinas.
- [ ] Cada pellet se elige aleatoriamente entre tres opciones válidas del mismo lado del mapa y mantiene su posición durante la partida.
- [ ] Al comer un pellet, Pac-Man suma 50 puntos y entra en el modo asustado durante 8 segundos.
- [ ] Comer más pellets mientras el modo está activo suma el tiempo y no reinicia el efecto desde cero.
- [ ] Durante el modo asustado, Pac-Man muestra un efecto visual distinto y los fantasmas cambian su apariencia a azul.
- [ ] Los fantasmas asustados intentan alejarse de Pac-Man en vez de perseguirlo por sus rutas normales.
- [ ] Si Pac-Man toca a un fantasma asustado, suma 200 puntos y el fantasma regresa a la casa representado solo por ojos.
- [ ] Mientras el fantasma está regresando a la casa, no hace daño y no puede ser comido nuevamente.
- [ ] Si el efecto de poder sigue activo cuando el fantasma sale de la casa, vuelve a entrar en estado asustado.
- [ ] La victoria se mantiene por los puntos normales; no hace falta comer todos los power pellets para ganar.
- [ ] La pérdida de vidas y el reinicio conservan los pellets restantes y sus posiciones.
- [ ] El temporizador de modo asustado no avanza cuando el juego está detenido o la pestaña queda en segundo plano.
- [ ] La verificación manual confirma que el comportamiento funciona con el túnel, las colisiones, las vidas y los overlays de victoria/derrota.

## Decisions taken and discarded

- **Yes:** cuatro power pellets, uno por esquina. Da equilibrio visual y mantiene la amenaza distribuida en el mapa.
- **Yes:** tres opciones por esquina y selección aleatoria al iniciar cada partida. Permite variedad sin romper el diseño del mapa ni la lectura del juego.
- **Yes:** el modo asustado dura 8 segundos y se acumula. Es legible en juego y fácil de validar manualmente.
- **Yes:** los fantasmas asustados huyen de Pac-Man. Eso da la mecánica clásica del power pellet con una intención clara.
- **Yes:** la devolución a la casa se representa como ojos. Mantiene la identidad del fantasma y evita que se comporte como un enemigo normal durante el regreso.
- **Yes:** mantener la victoria por puntos normales. Evita la frustración de una partida que no finaliza aunque el jugador haya llenado el tablero.
- **No:** no añadir más poderes ni combinaciones con otros objetos. Eso queda fuera del alcance para esta especificación.
- **No:** no cambiar el mapa ni la geometría del laberinto. El objetivo es añadir poder sin introducir regresiones visuales o mecánicas.

## Risks

| Risk                                                             | Mitigation                                                                                                                    |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Los fantasmas asustados pueden quedar atrapados en bucles        | Usar ruta de escape basada en direcciones válidas y evitar giros triviales que vuelvan hacia Pac-Man.                         |
| El retorno a la casa puede romper la regla del túnel o la puerta | Mantener el algoritmo de retorno dentro de las reglas actuales de la pen y del túnel.                                         |
| El efecto temporal puede no acumularse con claridad              | Centralizar el timer del modo asustado en `game` y sumar 8 segundos en cada pellet consumido mientras el estado sigue activo. |
| Los efectos visuales pueden competir con la IA del fantasma      | Separar la representación visual del estado lógico para que la huida y el retorno funcionen independientemente del dibujo.    |

## What is not in this spec

- Añadir más niveles o cambios de dificultad.
- Crear nuevas mecánicas de power-up distintas a los pellets.
- Rediseñar por completo la apariencia del tablero.
- Implementar almacenamiento persistente de partidas.

Cada una de estas ampliaciones debe ir en una especificación independiente.
