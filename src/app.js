import * as THREE from 'three'
import * as dat from 'dat.gui'

const gui = new dat.GUI()
const textureLoader = new THREE.TextureLoader()

const container = {
  el: document.querySelector('#scene'),
  height () {
    return this.el.getBoundingClientRect().height
  },
  width () {
    return this.el.getBoundingClientRect().width
  }
}
function texture (texture) {
  return textureLoader.load(texture)
}
function changeColor (property, color) {
  property.color.set(color)
}
function configLights (scene, camera, config) {
  const { lights, guiEnabled } = config
  let guiLightControls = false
  if (guiEnabled) {
    guiLightControls = gui.addFolder('Light Controls')
  }
  function createAmbientLight (intesity, color, guiFolder, scene) {
    const params = {
      color: color
    }
    const light = new THREE.AmbientLight(params.color, 0)
    if (guiFolder) {
      const folder = guiFolder.addFolder('Ambient')
      folder.add(light, 'intensity', 0, 5, 0.1)
      folder.addColor(params, 'color').onChange(() => {
        changeColor(light, params.color)
      })
    }
    scene.add(light)
  }
  function createPointLight (x, y, z, intensity, color, guiFolder, scene) {
    const params = {
      color: color
    }
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 24, 24),
      new THREE.MeshBasicMaterial({ color: params.color })
    )
    const light = new THREE.PointLight(params.color, 1)
    light.intensity = intensity
    light.position.x = x
    light.position.y = y
    light.position.z = z
    light.castShadow = true
    light.shadow.mapSize.width = 4096
    light.shadow.mapSize.height = 4096
    light.add(sphere)
    scene.add(light)
    if (guiFolder) {
      const amt = Object.keys(guiFolder.__folders).length + 1
      const folder = guiFolder.addFolder(`Light ${amt}`)
      folder.add(light, 'intensity', 0, 5, 0.1)
      folder.addColor(params, 'color').onChange(() => {
        changeColor(light, params.color)
        changeColor(sphere.material, params.color)
      })
      folder.add(light.position, 'x', -100, 100, 0.1, scene)
      folder.add(light.position, 'y', 0, 100, 0.1, scene)
      folder.add(light.position, 'z', -100, 100, 0.1, scene)
    }
  }
  createAmbientLight(0, 0x000000, guiLightControls, scene)
  lights.forEach(light => {
    createPointLight(
      light.x,
      light.y,
      light.z,
      light.intensity,
      light.color,
      guiLightControls,
      scene
    )
  })
}
function configFog (scene, renderer, config) {
  const { color, density, guiEnabled } = config
  renderer.setClearColor(color)
  scene.fog = new THREE.FogExp2(color, density)
  if (guiEnabled) {
    const guiSceneControls = gui.addFolder('Scene Controls')
    guiSceneControls
      .addColor(config, 'color')
      .name('Fog Color')
      .onChange(() => {
        changeColor(scene.fog, color)
        renderer.setClearColor(color)
      })
    guiSceneControls
      .add(scene.fog, 'density', 0, 0.15, 0.001)
      .name('Fog Density')
  }
}
function configGround (scene, size, config) {
  const { material, guiEnabled } = config
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshStandardMaterial(material)
  )
  plane.name = 'plane'
  plane.receiveShadow = true
  plane.rotation.x += THREE.Math.degToRad(-90)
  scene.add(plane)
  if (guiEnabled) {
    const guiMaterialControls = gui.addFolder('Ground Controls')
    guiMaterialControls.addColor(material, 'color').onChange(() => {
      changeColor(plane.material, material.color)
    })
    guiMaterialControls.add(plane.material, 'roughness', 0, 1, 0.001)
    guiMaterialControls.add(plane.material, 'metalness', 0, 1, 0.001)
  }
}
function configCamera (camera, scene, config) {
  const { position, rotation, guiEnabled } = config
  const pitch = new THREE.Group()
  const yaw = new THREE.Group()
  pitch.add(camera)
  yaw.add(pitch)
  scene.add(yaw)
  camera.position.x = position.x
  camera.position.y = position.y
  camera.position.z = position.z
  pitch.rotation.x = rotation.x
  yaw.rotation.y = rotation.y
  camera.rotation.z = rotation.z
  if (guiEnabled) {
    const guiCameraControls = gui.addFolder('Camera Controls')
    guiCameraControls
      .add(camera.position, 'x', -100, 100, 0.001)
      .name('Left/Right')
    guiCameraControls
      .add(camera.position, 'y', -100, 100, 0.001)
      .name('Down/Up')
    guiCameraControls
      .add(camera.position, 'z', -100, 100, 0.001)
      .name('Forward/Back')
    guiCameraControls
      .add(pitch.rotation, 'x', -Math.PI, Math.PI, 0.0001)
      .name('Pitch')
    guiCameraControls
      .add(yaw.rotation, 'y', -Math.PI, Math.PI, 0.0001)
      .name('Yaw')
    guiCameraControls
      .add(camera.rotation, 'z', -Math.PI, Math.PI, 0.0001)
      .name('Rotate')
  }
}
function configTorus (scene, config) {
  const { material, guiEnabled } = config
  const torus = new THREE.Mesh(
    new THREE.TorusKnotGeometry(3.5, 1, 100, 16),
    new THREE.MeshStandardMaterial({
      color: material.color,
      roughness: material.roughness,
      metalness: material.metalness
    })
  )
  torus.castShadow = true
  torus.name = 'torus'
  torus.position.y += torus.geometry.parameters.radius * 2
  scene.add(torus)
  if (guiEnabled) {
    const guiMaterialControls = gui.addFolder('Object Controls')
    guiMaterialControls.addColor(material, 'color').onChange(() => {
      torus.material.color.set(material.color)
    })
    guiMaterialControls.add(torus.material, 'roughness', 0, 1, 0.001)
    guiMaterialControls.add(torus.material, 'metalness', 0, 1, 0.001)
  }
}

