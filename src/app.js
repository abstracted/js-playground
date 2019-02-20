import * as THREE from 'three'

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
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshPhongMaterial({ color: 'rgb(155, 155, 155)' })
  )
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 5),
    new THREE.MeshPhongMaterial({ color: 'rgb(125, 125, 125)', side: THREE.DoubleSide })
  )
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 24, 24),
    new THREE.MeshBasicMaterial({ color: 'rgb(255, 255, 255)' })
  )

  box.name = 'mybox'
  plane.name = 'myplane'
  scene.add(plane)
  scene.add(box)
  plane.rotation.x += THREE.Math.degToRad(90)
  box.position.y += box.geometry.parameters.height * 0.5

  camera.position.x = 1
  camera.position.y = 2
  camera.position.z = 5
  camera.lookAt(box.position.x, box.position.y, box.position.z)

  const light = new THREE.PointLight('rgb(255, 255, 255)', 1)
  light.add(sphere)
  scene.add(light)
  light.position.y = 1.8
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
  renderer.setClearColor('rgb(205, 205, 205)')
  container.el.appendChild(renderer.domElement)
  return { scene, camera, renderer }
}

function render (init) {
  const { scene, camera, renderer } = init
  const box = scene.getObjectByName('mybox')
  const plane = scene.getObjectByName('myplane')
  box.rotation.z += 0.005
  plane.rotation.z -= 0.005
  renderer.render(scene, camera)
  window.requestAnimationFrame(() => {
    render(init)
  })
}

window.environment3d = init(container, configScene)
render(window.environment3d)
console.log(window.environment3d)
