import * as THREE from 'three'
import { GLTFLoader } from '../build/jsm/loaders/GLTFLoader.js'
import { getMaxSize } from "../libs/util/util.js"
import { getTerrainHeight } from './terrainNoise.js'

export default class Personagem {
  constructor(scene, modelPath) {
    this.scene = scene
    this.modelPath = modelPath
    this.mixer = null
    this.model = null
    this.actions = {}
    this.currentAction = null
    this.loader = new GLTFLoader()
    this.velocity = new THREE.Vector3(0, 0, 0)
    this.speed = 5
    this.jumpForce = 10
    this.gravity = -20
    this.isJumping = false
    this.keys = { W: false, A: false, S: false, D: false, Space: false, Down: false, Up: false, Left: false, Right: false }
    this.setupKeyListeners()
  }

  loadModel() {
    return new Promise((resolve, reject) => {
      this.loader.load(
        this.modelPath,
        (gltf) => {
          this.model = gltf.scene
          if (gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.model)
            gltf.animations.forEach((clip) => {
              const action = this.mixer.clipAction(clip)
              action.setEffectiveWeight(1)
              this.actions[clip.name] = action
            })
          }
          resolve(this.model)
        },
        undefined,
        (error) => {
          reject(error)
        }
      )
    })
  }

  addToScene() {
    this.model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
      }
      if (child.material) {
        child.material.side = THREE.DoubleSide
      }
    })
    this.model.position.set(0, 0, 0)
    const terrainHeight = getTerrainHeight(this.model.position.x, this.model.position.z)
    this.model.position.y = terrainHeight + 1.5
    this.model = this.normalizeAndRescale(this.model, 1.0)
    this.scene.add(this.model)
  }

  setupKeyListeners() {
    window.addEventListener('keydown', (event) => {
      if (event.code === 'KeyW') { this.keys.W = true; this.playAnimation(Object.keys(this.actions)[0]) }
      if (event.code === 'KeyA') { this.keys.A = true; this.playAnimation(Object.keys(this.actions)[0]) }
      if (event.code === 'KeyS') { this.keys.S = true; this.playAnimation(Object.keys(this.actions)[0]) }
      if (event.code === 'KeyD') { this.keys.D = true; this.playAnimation(Object.keys(this.actions)[0]) }
      if (event.code === 'ArrowUp') { this.keys.Up = true; this.playAnimation(Object.keys(this.actions)[0]) }
      if (event.code === 'ArrowLeft') { this.keys.Left = true; this.playAnimation(Object.keys(this.actions)[0]) }
      if (event.code === 'ArrowDown') { this.keys.Down = true; this.playAnimation(Object.keys(this.actions)[0]) }
      if (event.code === 'ArrowRight') { this.keys.Right = true; this.playAnimation(Object.keys(this.actions)[0]) }
      if (event.code === 'Space' && !this.isJumping) { this.jump(); this.playAnimation(Object.keys(this.actions)[0]) }
    })
    window.addEventListener('keyup', (event) => {
      if (event.code === 'KeyW') { this.keys.W = false; this.stopAnimation() }
      if (event.code === 'KeyA') { this.keys.A = false; this.stopAnimation() }
      if (event.code === 'KeyS') { this.keys.S = false; this.stopAnimation() }
      if (event.code === 'KeyD') { this.keys.D = false; this.stopAnimation() }
      if (event.code === 'ArrowUp') { this.keys.Up = false; this.stopAnimation() }
      if (event.code === 'ArrowLeft') { this.keys.Left = false; this.stopAnimation() }
      if (event.code === 'ArrowDown') { this.keys.Down = false; this.stopAnimation() }
      if (event.code === 'ArrowRight') { this.keys.Right = false; this.stopAnimation() }
    })
    window.addEventListener('mousedown', (event) => {
      if (event.button === 2 && !this.isJumping) {
        this.jump()
      }
    })
  }

  playAnimation(name) {
    if (this.actions[name] && this.currentAction !== this.actions[name]) {
      if (this.currentAction) {
        this.currentAction.stop()
      }
      this.currentAction = this.actions[name]
      this.currentAction.reset().fadeIn(0.5).play()
    }
  }

  stopAnimation() {
    if (this.currentAction) {
      this.currentAction.fadeOut(0.5)
      this.currentAction = null
    }
  }

  jump() {
    this.isJumping = true
    this.velocity.y = this.jumpForce
  }

  update(deltaTime) {
    if (this.mixer) {
      this.mixer.update(deltaTime)
    }
    let moveX = 0
    let moveZ = 0
    if (this.keys.W) { moveZ -= 1 }
    if (this.keys.S) { moveZ += 1 }
    if (this.keys.A) { moveX -= 1 }
    if (this.keys.D) { moveX += 1 }
    let dir = new THREE.Vector3(moveX, 0, moveZ)
    if (dir.length() > 0) {
      dir.normalize()
      dir.multiplyScalar(this.speed * deltaTime)
    }
    let newX = this.model.position.x + dir.x
    let newZ = this.model.position.z + dir.z
    if (!this.verificaColisao(newX, newZ)) {
      this.model.position.x = newX
      this.model.position.z = newZ
    }
    this.velocity.y += this.gravity * deltaTime
    let newY = this.model.position.y + this.velocity.y * deltaTime
    this.model.position.y = newY
    let terrain = getTerrainHeight(this.model.position.x, this.model.position.z)
    let alturaChao = terrain + 1.5
    if (this.model.position.y < alturaChao) {
      this.model.position.y = alturaChao
      this.velocity.y = 0
      this.isJumping = false
    }
    if (dir.length() > 0) {
      const angle = Math.atan2(dir.x, dir.z)
      this.model.rotation.y = angle
    }
  }

  normalizeAndRescale(obj, newScale) {
    var scale = getMaxSize(obj)
    obj.scale.set(newScale * (1.0/scale), newScale * (1.0/scale), newScale * (1.0/scale))
    return obj
  }

  verificaColisao(xAlvo, zAlvo) {
    const alturaAlvo = getTerrainHeight(xAlvo, zAlvo)
    if ((alturaAlvo + 1.5) > this.model.position.y) {
      return true
    }
    return false
  }
}
