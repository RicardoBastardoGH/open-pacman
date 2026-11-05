// game.js
// Estado y reglas. Depende de globals de maze.js: MAZE, TUNNEL_ROW,
// PACMAN_START, GHOST_STARTS.

const DIRS = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
};
const OPPOSITE = { left: 'right', right: 'left', up: 'down', down: 'up' };

const PACMAN_SPEED = 0.125; // 1/8 celda/frame -> alinea cada 8 frames
const GHOST_SPEED = 0.1;    // 1/10 celda/frame
const PATROL_CORNERS = [
  { x: 1, y: 1 },
  { x: 26, y: 1 },
  { x: 26, y: 29 },
  { x: 1, y: 29 },
];

// Crea una partida nueva. Copia MAZE (pristino) a game.grid para poder comer
// dots sin destruir el original, y reiniciar.
function createGame() {
  const grid = MAZE.map( ( row ) => row.slice() );
  // La celda de inicio de Pacman arranca sin dot.
  grid[ PACMAN_START.y ][ PACMAN_START.x ] = 0;

  let dots = 0;
  for ( const row of grid ) for ( const v of row ) if ( v === 2 ) dots++;

  return {
    state: 'start',
    score: 0,
    lives: 3,
    dotsRemaining: dots,
    grid,
    pacman: {
      x: PACMAN_START.x,
      y: PACMAN_START.y,
      dir: 'left',
      nextDir: null,
      speed: PACMAN_SPEED,
    },
    ghosts: GHOST_STARTS.map( ( g ) => ( {
      x: g.x,
      y: g.y,
      dir: 'up',
      nextDir: null,
      speed: GHOST_SPEED,
      kind: g.kind,
      patrolIndex: 0,
    } ) ),
  };
}

function aligned( v ) {
  return Math.abs( v - Math.round( v ) ) < 1e-3;
}

// Una celda es muro para el actor dado?
//   pacman: bloqueado por pared (1) y puerta (3)
//   ghost:  bloqueado solo por pared (1)
function isWall( grid, x, y, actor ) {
  if ( y < 0 || y >= grid.length ) return true;
  if ( x < 0 || x >= grid[ 0 ].length ) return true;
  const v = grid[ y ][ x ];
  if ( v === 1 ) return true;
  if ( v === 3 && actor === 'pacman' ) return true;
  return false;
}

// Puede el actor avanzar desde (x,y) en la direccion dir?
function canMove( grid, x, y, dir, actor ) {
  const d = DIRS[ dir ];
  if ( !d ) return false;
  const tx = x + d.x;
  const ty = y + d.y;
  // Tunel: salir por un borde en la fila del tunel siempre es valido.
  if ( ty === TUNNEL_ROW && ( tx < 0 || tx >= grid[ 0 ].length ) ) return true;
  return !isWall( grid, tx, ty, actor );
}

function wrapTunnel( a, width ) {
  if ( Math.round( a.y ) === TUNNEL_ROW ) {
    if ( a.x < 0 ) a.x += width;
    else if ( a.x >= width ) a.x -= width;
  }
}

function stepGhostCell( grid, x, y, dir, allowTunnel ) {
  const d = DIRS[ dir ];
  if ( !d ) return null;
  let tx = x + d.x;
  let ty = y + d.y;
  const width = grid[ 0 ].length;

  if ( ty === TUNNEL_ROW && ( tx < 0 || tx >= width ) ) {
    if ( !allowTunnel ) return null;
    tx = tx < 0 ? tx + width : tx - width;
    return { x: tx, y: ty };
  }

  if ( ty < 0 || ty >= grid.length ) return null;
  if ( tx < 0 || tx >= width ) return null;
  if ( isWall( grid, tx, ty, 'ghost' ) ) return null;
  return { x: tx, y: ty };
}

function ghostDirTowardTarget( game, ghost, targetX, targetY, allowTunnel ) {
  const start = { x: Math.round( ghost.x ), y: Math.round( ghost.y ) };
  const queue = [ start ];
  const visited = new Set( [ start.x + ',' + start.y ] );
  const prev = new Map();

  while ( queue.length ) {
    const current = queue.shift();
    if ( current.x === targetX && current.y === targetY ) {
      let cursor = current;
      while ( cursor.x !== start.x || cursor.y !== start.y ) {
        const key = cursor.x + ',' + cursor.y;
        const info = prev.get( key );
        if ( !info ) return null;
        cursor = info.from;
        if ( cursor.x === start.x && cursor.y === start.y ) return info.dir;
      }
      return null;
    }

    for ( const dir of Object.keys( DIRS ) ) {
      const next = stepGhostCell( game.grid, current.x, current.y, dir, allowTunnel );
      if ( !next ) continue;
      const key = next.x + ',' + next.y;
      if ( visited.has( key ) ) continue;
      visited.add( key );
      prev.set( key, { from: current, dir } );
      queue.push( next );
    }
  }

  return null;
}

function nearestReachableCell( game, targetX, targetY, allowTunnel ) {
  const grid = game.grid;
  const width = grid[ 0 ].length;
  const height = grid.length;
  let best = { x: targetX, y: targetY };
  let bestDist = Infinity;

  for ( let y = 0; y < height; y++ ) {
    for ( let x = 0; x < width; x++ ) {
      if ( isWall( grid, x, y, 'ghost' ) ) continue;
      const dist = Math.abs( x - targetX ) + Math.abs( y - targetY );
      if ( dist < bestDist ) {
        bestDist = dist;
        best = { x, y };
      }
    }
  }

  return best;
}

