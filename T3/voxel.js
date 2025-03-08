import * as THREE from  'three';
import { getDimPlane } from './terrain.js';

const voxelGeometry = new THREE.BoxGeometry(1, 1, 1);
const voxelPointsMap = new Map();
let currentVoxelType = 0;
let loader = new THREE.TextureLoader();

// Função para definir textura. Baseada na função do professor, com alterações de opacidade e transparência
export function setMaterial(file, opacity2 = 1, transparent = false, repeatU = 1, repeatV = 1, color = 'rgb(255,255,255)'){
  let mat = new THREE.MeshBasicMaterial({ map: loader.load(file), color:color, opacity: opacity2, transparent: transparent});
  mat.map.colorSpace = THREE.SRGBColorSpace;
  mat.map.wrapS = mat.map.wrapT = THREE.RepeatWrapping;
  mat.map.minFilter = mat.map.magFilter = THREE.LinearFilter;
  mat.map.repeat.set(repeatU,repeatV);

  return mat;
}

let voxelLeafMaterial = [
  setMaterial('./textures/blocoLeaf.png', 0.7, true), //x+
  setMaterial('./textures/blocoLeaf.png', 0.7, true), //x-
  setMaterial('./textures/blocoLeaf.png', 0.7, true), //y+
  setMaterial('./textures/blocoLeaf.png', 0.7, true), //y-
  setMaterial('./textures/blocoLeaf.png', 0.7, true), //z+
  setMaterial('./textures/blocoLeaf.png', 0.7, true), //z-
  
];

let voxelWoodMaterial = [
  setMaterial('./textures/blocoMadeira.png'), //x+
  setMaterial('./textures/blocoMadeira.png'), //x-
  setMaterial('./textures/blocoMadeira.png'), //y+
  setMaterial('./textures/blocoMadeira.png'), //y-
  setMaterial('./textures/blocoMadeira.png'), //z+
  setMaterial('./textures/blocoMadeira.png'), //z-
]

const voxelColors = [voxelWoodMaterial, voxelLeafMaterial];

export function nextVoxelType(){
  currentVoxelType = (currentVoxelType + 1) % voxelColors.length;
  return voxelColors[currentVoxelType];
}

export function previousVoxelType(){
  currentVoxelType = (currentVoxelType - 1 + voxelColors.length) % voxelColors.length;
  return voxelColors[currentVoxelType];
}

export function insertAndReturnVoxel(x,y,z,scene, type = currentVoxelType){
  const newVoxel = createVoxel(type);
  positionVoxel(x,y,z,newVoxel,scene);
  return newVoxel;
}

export function createVoxel(type) {

  let material = voxelColors[type]; // recebe o material de acordo com o tipo
  const voxel = new THREE.Mesh(voxelGeometry, material);
  voxel.name = "voxel";
  voxel.typeTexture = type + 1; // guarda o tipo de textura para utilizar no carregamento de árvores

  return voxel;
}

function positionVoxel(x,y,z,newVoxel, scene){
  let positionVoxelMap = new THREE.Vector3(x,y,z);
  newVoxel.position.copy(positionVoxelMap);
  scene.add(newVoxel);
}

export function removeVoxel(voxel, scene){
  voxel.geometry.dispose(); // Libera a memória usada pela geometria e material, evitando vazamentos
  voxel.material.dispose();
  scene.remove(voxel);
}

export function insertHeightIndicator(voxel, scene){
  const heightIndicator = createHeightIndicator();
  positionHeightIndicator(voxel,heightIndicator,scene);
}

function createHeightIndicator(){

  const pointsMaterial = new THREE.PointsMaterial({ color: 0xff0000, size: 0.1 });
  const pointsGeometry = new THREE.BufferGeometry();

  return new THREE.Points(pointsGeometry, pointsMaterial);
}

function positionHeightIndicator(voxel,heightIndicator,scene){
  const points = [];
  const startY = 0; // Começa no plano XZ
  const endY = voxel.position.y; // Altura do cubo
  for (let y = startY; y < endY; y += 0.2) {
      points.push(voxel.position.x, y, voxel.position.z); // Pontinhos alinhados com o voxel
  }
  heightIndicator.geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  scene.add(heightIndicator);
  voxelPointsMap.set(voxel, heightIndicator);
}

export function getHeightIndicator(voxel){
  return voxelPointsMap.get(voxel);
}

export function removeHeightIndicator(heightIndicator, scene){
  if(heightIndicator){
    heightIndicator.geometry.dispose(); // Libera a memória usada pela geometria e material, evitando vazamentos
    heightIndicator.material.dispose();
    scene.remove(heightIndicator);
  }
}

export function insertAndReturnVoxelWireframe(scene){
  let voxelWireframe = createVoxelWireframe();
  positionVoxelInitial(voxelWireframe,scene);

  return voxelWireframe;
}

function createVoxelWireframe(){
  let voxel = createVoxel(0);
  voxel.material.wireframe = true; // Deixar o voxel selecionado em wireframe para visualizar melhor

  return voxel
}

function positionVoxelInitial(voxel, scene){
  if(getDimPlane("modelagem") % 2 === 0){
    voxel.position.set(-0.5, 0.5, 0.5); // Posicionamento no terceiro quadrante do centro
  } else {
    voxel.position.set(0, 0.5, 0); // Posicionamento no centro do plano
  }
  scene.add(voxel);
}

export function getAllVoxelsInTheTerrain(scene){
  const voxelData = scene.children.filter(obj => obj.name = 'voxel');

  return voxelData;
}