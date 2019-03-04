import * as THREE from 'three'
import OrbitControls from 'three-orbitcontrols'
import * as dat from 'dat.gui'
const gui = new dat.GUI()
const clock = new THREE.Clock()

const grid = {
  size: 32,
  box: 1,
  distance: 4,
  frequency: 0.5,
  wavelength: 0.02,
  amplitude: 10
}

gui.add(grid, 'frequency', 0, 10, 0.01)
gui.add(grid, 'wavelength', 0, 1, 0.001)
gui.add(grid, 'amplitude', 0, 40, 0.001)

function fourQuadrantGrid (size, callback) {
  let offset = size / 2
  let start = offset * -1
  let i = 1
  let r = size * size
  for (let x = start; x < offset; x++) {
    for (let y = start; y < offset; y++) {
      callback(x, y, i, r)
      i++
      r--
    }
  }
}

const container = {
  el: document.querySelector('#scene'),
  height () {
    return this.el.getBoundingClientRect().height
  },
  width () {
    return this.el.getBoundingClientRect().width
  }
}

function configScene (scene, camera) {
  const light = new THREE.DirectionalLight(0xffffff, 1.5)
  light.castShadow = true
  light.shadow.camera.top = 50
  light.shadow.camera.bottom = -50
  light.shadow.camera.left = -50
  light.shadow.camera.right = 50
  light.shadow.bias = 0.001
  light.shadow.mapSize.width = 8192
  light.shadow.mapSize.height = 8192
  light.position.set(25, 50, 25)
  light.lookAt(0, 0, 0)
  scene.add(light)
  const ambient = new THREE.AmbientLight('rgb(60,0,155)', 2)
  scene.add(ambient)
  scene.fog = new THREE.FogExp2('rgb(20,0,155)', 0.0055)

  const boxGrid = new THREE.Group()
  fourQuadrantGrid(grid.size, (x, y, offset) => {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(grid.box, grid.box, grid.box),
      new THREE.MeshPhongMaterial({ color: 'rgb(165, 165, 165)' })
    )
    box.name = `box-${x}-${y}`
    box.castShadow = true
    box.position.x = x * grid.distance
    box.position.z = y * grid.distance
    boxGrid.add(box)
  })
  boxGrid.position.y = boxGrid.children[0].geometry.parameters.height * 0.5
  boxGrid.name = 'boxGrid'
  scene.add(boxGrid)

  camera.position.x = 100
  camera.position.z = 25
  camera.position.y = 25
  camera.lookAt(0, 0, 0)
}

function init (container, configScene) {
  const scene = new THREE.Scene()
  const cam = {
    fov: 55,
    aspect: container.width() / container.height(),
    near: 0.1,
    far: 1000
  }
  const camera = new THREE.PerspectiveCamera(
    cam.fov,
    cam.aspect,
    cam.near,
    cam.far
  )
  configScene(scene, camera)
  const renderer = new THREE.WebGLRenderer()
  renderer.setSize(container.width(), container.height())
  renderer.shadowMap.enabled = true
  renderer.setClearColor('rgb(020,0,155)')
  container.el.appendChild(renderer.domElement)
  const controls = new OrbitControls(camera, renderer.domElement)
  return { scene, camera, renderer, controls }
}

function render (init) {
  const { scene, camera, renderer, controls } = init
  renderer.render(scene, camera)
  controls.update()
  fourQuadrantGrid(grid.size, (x, y, i, r) => {
    const box = scene.getObjectByName(`box-${x}-${y}`)
    box.position.y = Math.sin(
      clock.getElapsedTime() *
      grid.frequency +
      ((x + (r / 16)) * (y + (i * -0.4))) *
      grid.wavelength
    ) * grid.amplitude
  })
  window.requestAnimationFrame(() => {
    render(init)
  })
}

window.environment3d = init(container, configScene)
render(window.environment3d)
