import * as THREE from 'three'
import { getTerrainHeight } from './terrainNoise.js'

export default class Camera {
  constructor(camera, domElement) {
    this.domElement = domElement;
    this.camera = camera;
    this.speed = 5
    this.jumpForce = 10
    this.gravity = -20
    this.isJumping = false
    this.keys = { W: false, A: false, S: false, D: false, Space: false, Down: false, Up: false, Left: false, Right: false }
    this.velocity = new THREE.Vector3(0, 0, 0)
    this.setupKeyListeners()
  }

  setupKeyListeners() {
    window.addEventListener('keydown', (event) => {
      if (event.code === 'KeyW') { this.keys.W = true;}
      if (event.code === 'KeyA') { this.keys.A = true;}
      if (event.code === 'KeyS') { this.keys.S = true;}
      if (event.code === 'KeyD') { this.keys.D = true;}
      if (event.code === 'ArrowUp') { this.keys.Up = true;}
      if (event.code === 'ArrowLeft') { this.keys.Left = true;}
      if (event.code === 'ArrowDown') { this.keys.Down = true;}
      if (event.code === 'ArrowRight') { this.keys.Right = true;}
      if (event.code === 'Space' && !this.isJumping) { this.jump();}
    })
    window.addEventListener('keyup', (event) => {
      if (event.code === 'KeyW') { this.keys.W = false;}
      if (event.code === 'KeyA') { this.keys.A = false;}
      if (event.code === 'KeyS') { this.keys.S = false;}
      if (event.code === 'KeyD') { this.keys.D = false;}
      if (event.code === 'ArrowUp') { this.keys.Up = false;}
      if (event.code === 'ArrowLeft') { this.keys.Left = false;}
      if (event.code === 'ArrowDown') { this.keys.Down = false;}
      if (event.code === 'ArrowRight') { this.keys.Right = false;}
    })
    window.addEventListener('mousedown', (event) => {
      if (event.button === 2 && !this.isJumping) {
        this.jump()
      }
    })
  }

  jump() {
    this.isJumping = true
    this.velocity.y = this.jumpForce
  }

  update(deltaTime) {
    let moveX = 0
    let moveZ = 0
    if (this.keys.W || this.keys.Up) { moveZ -= 1;}
    if (this.keys.S || this.keys.Down) { moveZ += 1;}
    if (this.keys.A || this.keys.Left) { moveX -= 1;}
    if (this.keys.D || this.keys.Right) { moveX += 1;}
    let dir = new THREE.Vector3(moveX, 0, moveZ)
    if (dir.length() > 0) {
      dir.normalize()
      dir.multiplyScalar(this.speed * deltaTime)
    }
    let newX = this.camera.position.x + dir.x
    let newZ = this.camera.position.z + dir.z
    
    this.camera.position.x = newX
    this.camera.position.z = newZ

    this.velocity.y += this.gravity * deltaTime
    let newY = this.camera.position.y + this.velocity.y * deltaTime
    this.camera.position.y = newY
    let terrain = getTerrainHeight(this.camera.position.x, this.camera.position.z)
    let alturaChao = terrain + 1.5
    if (this.camera.position.y < alturaChao) {
      this.camera.position.y = alturaChao
      this.velocity.y = 0
      this.isJumping = false
    }
  }
}
