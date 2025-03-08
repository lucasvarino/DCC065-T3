// treeLoader.js
import * as THREE from 'three';
import { createVoxel } from './voxel.js';
import { getDimPlane, getTerrainHeight, setVoxelMap } from './terrainNoise.js';

export let tree1Data = null;
export let tree2Data = null;

function loadJSON(path) {
  return new Promise((resolve, reject) => {
    const loader = new THREE.FileLoader();
    loader.load(
      path,
      (data) => resolve(JSON.parse(data)),
      undefined,
      (err) => reject(err)
    );
  });
}

export async function loadAllTrees() {
  try {
    [tree1Data, tree2Data] = await Promise.all([
      loadJSON('trees/tree1.json'),
      loadJSON('trees/tree2.json'),
    ]);
    console.log("Todas as árvores foram carregadas com sucesso!");
  } catch (error) {
    console.error("Erro ao carregar JSON das árvores:", error);
  }
}

// Cria uma árvore a partir dos dados (array) do JSON, devolvendo um THREE.Group
export function createTreeFromData(treeData) {
  const group = new THREE.Group();

  treeData.forEach((voxelInfo) => {
    
    let voxel
    // define a textura do voxel
    if(voxelInfo.texture === 1){
      voxel = createVoxel(0);
    } else {
      voxel = createVoxel(1);
    }

    voxel.position.set(
      voxelInfo.position.x,
      voxelInfo.position.y,
      voxelInfo.position.z
    );
    voxel.castShadow = true;
    voxel.receiveShadow = true;
    group.add(voxel);
  });
  return group;
}

/**
 * Embaralha array in-place (Fisher–Yates shuffle)
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function placeRandomTrees(scene, numberOfTrees) {
  const size = getDimPlane("execution");
  const startPos = -Math.floor(size / 2);
  const endPos = startPos + size;

  // 1) Coletar as coordenadas válidas (onde height > 1)
  const validCoords = [];
  for (let x = startPos; x < endPos; x++) {
    for (let z = startPos; z < endPos; z++) {
      const h = getTerrainHeight(x, z);
      if (h > 1) {
        validCoords.push({ x, z });
      }
    }
  }

  // 2) Embaralhar o array de coordenadas
  shuffleArray(validCoords);

  // 3) Selecionar as primeiras 'numberOfTrees' (ou até acabar)
  let placed = 0;
  for (let i = 0; i < validCoords.length && placed < numberOfTrees; i++) {
    const { x, z } = validCoords[i];
    const height = getTerrainHeight(x, z);

    // Sorteia qual árvore (tree1, tree2)
    const r = Math.random();
    let chosenTreeData;
    if (r < 0.33) chosenTreeData = tree1Data;
    else if (r < 0.66) chosenTreeData = tree2Data;
      else chosenTreeData = tree1Data;

    // Cria e posiciona a árvore
    const treeGroup = createTreeFromData(chosenTreeData);
    const posY = (height - 1) + 0.5; // ajuste se necessário
    treeGroup.position.set(x, posY, z);
    setVoxelMap(x,z) //Insere altura da árvore no mapeamento de Voxels

    scene.add(treeGroup);
    placed++;
  }
}
