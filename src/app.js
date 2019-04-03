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
function texture (options) {
  let { xWrap, yWrap, xRepeat, yRepeat } = options
  const { src, wrap, repeat } = options
  xWrap = xWrap || wrap
  yWrap = yWrap || wrap
  xRepeat = xRepeat || repeat || 1
  yRepeat = yRepeat || repeat || 1
  function getWrap (type) {
    let wrap = THREE.ClampToEdgeWrapping
    if (type === 'repeat') {
      wrap = THREE.RepeatWrapping
    } else if (type === 'mirror') {
      wrap = THREE.MirroredRepeatWrapping
    }
    return wrap
  }
  const tex = textureLoader.load(src)
  tex.wrapS = getWrap(xWrap)
  tex.wrapT = getWrap(yWrap)
  tex.repeat.set(xRepeat, yRepeat)
  return tex
}
function materialGUI (name, object, materials) {
  const controls = gui.addFolder(`${name} Controls`)
  if (object.material.color && materials.color) {
    controls.addColor(materials, 'color').onChange(() => {
      object.material.color.set(materials.color)
    })
  }
  if (object.material.roughness) {
    controls.add(object.material, 'roughness', 0, 1, 0.001)
  }
  if (object.material.metalness) {
    controls.add(object.material, 'metalness', 0, 1, 0.001)
  }
  if (object.material.specular && materials.specular) {
    controls.addColor(materials, 'specular').onChange(() => {
      object.material.color.set(materials.specular)
    })
  }
  if (object.material.shininess) {
    controls.add(object.material, 'shininess', 0, 100, 0.001)
  }
  if (object.normalScale && materials.normalMap) {
    console.log(materials.normalMap)
    const params = {
      normalScale: 0
    }
    controls.add(params, 'normalScale', -10, 10, 0.01).onChange(value => {
      object.normalScale = new THREE.Vector2(value, value)
    })
  }
  if (object.displacementScale && materials.displacementMap) {
    controls.add(object.material, 'displacementScale', -10, 10, 0.01)
  }
  if (object.displacementBias && materials.displacementMap) {
    controls.add(object.material, 'displacementBias', -5, 5, 0.01)
  }
}
function configLights (scene, camera, config) {
  const { lights, guiEnabled } = config
  let guiLightControls = false
  if (guiEnabled) {
    guiLightControls = gui.addFolder('Light Controls')
  }
  function createAmbientLight (intensity, color, guiFolder, scene) {
    const params = {
      color: color
    }
    const light = new THREE.AmbientLight(params.color, intensity)
    light.position.y = 100
    if (guiFolder) {
      const folder = guiFolder.addFolder('Ambient')
      folder.add(light, 'intensity', 0, 5, 0.01).onChange(() => {
        console.log(light)
      })
      folder.addColor(params, 'color').onChange(() => {
        light.color.set(params.color)
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
    light.shadow.mapSize.width = 2048
    light.shadow.mapSize.height = 2048
    light.add(sphere)
    scene.add(light)
    if (guiFolder) {
      const amt = Object.keys(guiFolder.__folders).length + 1
      const folder = guiFolder.addFolder(`Light ${amt}`)
      folder.add(light, 'intensity', 0, 5, 0.1)
      folder.addColor(params, 'color').onChange(() => {
        light.color.set(params.color)
        sphere.material.color.set(params.color)
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
        scene.fog.color.set(config.color)
        renderer.setClearColor(config.color)
      })
    guiSceneControls
      .add(scene.fog, 'density', 0, 0.15, 0.001)
      .name('Fog Density')
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
  const {
    name,
    materialType,
    material,
    guiEnabled,
    position,
    rotation,
    objectType,
    objectArgs
  } = config
  let threeMaterial
  switch (materialType.toLowerCase()) {
    case 'lambert':
      threeMaterial = new THREE.MeshLambertMaterial(material)
      break
    case 'phong':
      threeMaterial = new THREE.MeshPhongMaterial(material)
      break
    case 'standard':
      threeMaterial = new THREE.MeshStandardMaterial(material)
      break
    default:
      threeMaterial = new THREE.MeshBasicMaterial(material)
      break
  }
  const threeGeometry = (objectType, objectArgs) => {
    const geometry = [
      'BoxBufferGeometry',
      'BoxGeometry',
      'CircleBufferGeometry',
      'CircleGeometry',
      'ConeBufferGeometry',
      'ConeGeometry',
      'CylinderBufferGeometry',
      'CylinderGeometry',
      'DodecahedronBufferGeometry',
      'DodecahedronGeometry',
      'EdgesGeometry',
      'ExtrudeBufferGeometry',
      'ExtrudeGeometry',
      'IcosahedronBufferGeometry',
      'IcosahedronGeometry',
      'LatheBufferGeometry',
      'LatheGeometry',
      'OctahedronBufferGeometry',
      'OctahedronGeometry',
      'ParametricBufferGeometry',
      'ParametricGeometry',
      'PlaneBufferGeometry',
      'PlaneGeometry',
      'PolyhedronBufferGeometry',
      'PolyhedronGeometry',
      'RingBufferGeometry',
      'RingGeometry',
      'ShapeBufferGeometry',
      'ShapeGeometry',
      'SphereBufferGeometry',
      'SphereGeometry',
      'TetrahedronBufferGeometry',
      'TetrahedronGeometry',
      'TextBufferGeometry',
      'TextGeometry',
      'TorusBufferGeometry',
      'TorusGeometry',
      'TorusKnotBufferGeometry',
      'TorusKnotGeometry',
      'TubeBufferGeometry',
      'TubeGeometry',
      'WireframeGeometry'
    ]
    const geometryType = geometry.filter(
      geo => objectType.toLowerCase() === geo.toLowerCase()
    )
  }
  const objectName = name || objectType + scene.length
  const threeMesh = new THREE.Mesh(threeGeometry, threeMaterial)
  threeMesh.castShadow = true
  threeMesh.name = objectName
  scene.add(threeMesh)
  if (guiEnabled) {
    materialGUI(objectName, threeMesh, material)
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
  configGround(scene, 400, {
    guiEnabled: true,
    material: {
      color: 0xffffff,
      roughness: 1,
      metalness: 0,
      map: texture({
        src: 'assets/RockyDirt2_diffuse.png',
        wrap: 'repeat',
        repeat: 5
      })
    }
  })
  configTorus(scene, {
    guiEnabled: true,
    materialType: 'Basic',
    material: {
      color: 0xafafaf
    }
  })
  configFog(scene, renderer, {
    guiEnabled: false,
    color: 0x000000,
    density: 0.01
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
