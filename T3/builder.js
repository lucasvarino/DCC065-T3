import * as THREE from  'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        onWindowResize,
        createGroundPlaneXZ} from "../libs/util/util.js";

import GUI from '../../libs/util/dat.gui.module.js';
import { createVoxel, getHeightIndicator, insertAndReturnVoxelWireframe, removeHeightIndicator, removeVoxel } from './voxel.js';
import {insertGrade, getDimPlane  } from './terrain.js';
import {keyboardUpdate} from './keyboard.js';
import { DirectionalLight, HemisphereLight } from '../build/three.module.js';


let scene, renderer, camera, light, orbit; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
camera = initCamera(new THREE.Vector3(0, 15, 30)); // Init camera in this position
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// create the ground plane
let plane = createGroundPlaneXZ(getDimPlane("modelagem"), getDimPlane("modelagem"), 10, 10, "green");
plane.name = "plane";
scene.add(plane);

insertGrade(scene);

// Exemplo de como adicionar um voxel ao plano base
let selectedVoxel = insertAndReturnVoxelWireframe(scene);
selectedVoxel.name = "selectedVoxel";

function buildInterface() {
    // Função de controle do GUI
    let controls = new function () {
        this.fileName = 'voxels.json';  // Nome padrão do arquivo para salvar
        this.loadFile = null;

        // Função para salvar o estado atual dos voxels
        this.saveVoxels = function () {
            // Coletar todos os voxels na cena, excluindo o plano e o voxel selecionado (em wireframe)
            const voxelData = scene.children.filter(obj =>
                obj.geometry instanceof THREE.BoxGeometry && obj !== selectedVoxel && obj !== plane
            ).map(voxel => ({
                position: { x: voxel.position.x, y: voxel.position.y, z: voxel.position.z },
                texture: voxel.typeTexture // registra o tipo de textura
            }));


            // Download do arquivo
            const blob = new Blob([JSON.stringify(voxelData)], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = this.fileName;
            link.click();
        }

        // Função para carregar o estado dos voxels de um arquivo
        this.loadVoxels = function () {
            if (this.loadFile) {
                
                // Limpar a cena antes de carregar os voxels
                scene.children.forEach(obj => {
                    if (obj.name === "voxel") {
                        const heightIndicator = getHeightIndicator(obj);
                        removeHeightIndicator(heightIndicator, scene);
                    }
                });

                scene.children = scene.children.filter(obj => obj.name !== "voxel");

                const reader = new FileReader();
                reader.onload = function (event) {
                    const voxelData = JSON.parse(event.target.result);
                    voxelData.forEach(data => {
                        const loadedVoxel = createVoxel(0);  // Tipo inicial, cor será definida em seguida
                        loadedVoxel.position.set(data.position.x, data.position.y, data.position.z);
                        // carrega a textura dos blocos das árvores
                        const textureLoader = new THREE.TextureLoader();
                        const texture = textureLoader.load(data.texture);
                        loadedVoxel.material.map = texture;
                        loadedVoxel.material.needsUpdate = true;
                        scene.add(loadedVoxel);
                    });
                };
                reader.readAsText(this.loadFile);
            } else {
                alert("Por favor, selecione um arquivo para carregar.");
            }
        }

        // Função para armazenar o arquivo selecionado
        this.onFileSelected = function (fileInput) {
            this.loadFile = fileInput.files[0];
        }
    }

    // Criando a GUI
    let gui = new GUI();

    let fileFolder = gui.addFolder("Save/Load Voxels");
    fileFolder.open();

    fileFolder.add(controls, 'fileName')
        .name("File Name");

    fileFolder.add(controls, 'saveVoxels')
        .name("Save Voxels");

    // Input para escolher o arquivo a ser carregado
    let fileInputElement = document.createElement("input");
    fileInputElement.type = "file";
    fileInputElement.accept = ".json";
    fileInputElement.style.display = "none";  // Escondido inicialmente
    fileInputElement.addEventListener('change', function () {
        controls.onFileSelected(fileInputElement);
    });

    // Botão para abrir o seletor de arquivos
    fileFolder.add({ Load_File: () => fileInputElement.click() }, 'Load_File')
        .name("Select File to Load");

    // Botão para carregar voxels
    fileFolder.add(controls, 'loadVoxels')
        .name("Load Voxels");

    // Adicionando o input file ao body (para funcionamento do seletor de arquivo)
    document.body.appendChild(fileInputElement);
}

buildInterface();
render();
function render()
{
  requestAnimationFrame(render);
  keyboardUpdate(selectedVoxel, scene, plane);
  renderer.render(scene, camera) // Render scene
}