function movePacman( game ) {
  const p = game.pacman;
  const grid = game.grid;
  const width = grid[ 0 ].length;

  if ( aligned( p.x ) && aligned( p.y ) ) {
    p.x = Math.round( p.x );
    p.y = Math.round( p.y );

    // Aplicar giro pendiente si es posible.
    if ( p.nextDir && canMove( grid, p.x, p.y, p.nextDir, 'pacman' ) ) {
      p.dir = p.nextDir;
      p.nextDir = null;
    }
    // Comer dot.
    if ( grid[ p.y ][ p.x ] === 2 ) {
      grid[ p.y ][ p.x ] = 0;
      game.score += 10;
      game.dotsRemaining--;
    }
    // Si no puede seguir, se detiene en la celda.
    if ( !canMove( grid, p.x, p.y, p.dir, 'pacman' ) ) return;
  }

  const d = DIRS[ p.dir ];
  p.x += d.x * p.speed;
  p.y += d.y * p.speed;
  wrapTunnel( p, width );
}

function decideGhost( game, g ) {
  const grid = game.grid;
  const p = game.pacman;
  const currentX = Math.round( g.x );
  const currentY = Math.round( g.y );

  const options = Object.keys( DIRS ).filter( ( dir ) => {
    if ( dir === OPPOSITE[ g.dir ] ) return false;
    return canMove( grid, currentX, currentY, dir, 'ghost' );
  } );
  const choices = options.length ? options : [ OPPOSITE[ g.dir ] ];

  if ( g.kind === 'hunter' ) {
    const px = Math.round( p.x );
    const py = Math.round( p.y );

    const dirToPacman = ghostDirTowardTarget( game, g, px, py, false );
    if ( dirToPacman ) {
      g.dir = dirToPacman;
      return;
    }

    let best = choices[ 0 ];
    let bestDist = Infinity;
    for ( const dir of choices ) {
      const d = DIRS[ dir ];
      const nx = currentX + d.x;
      const ny = currentY + d.y;
      const dist = Math.abs( nx - px ) + Math.abs( ny - py );
      if ( dist < bestDist ) {
        bestDist = dist;
        best = dir;
      }
    }
    g.dir = best;
    return;
  }

  if ( g.kind === 'ambusher' ) {
    const d = DIRS[ p.dir ] || { x: 0, y: 0 };
    let tx = Math.round( p.x ) + d.x * 4;
    let ty = Math.round( p.y ) + d.y * 4;
    if ( tx < 0 || tx >= grid[ 0 ].length || ty < 0 || ty >= grid.length || isWall( grid, tx, ty, 'ghost' ) ) {
      const fallback = nearestReachableCell( game, tx, ty, true );
      tx = fallback.x;
      ty = fallback.y;
    }

    const dirToAmbush = ghostDirTowardTarget( game, g, tx, ty, true );
    if ( dirToAmbush ) {
      g.dir = dirToAmbush;
      return;
    }

    const fallbackDir = choices[ Math.floor( Math.random() * choices.length ) ] || g.dir;
    g.dir = fallbackDir;
    return;
  }

  if ( g.kind === 'patrol' ) {
    const target = PATROL_CORNERS[ g.patrolIndex % PATROL_CORNERS.length ];
    let dirToCorner = ghostDirTowardTarget( game, g, target.x, target.y, true );

    if ( !dirToCorner ) {
      const cornerOptions = Object.keys( DIRS ).filter( ( dir ) => {
        if ( dir === OPPOSITE[ g.dir ] && choices.length > 1 ) return false;
        return canMove( grid, currentX, currentY, dir, 'ghost' );
      } );
      dirToCorner = cornerOptions.length ? cornerOptions[ 0 ] : choices[ 0 ];
    }

    g.dir = dirToCorner;

    if ( currentX === target.x && currentY === target.y ) {
      g.patrolIndex = ( g.patrolIndex + 1 ) % PATROL_CORNERS.length;
    }
    return;
  }

  if ( g.kind === 'random' ) {
    g.dir = choices[ Math.floor( Math.random() * choices.length ) ];
    return;
  }

  g.dir = choices[ Math.floor( Math.random() * choices.length ) ];
}

function moveGhost( game, g ) {
  const grid = game.grid;
  const width = grid[ 0 ].length;

  if ( aligned( g.x ) && aligned( g.y ) ) {
    g.x = Math.round( g.x );
    g.y = Math.round( g.y );
    decideGhost( game, g );
    if ( !canMove( grid, g.x, g.y, g.dir, 'ghost' ) ) return;
  }

  const d = DIRS[ g.dir ];
  g.x += d.x * g.speed;
  g.y += d.y * g.speed;
  wrapTunnel( g, width );
}

function resetPositions( game ) {
  const p = game.pacman;
  p.x = PACMAN_START.x;
  p.y = PACMAN_START.y;
  p.dir = 'left';
  p.nextDir = null;
  game.ghosts.forEach( ( g, i ) => {
    g.x = GHOST_STARTS[ i ].x;
    g.y = GHOST_STARTS[ i ].y;
    g.dir = 'up';
    g.nextDir = null;
    g.patrolIndex = 0;
  } );
}

function collides( a, b ) {
  return Math.abs( a.x - b.x ) < 0.5 && Math.abs( a.y - b.y ) < 0.5;
}

function update( game ) {
  movePacman( game );
  game.ghosts.forEach( ( g ) => moveGhost( game, g ) );

  for ( const g of game.ghosts ) {
    if ( collides( game.pacman, g ) ) {
      game.lives--;
      if ( game.lives <= 0 ) {
        game.state = 'lost';
        return;
      }
      resetPositions( game );
      break;
    }
  }

  if ( game.dotsRemaining <= 0 ) game.state = 'won';
}

window.createGame = createGame;
window.update = update;
window.DIRS = DIRS;
window.GHOST_STARTS = GHOST_STARTS;
window.PATROL_CORNERS = PATROL_CORNERS;