function configScene (scene, camera, renderer) {
  configLights(scene, camera, {
    guiEnabled: false,
    lights: [
      { x: 100, y: 100, z: 100, intensity: 1.5, color: 0xffffff },
      { x: -100, y: 100, z: 100, intensity: 1, color: 0xffffff },
      { x: 0, y: 100, z: -100, intensity: 0.5, color: 0xffffff }
    ]
  })
  configCamera(camera, scene, {
    guiEnabled: false,
    position: {
      x: 0,
      y: 6,
      z: 25
    },
    rotation: {
      x: -0.25,
      y: 3.14,
      z: 0
    }
  })
  configGround(scene, 100, {
    guiEnabled: false,
    material: {
      color: 'rgb(70, 70, 70)',
      side: THREE.DoubleSide,
      roughness: 0.75,
      metalness: 0.25
    }
  })
  configTorus(scene, {
    guiEnabled: false,
    material: {
      color: 0xafafaf,
      roughness: 0.5,
      metalness: 0.75
    }
  })
  configFog(scene, renderer, {
    guiEnabled: false,
    color: 0x000000,
    density: 0.025
  })
}

function init (container, configScene) {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(
    55,
    container.width() / container.height(),
    0.1,
    1000
  )
  const renderer = new THREE.WebGLRenderer()
  renderer.setSize(container.width(), container.height())
  renderer.shadowMap.enabled = true
  let windowResizeTimer
  window.addEventListener('resize', () => {
    clearTimeout(windowResizeTimer)
    windowResizeTimer = setTimeout(() => {
      camera.aspect = container.width() / container.height()
      camera.updateProjectionMatrix()
      renderer.setSize(container.width(), container.height())
    }, 500)
  })
  configScene(scene, camera, renderer)
  container.el.appendChild(renderer.domElement)
  return { scene, camera, renderer }
}

function render (init) {
  const { scene, camera, renderer } = init
  renderer.render(scene, camera)
  const torus = scene.getObjectByName('torus')
  torus.rotation.x += 0.005
  torus.rotation.y += 0.005
  window.requestAnimationFrame(() => {
    render(init)
  })
}

const environment3d = init(container, configScene)
render(environment3d)
