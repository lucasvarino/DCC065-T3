import * as THREE from "three";
import { OrbitControls } from "../build/jsm/controls/OrbitControls.js";
import {
  initRenderer,
  initCamera,
  onWindowResize,
  createGroundPlaneXZ,
} from "../libs/util/util.js";
import GUI from "../libs/util/dat.gui.module.js";
import KeyboardState from "../libs/util/KeyboardState.js";
import Stats from "../build/jsm/libs/stats.module.js";
import { generateTerrainNoise, getDimPlane } from "./terrainNoise.js";
import Camera from "./camera.js";
import { loadAllTrees, placeRandomTrees } from "./threeLoader.js";
import { PointerLockControls } from "../build/jsm/controls/PointerLockControls.js";
import { setMaterial } from "./voxel.js";

// ===== TELA DE CARREGAMENTO =====
const loadingManager = new THREE.LoadingManager();
const loadingScreen = document.createElement('div');
const loadingText = document.createElement('div');
const loadingLogo = document.createElement('div');
const loadingSpinner = document.createElement('div');
const startButton = document.createElement('button');
let crosshair;

// Configuração da tela de carregamento
function setupLoadingScreen() {
  // Estilo para a tela de carregamento
  loadingScreen.style.position = 'fixed';
  loadingScreen.style.top = '0';
  loadingScreen.style.left = '0';
  loadingScreen.style.width = '100%';
  loadingScreen.style.height = '100%';
  loadingScreen.style.background = 'linear-gradient(to bottom, #8eb9ff, #5e93ff)';
  loadingScreen.style.display = 'flex';
  loadingScreen.style.flexDirection = 'column';
  loadingScreen.style.alignItems = 'center';
  loadingScreen.style.justifyContent = 'center';
  loadingScreen.style.zIndex = '1000';
  
  // Logo do jogo
  loadingLogo.textContent = 'MINECRAFT COMPUTAÇÃO GRÁFICA';
  loadingLogo.style.color = 'white';
  loadingLogo.style.fontSize = '48px';
  loadingLogo.style.fontFamily = 'Arial, sans-serif';
  loadingLogo.style.fontWeight = 'bold';
  loadingLogo.style.marginBottom = '30px';
  loadingLogo.style.textShadow = '3px 3px 5px rgba(0,0,0,0.5)';
  
  // Texto de carregamento
  loadingText.textContent = 'Carregando...';
  loadingText.style.color = 'white';
  loadingText.style.fontSize = '24px';
  loadingText.style.fontFamily = 'Arial, sans-serif';
  loadingText.style.marginBottom = '30px';
  
  // Spinner de carregamento
  loadingSpinner.style.border = '10px solid rgba(255, 255, 255, 0.3)';
  loadingSpinner.style.borderTop = '10px solid white';
  loadingSpinner.style.borderRadius = '50%';
  loadingSpinner.style.width = '60px';
  loadingSpinner.style.height = '60px';
  loadingSpinner.style.animation = 'spin 2s linear infinite';
  loadingSpinner.style.marginBottom = '40px';
  
  // Estilo para a animação do spinner
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleElement);
  
  // Botão Start Game (inicialmente desabilitado)
  startButton.textContent = 'CARREGANDO...';
  startButton.style.padding = '12px 30px';
  startButton.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
  startButton.style.color = 'white';
  startButton.style.border = 'none';
  startButton.style.borderRadius = '5px';
  startButton.style.fontSize = '18px';
  startButton.style.fontWeight = 'bold';
  startButton.style.cursor = 'not-allowed';
  startButton.style.transition = 'all 0.3s ease';
  startButton.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  startButton.disabled = true;
  
  startButton.addEventListener('click', startGame);
  
  // Adicionar elementos à página
  loadingScreen.appendChild(loadingLogo);
  loadingScreen.appendChild(loadingText);
  loadingScreen.appendChild(loadingSpinner);
  loadingScreen.appendChild(startButton);
  document.body.appendChild(loadingScreen);
  
  // Alguns blocos pixelados decorativos
  for (let i = 0; i < 20; i++) {
    const block = document.createElement('div');
    block.style.position = 'absolute';
    block.style.width = Math.random() * 30 + 20 + 'px';
    block.style.height = block.style.width;
    block.style.backgroundColor = ['#8B4513', '#228B22', '#A0522D', '#556B2F'][Math.floor(Math.random() * 4)];
    block.style.left = Math.random() * 100 + '%';
    block.style.top = Math.random() * 100 + '%';
    block.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
    block.style.opacity = '0.2';
    block.style.boxShadow = '2px 2px 5px rgba(0,0,0,0.3)';
    loadingScreen.appendChild(block);
  }
  
  // Lógica do gerenciador de carregamento
  loadingManager.onProgress = function(url, itemsLoaded, itemsTotal) {
    const percent = Math.floor(itemsLoaded / itemsTotal * 100);
    loadingText.textContent = `Carregando... ${percent}%`;
  };
  
  loadingManager.onLoad = function() {
    // Mudar o texto e habilitar o botão quando o carregamento estiver completo
    loadingText.textContent = 'Carregamento completo!';
    startButton.textContent = 'START GAME';
    startButton.style.backgroundColor = '#4CAF50';
    startButton.style.cursor = 'pointer';
    startButton.disabled = false;
    loadingSpinner.style.display = 'none';
    
    // Pré-carregar música
    setupBackgroundMusic();
  };
}

