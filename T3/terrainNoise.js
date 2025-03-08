import * as THREE from "three";
import { SimplexNoise } from "../build/jsm/math/SimplexNoise.js";
import { setDefaultMaterial } from "../libs/util/util.js";
import { setMaterial } from "./voxel.js";

// Dimensão do plano (eixo xz).
const dimPlaneExecution = 200;
const dimPlaneModelagem = 10;

// Mapa de Voxels
const voxelMap = {};
for(let x = -Math.floor(dimPlaneExecution / 2); x < Math.floor(dimPlaneExecution / 2); x++){
  voxelMap[x] = {};
  for(let z = -Math.floor(dimPlaneExecution / 2); z <= Math.floor(dimPlaneExecution / 2); z++){
    voxelMap[x][z] = 0;
  }
}

// Adiciona altura 4 da arvore no mapeamento de voxels.
export function setVoxelMap(x,z){
  voxelMap[x][z] += 4;
}

// Índices para identificar tipos de voxel:
const indiceVoxelN1 = 0; // grama
const indiceVoxelN2 = 3; // terra
const indiceVoxelN3 = 2; // água


const voxelColors = [
  0x006400,
  0x8b4513,
  0x000080,
  0xf4a460,
  0xff8c00
];

// Parâmetros do ruído/terreno:
const noiseScale = 0.012;
const noiseAmplitude = 8;
const baseHeight = 8;

/**
 * Retorna a dimensão do plano dependendo do ambiente
 */
export function getDimPlane(ambiente) {
  if (ambiente === "execution") {
    return dimPlaneExecution;
  } else {
    return dimPlaneModelagem;
  }
}

/**
 * Insere a grid no scene
 */
export function insertGrade(scene) {
  const gridHelper = new THREE.GridHelper(dimPlaneModelagem, dimPlaneModelagem);
  scene.add(gridHelper);
}

/**
 * Gera o terreno procedural usando SimplexNoise (inclusa no three/examples),
 * e usa InstancedMesh para renderizar os blocos de forma mais performática.
 */
export function generateTerrainNoise(scene) {
  const simplex = new SimplexNoise();
  const size = dimPlaneExecution;
  const startPos = -Math.floor(size / 2);

  // Arrays de posições por tipo de voxel
  const positionsByType = {
    0: [], // grass
    1: [], // leaf
    2: [], // water,
    3: [], // dirt
  };

  // Loop principal do terreno
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const x = startPos + i;
      const z = startPos + j;

      const noiseValue = simplex.noise(x * noiseScale, z * noiseScale);
      const height = Math.floor(noiseValue * noiseAmplitude + baseHeight);

      if (height > 0) {
        // Para cada "camada" de y, decidimos se é dirt ou grass
        for (let y = 0; y < height; y++) {
          if (y < height - 1) {
            // Solo subterrâneo -> dirt
            positionsByType[indiceVoxelN2].push({ x, y: y + 0.5, z });
            voxelMap[x][z] += 1;
          } else {
            // Topo -> grass
            positionsByType[indiceVoxelN1].push({ x, y: y + 0.5, z });
            voxelMap[x][z] += 1;
          }
        }
      } else {
        // Se height <= 0, consideramos água
        positionsByType[indiceVoxelN3].push({ x, y: 0.5, z });
      }
    }
  }

  // Agora criamos um InstancedMesh para cada tipo
  Object.keys(positionsByType).forEach((typeString) => {
    const type = parseInt(typeString);
    const positions = positionsByType[type];
    const count = positions.length;

    if (count === 0) return;

    // Cria geometry e material
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    let material;
    if(type === 0){ // grass
      material = [
        setMaterial('./textures/blocoGramaLado.jpg'), //x+
        setMaterial('./textures/blocoGramaLado.jpg'), //x-
        setMaterial('./textures/blocoGramaCima.jpeg'), //y+
        setMaterial('./textures/blocoTerra.jpeg'), //y-
        setMaterial('./textures/blocoGramaLado.jpg'), //z+
        setMaterial('./textures/blocoGramaLado.jpg'), //z-
      ];
    } else {
      if (type === 1){ // leaf
        material = [
          setMaterial('./textures/blocoLeaf.png', 0.7, true), //x+
          setMaterial('./textures/blocoLeaf.png', 0.7, true), //x-
          setMaterial('./textures/blocoLeaf.png', 0.7, true), //y+
          setMaterial('./textures/blocoLeaf.png', 0.7, true), //y-
          setMaterial('./textures/blocoLeaf.png', 0.7, true), //z+
          setMaterial('./textures/blocoLeaf.png', 0.7, true), //z-
        ];
      } else {
        if (type === 2){ // water
          material = [
            setMaterial('./textures/blocoAgua.jpeg', 0.5, true), //x+
            setMaterial('./textures/blocoAgua.jpeg', 0.5, true), //x-
            setMaterial('./textures/blocoAgua.jpeg', 0.5, true), //y+
            setMaterial('./textures/blocoAgua.jpeg', 0.5, true), //y-
            setMaterial('./textures/blocoAgua.jpeg', 0.5, true), //z+
            setMaterial('./textures/blocoAgua.jpeg', 0.5, true), //z-
          ];
        } else { // dirt
          material = [
            setMaterial('./textures/blocoTerra.jpeg'), //x+
            setMaterial('./textures/blocoTerra.jpeg'), //x-
            setMaterial('./textures/blocoTerra.jpeg'), //y+
            setMaterial('./textures/blocoTerra.jpeg'), //y-
            setMaterial('./textures/blocoTerra.jpeg'), //z+
            setMaterial('./textures/blocoTerra.jpeg'), //z-
          ];
        }
      }
    }

    // Cria InstancedMesh
    const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;


    // Preenche cada matriz de transformação
    const dummyMatrix = new THREE.Matrix4();
    positions.forEach((pos, index) => {
      dummyMatrix.makeTranslation(pos.x, pos.y, pos.z);
      instancedMesh.setMatrixAt(index, dummyMatrix);
    });

    // Adiciona na cena
    scene.add(instancedMesh);
  });
}

/**
 * Retorna a 'altura' de blocos (quantidade empilhada) em (x, z).
 * Isto se baseia em voxelMap, que foi incrementado no generateTerrainNoise.
 */
export function getTerrainHeight(x, z) {
  const voxelPositionX = Math.floor(x);
  const voxelPositionZ = Math.floor(z);

  return voxelMap[voxelPositionX][voxelPositionZ];
}
