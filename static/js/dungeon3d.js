// dungeon3d.js - Genera y renderiza una mazmorra en 3D con Three.js
// Nota: Para este ejemplo se asume que Three.js está disponible como módulo.
// Puedes importarlo con: 
// import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

const MIN_WIDTH = 30;
const MIN_HEIGHT = 30;
const MAX_WIDTH = 120;
const MAX_HEIGHT = 120;

// Configuración de la mazmorra: define dimensiones (puedes ajustar o parametrizar)
const dungeonWidth = 40;   // ejemplo: 40 celdas de ancho
const dungeonHeight = 35;  // ejemplo: 35 celdas de alto

// Tipos de celdas y sus propiedades visuales
// “trap” y “secret” se generan como piso, sin detalles hasta activarse o descubrirse.
const CELL_TYPES = {
  wall: { color: 0x333333 },
  floor: { color: 0x888888 },
  door: { color: 0xffaa00 },
  trap: { color: 0x888888 },   // Igual que floor inicialmente
  secret: { color: 0x888888 }  // Igual que floor inicialmente
};

// Para diferenciar (cuando se active o descubra) podrías cambiar el material, por ejemplo.
const DOOR_PROPS = { locked: true }; // Ejemplo: puertas bloqueadas inicialmente

// Parámetros para el renderizado 3D
const TILE_SIZE = 1;  // Tamaño de cada celda en unidades Three.js

// Variable global para el estado de la mazmorra
let dungeonState = null;

/**
 * Genera la cuadrícula de la mazmorra.
 * El algoritmo parte de un mapa lleno de paredes y “excava” un camino a partir del centro.
 */
function generateDungeonState(width, height) {
  // Crear una matriz llena de paredes
  const grid = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      row.push({ x, y, type: 'wall', discovered: false });
    }
    grid.push(row);
  }

  // Posición inicial (aseguramos que sea accesible)
  let cx = Math.floor(width / 2);
  let cy = Math.floor(height / 2);
  grid[cy][cx].type = 'floor';
  grid[cy][cx].discovered = true;

  // Algoritmo de random walk para excavar (ejemplo: excavar un 40% del mapa)
  const steps = Math.floor(width * height * 0.4);
  const directions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 }
  ];

  for (let i = 0; i < steps; i++) {
    // Escoge una dirección aleatoria
    const dir = directions[Math.floor(Math.random() * directions.length)];
    const nx = cx + dir.dx;
    const ny = cy + dir.dy;
    if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1) {
      cx = nx;
      cy = ny;
      // Convertir la celda a piso
      grid[cy][cx].type = 'floor';
      grid[cy][cx].discovered = true;

      // Con baja probabilidad, colocar elementos especiales:
      const rnd = Math.random();
      if (rnd < 0.04) {
        grid[cy][cx].type = 'door'; // puerta
        grid[cy][cx].doorLocked = true; // propiedad extra
      } else if (rnd < 0.07) {
        grid[cy][cx].type = 'trap'; // trampa (invisible)
      } else if (rnd < 0.09) {
        grid[cy][cx].type = 'secret'; // secreto (invisible)
      }
    }
  }

  return {
    grid,
    width,
    height,
    // Puedes agregar más propiedades: posición del jugador, movimientos, etc.
    playerPos: { x: Math.floor(width / 2), y: Math.floor(height / 2) },
    moves: 0
  };
}

/**
 * Guarda el estado de la mazmorra en localStorage.
 */
function saveDungeonState() {
  localStorage.setItem('dungeon3dState', JSON.stringify(dungeonState));
}

/**
 * Carga el estado de la mazmorra desde localStorage; si no existe, lo genera.
 */
function loadDungeonState() {
  const stored = localStorage.getItem('dungeon3dState');
  if (stored) {
    dungeonState = JSON.parse(stored);
  } else {
    dungeonState = generateDungeonState(dungeonWidth, dungeonHeight);
    saveDungeonState();
  }
}

/**
 * Renderiza la mazmorra en 3D usando Three.js.
 * Se crea una escena en la que cada celda se representa como un “tile”.
 */
export function initializeDungeon3D() {
  // Asume que en el HTML existe un contenedor (por ejemplo, el div con id "dungeon-map")
  const container = document.getElementById('dungeon-map');
  if (!container) return;

  // Limpiar el contenedor
  container.innerHTML = '';

  // Cargar o generar el estado de la mazmorra
  loadDungeonState();

  // Crear la escena Three.js
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222222);

  // Configurar la cámara (posición elevada e inclinada)
  const aspect = container.clientWidth / container.clientHeight;
  const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
  // Posicionar la cámara para abarcar toda la mazmorra (ajusta según dimensiones)
  camera.position.set(dungeonState.width / 2, Math.max(dungeonState.width, dungeonState.height) * 1.2, dungeonState.height / 2);
  camera.lookAt(new THREE.Vector3(dungeonState.width / 2, 0, dungeonState.height / 2));

  // Configurar el renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // Añadir luces
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
  dirLight.position.set(0, 50, 0);
  scene.add(dirLight);

  // Materiales básicos para piso y paredes
  const floorMaterial = new THREE.MeshLambertMaterial({ color: CELL_TYPES.floor.color });
  const wallMaterial = new THREE.MeshLambertMaterial({ color: CELL_TYPES.wall.color });
  const doorMaterial = new THREE.MeshLambertMaterial({ color: CELL_TYPES.door.color });

  // Geometría para el piso
  const floorGeo = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
  floorGeo.rotateX(-Math.PI / 2); // girar para que sea horizontal

  // Recorrer la cuadrícula y añadir objetos
  for (let y = 0; y < dungeonState.height; y++) {
    for (let x = 0; x < dungeonState.width; x++) {
      const cell = dungeonState.grid[y][x];
      // Añadir piso en todas las celdas para uniformidad
      const floorMesh = new THREE.Mesh(floorGeo, floorMaterial);
      floorMesh.position.set(x + TILE_SIZE / 2, 0, y + TILE_SIZE / 2);
      scene.add(floorMesh);

      // Dependiendo del tipo, añadir objetos en 3D
      if (cell.type === 'wall') {
        const wallGeo = new THREE.BoxGeometry(TILE_SIZE, TILE_SIZE, TILE_SIZE);
        const wallMesh = new THREE.Mesh(wallGeo, wallMaterial);
        wallMesh.position.set(x + TILE_SIZE / 2, TILE_SIZE / 2, y + TILE_SIZE / 2);
        scene.add(wallMesh);
      } else if (cell.type === 'door') {
        // Representar la puerta como una caja más delgada
        const doorGeo = new THREE.BoxGeometry(TILE_SIZE, TILE_SIZE * 0.8, TILE_SIZE * 0.2);
        const doorMesh = new THREE.Mesh(doorGeo, doorMaterial);
        doorMesh.position.set(x + TILE_SIZE / 2, TILE_SIZE / 2, y + TILE_SIZE / 2);
        scene.add(doorMesh);
      }
      // Las trampas y secretos se tratan como piso hasta que se activen o descubran.
    }
  }

  // Función de renderizado
  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();

  // Aquí podrías implementar interacción:
  // Por ejemplo, usando raycasting para detectar clics en los “tiles” y mover al jugador.
  // Dado que el movimiento es celda a celda, se puede calcular la celda clicada y verificar si es adyacente.
}