// Função para iniciar o jogo quando o botão for clicado
function startGame() {
  // Fade out da tela de carregamento
  loadingScreen.style.transition = 'opacity 1s';
  loadingScreen.style.opacity = '0';
  
  setTimeout(() => {
    loadingScreen.style.display = 'none';
    // Iniciar música
    startBackgroundMusic();
  }, 1000);
}

// ===== MÚSICA DE FUNDO =====
let backgroundMusic;

function setupBackgroundMusic() {
  // Criar elemento de áudio
  backgroundMusic = new Audio('./music/background.mp3');
  backgroundMusic.loop = true;
  backgroundMusic.volume = 0.5;  // Volume em 50%
  backgroundMusic.load();
}

function startBackgroundMusic() {
  // Tentar iniciar música automaticamente
  backgroundMusic.play().catch(error => {
    console.log("Aviso: Reprodução automática impedida pelo navegador. Pressione Q para iniciar a música.");
    
    // Criamos um listener de evento específico para o primeiro clique ou tecla
    const startAudioOnInteraction = () => {
      backgroundMusic.play().then(() => {
        // Se a reprodução for bem-sucedida, remover estes listeners
        document.removeEventListener('click', startAudioOnInteraction);
        document.removeEventListener('keydown', startAudioOnInteraction);
      }).catch(err => {
        console.log("Ainda não foi possível iniciar o áudio:", err);
      });
    };
    
    // Adiciona os listeners para primeiro clique ou tecla
    document.addEventListener('click', startAudioOnInteraction);
    document.addEventListener('keydown', startAudioOnInteraction);
  });
}

// Função para alternar o estado da música (play/pause)
function toggleBackgroundMusic() {
  if (backgroundMusic.paused) {
    backgroundMusic.play();
  } else {
    backgroundMusic.pause();
  }
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
  setupLoadingScreen();
  setupBackgroundMusic();
});

function setupCrosshair() {
  const crosshair = document.createElement('div');
  crosshair.style.position = 'absolute';
  crosshair.id = 'crosshair';
  crosshair.style.top = '50%';
  crosshair.style.left = '50%';
  crosshair.style.width = '20px';
  crosshair.style.height = '20px';
  crosshair.style.backgroundColor = 'transparent';
  crosshair.style.transform = 'translate(-50%, -50%)';
  crosshair.style.pointerEvents = 'none';
  crosshair.style.zIndex = '1000';
  crosshair.innerHTML = `
    <div style="position: absolute; top: 50%; left: 0; width: 20px; height: 2px; background-color: white; transform: translateY(-50%);"></div>
    <div style="position: absolute; top: 0; left: 50%; width: 2px; height: 20px; background-color: white; transform: translateX(-50%);"></div>
  `;
  document.body.appendChild(crosshair);
  
  // Tornar o crosshair visível apenas quando em modo de primeira pessoa
  crosshair.style.display = 'none';
  
  return crosshair;
}

