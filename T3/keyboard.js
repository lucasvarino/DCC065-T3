import * as THREE from  'three';
import KeyboardState from '../../libs/util/KeyboardState.js'
import { insertAndReturnVoxel, nextVoxelType, previousVoxelType, insertHeightIndicator, getHeightIndicator, removeHeightIndicator, removeVoxel} from './voxel.js';
import { getDimPlane } from './terrain.js';

// To use the keyboard
var keyboard = new KeyboardState();

export function keyboardUpdate(selectedVoxel, scene, plane) {
  keyboard.update();

  if (keyboard.down("left")) {
    if (selectedVoxel.position.x > getDimPlane("modelagem") / -2 + 1) {  // Limite para o movimento dentro do cubo 10x10x10
        selectedVoxel.position.x -= 1;
    }
  }
  if (keyboard.down("right")) {
    if (selectedVoxel.position.x < getDimPlane("modelagem") / 2 - 1) { 
        selectedVoxel.position.x += 1;
    }
  }
  if (keyboard.down("down")) {
    if (selectedVoxel.position.z < getDimPlane("modelagem") / 2 - 1) {
        selectedVoxel.position.z += 1;
    }
  }
  if (keyboard.down("up")) {
    if (selectedVoxel.position.z > getDimPlane("modelagem") / -2 + 1) {
        selectedVoxel.position.z -= 1;
    }
  }

  // Movimentação em Y (altura)
  if (keyboard.down("pageup")) {
    if (selectedVoxel.position.y < getDimPlane("modelagem") / 2) {  // Limite superior do cubo
        selectedVoxel.position.y += 1;
    }
  }
  if (keyboard.down("pagedown")) {
    if (selectedVoxel.position.y > 0.5) {  // Limite inferior do cubo, garantindo que não vá abaixo do plano
        selectedVoxel.position.y -= 1;
    }
  }

  // Inserção de voxel (pressionar 'Q')
  if (keyboard.down("Q")) {
    // Verificar se já existe um voxel na posição do voxel selecionado
    const voxelExists = scene.children.some(obj =>
        obj.geometry instanceof THREE.BoxGeometry &&
        obj !== selectedVoxel &&
        obj.position.equals(selectedVoxel.position)
    );

    if (!voxelExists) {
        const newVoxel = insertAndReturnVoxel(selectedVoxel.position.x,selectedVoxel.position.y,selectedVoxel.position.z,scene);
        insertHeightIndicator(newVoxel, scene);
    }
  }

  // Remoção de voxel (pressionar 'E')
  if (keyboard.down("E")) {
    const objToRemove = scene.children.find(obj =>
        obj.position.equals(selectedVoxel.position) && obj !== plane && obj !== selectedVoxel
    );
    if (objToRemove) {
        const heightIndicator = getHeightIndicator(objToRemove)
        if(heightIndicator){
            removeHeightIndicator(heightIndicator, scene);
        };
        removeVoxel(objToRemove, scene);
    }
  }

  // Alterar tipo de voxel - próximo tipo (pressionar '.')
  if (keyboard.down(".")) {
    const nextTexture = nextVoxelType(); // A função que retorna o próximo tipo de textura
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(nextTexture);
    selectedVoxel.material.map = texture;
    selectedVoxel.material.needsUpdate = true
  }

  // Alterar tipo de voxel - tipo anterior (pressionar ',')
  if (keyboard.down(",")) {
    const nextTexture = previousVoxelType(); // A função que retorna o próximo tipo de textura
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(nextTexture);
    selectedVoxel.material.map = texture;
    selectedVoxel.material.needsUpdate = true
  }
}