// Inicialização da cena
let scene = new THREE.Scene();
let baseColor = "rgb(175, 200, 220)";
scene.fog = new THREE.Fog(baseColor, 1, getDimPlane("execution"));
let renderer = initRenderer("rgb(0, 0, 0)", THREE.VSMShadowMap);
renderer.setClearColor(baseColor);

let camera = initCamera(new THREE.Vector3(0, 15, 30));
let orbit = new OrbitControls(camera, renderer.domElement);

let stats = new Stats();
document.getElementById("container").appendChild(stats.dom);

let switchView = false;
let firstPersonCamera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// Insere Luz Ambiente
let ambientLight = new THREE.AmbientLight("rgb(243, 237, 237)");
scene.add(ambientLight);

// Insere Luz Direcional
let dirLight = new THREE.DirectionalLight("rgb(255,255,255)", 6);

dirLight.position.set(8, 35, 8); // posiciona luz

// Parâmetros para geração de sombra
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 4096;
dirLight.shadow.mapSize.height = 4096;
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 100;
dirLight.shadow.camera.left = -scene.fog.far;
dirLight.shadow.camera.right = scene.fog.far;
dirLight.shadow.camera.top = scene.fog.far;
dirLight.shadow.camera.bottom = -scene.fog.far;

// Insere Helper
let dirLightHelper = new THREE.CameraHelper(dirLight.shadow.camera);
dirLightHelper.visible = false;
let visibleDirLightHelper = false;
scene.add(dirLightHelper);

window.addEventListener("resize", () => onWindowResize(camera, renderer), false);

let keyboard = new KeyboardState();

let plane = createGroundPlaneXZ(
  getDimPlane("execution"),
  getDimPlane("execution"),
  10,
  10,
);
scene.add(plane);

const numTrees = 0.2 * getDimPlane("execution");

const controlskb = new PointerLockControls(
  firstPersonCamera,
  renderer.domElement
);
scene.add(controlskb.getObject());

const speed = 20;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;

window.addEventListener("keydown", (event) => movementControls(event.keyCode, true));
window.addEventListener("keyup", (event) => movementControls(event.keyCode, false));

function movementControls(key, value) {
  switch (key) {
    case 87: moveForward = value; break; // W
    case 83: moveBackward = value; break; // S
    case 65: moveLeft = value; break; // A
    case 68: moveRight = value; break; // D
    case 32: moveUp = value; break; // Space
    case 16: moveDown = value; break; // Shift
  }
}

function keyboardUpdate() {
  keyboard.update();
  if (keyboard.down("C")) {
    switchView = !switchView;
    crosshair.style.display = switchView ? 'block' : 'none';
  }

  if (keyboard.down("H")) {
    dirLightHelper.visible = !visibleDirLightHelper;
    visibleDirLightHelper = !visibleDirLightHelper;
  }
  
  // Adicionar controle para música
  if (keyboard.down("Q")) {
    toggleBackgroundMusic();
  }
}

function buildInterface() {
  let gui = new GUI();
  gui.add(scene.fog, "far", 20, getDimPlane("execution") * 3).name("Fog Far");
}

async function loadGameAssets() {
  // Carregar terreno
  generateTerrainNoise(scene);

  await loadAllTrees();
  placeRandomTrees(scene, numTrees);
  
  // Construir interface após carregamento
  buildInterface();
  crosshair = setupCrosshair();
  loadingManager.onLoad();
}

const clock = new THREE.Clock();
const controlaCamera = new Camera(firstPersonCamera);

// Iniciar carregamento de recursos
loadGameAssets();

document.addEventListener("click", () => {
  if (switchView) {
    renderer.domElement.requestPointerLock();
  }
});

function render() {
  stats.update();
  controlaCamera.update(clock.getDelta());
  keyboardUpdate();
  requestAnimationFrame(render);
  renderer.render(scene, switchView ? firstPersonCamera : camera);
}
render();