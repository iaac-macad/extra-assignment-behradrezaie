// Import libraries
import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { Rhino3dmLoader } from "three/addons/loaders/3DMLoader.js"
import rhino3dm from "rhino3dm"
import { RhinoCompute } from "rhinocompute"

const definitionName = "WavePavilion.gh"

// Set up sliders
const Entrance_Width_slider = document.getElementById("Entrance_Width")
Entrance_Width_slider.addEventListener("mouseup", onSliderChange, false)
Entrance_Width_slider.addEventListener("touchend", onSliderChange, false)

const Exit_Width_slider = document.getElementById("Exit_Width")
Exit_Width.addEventListener("mouseup", onSliderChange, false)
Exit_Width.addEventListener("touchend", onSliderChange, false)

const Height_slider = document.getElementById("Height")
Height_slider.addEventListener("mouseup", onSliderChange, false)
Height_slider.addEventListener("touchend", onSliderChange, false)

const Number_of_Panels_slider = document.getElementById("Number_of_Panels")
Number_of_Panels_slider.addEventListener("mouseup", onSliderChange, false)
Number_of_Panels_slider.addEventListener("touchend", onSliderChange, false)

const Panel_Thickness_slider = document.getElementById("Panel_Thickness")
Panel_Thickness.addEventListener("mouseup", onSliderChange, false)
Panel_Thickness.addEventListener("touchend", onSliderChange, false)

const loader = new Rhino3dmLoader()
loader.setLibraryPath("https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/")

let rhino, definition, doc
rhino3dm().then(async (m) => {
  console.log("Loaded rhino3dm.")
  rhino = m // global

  RhinoCompute.url = "http://localhost:8081/" //if debugging locally.

  // load a grasshopper file!

  const url = definitionName
  const res = await fetch(url)
  const buffer = await res.arrayBuffer()
  const arr = new Uint8Array(buffer)
  definition = arr

  init()
  compute()
})

/**
 * This function is responsible for gathering values and sending them to local compute server
 */
async function compute() {
  // Create and assign first parameter value
  const param1 = new RhinoCompute.Grasshopper.DataTree("Entrance Width")
  param1.append([0], [Entrance_Width_slider.valueAsNumber])
  
  const param2 = new RhinoCompute.Grasshopper.DataTree("Exit Width")
  param2.append([0], [Exit_Width_slider.valueAsNumber])

  const param3 = new RhinoCompute.Grasshopper.DataTree("Height")
  param3.append([0], [Height_slider.valueAsNumber])

  const param4 = new RhinoCompute.Grasshopper.DataTree("Number of Panels")
  param4.append([0], [Number_of_Panels.valueAsNumber])

  const param5 = new RhinoCompute.Grasshopper.DataTree("Panel Thickness")
  param5.append([0], [Panel_Thickness_slider.valueAsNumber])

  // clear values
  const trees = []
  trees.push(param1)
  trees.push(param2)
  trees.push(param3)
  trees.push(param4)
  trees.push(param5)

  // Run the definition
  const res = await RhinoCompute.Grasshopper.evaluateDefinition(
    definition,
    trees
  )

  doc = new rhino.File3dm()

  // hide spinner
  document.getElementById("loader").style.display = "none"

  //decode grasshopper objects and put them into a rhino document
  for (let i = 0; i < res.values.length; i++) {
    for (const [key, value] of Object.entries(res.values[i].InnerTree)) {
      for (const d of value) {
        const data = JSON.parse(d.data)
        const rhinoObject = rhino.CommonObject.decode(data)
        doc.objects().add(rhinoObject, null)
      }
    }
  }

  // go through the objects in the Rhino document

  let objects = doc.objects()
  for (let i = 0; i < objects.count; i++) {
    const rhinoObject = objects.get(i)

    // assign geometry userstrings to object attributes
    if (rhinoObject.geometry().userStringCount > 0) {
      const g_userStrings = rhinoObject.geometry().getUserStrings()
      rhinoObject.attributes().setUserString(g_userStrings[0][0], g_userStrings[0][1])

      //iterate through userData and store all userdata to geometry
      for (let j = 0; j < g_userStrings.length; j++) {
        rhinoObject
          .attributes()
          .setUserString(g_userStrings[j][0], g_userStrings[j][1])
      }

      // rhinoObject.attributes().setUserString(g_userStrings[0][0], g_userStrings[0][1])
    }
  }

  // clear objects from scene
  scene.traverse((child) => {
    if (!child.isLight) {
      scene.remove(child)
    }
  })

  const buffer = new Uint8Array(doc.toByteArray()).buffer
  loader.parse(buffer, function (object) {
    // go through all objects, check for userstrings and assing colors

    object.traverse((child) => {
      console.log(child)
      if (child.isLine) {
        if (child.userData.attributes.geometry.userStringCount > 0) {
          //get color from userStrings
          const colorData = child.userData.attributes.userStrings[0]
          const col = colorData[1]

          //convert color from userstring to THREE color and assign it
          const threeColor = new THREE.Color("rgb(" + col + ")")
          const mat = new THREE.LineBasicMaterial({ color: threeColor })
          child.material = mat
        }
      }
    })

    ///////////////////////////////////////////////////////////////////////
    // add object graph from rhino model to three.js scene
    scene.add(object)
  })
}

function onSliderChange() {
  // show spinner
  document.getElementById("loader").style.display = "block"
  compute()
}

// THREE BOILERPLATE //
let scene, camera, renderer, controls

/**
 * ThreeJS scene initiation with camera, rendered and lights setup
 */
function init() {
  // Listen to event of changin the screen size so camera can adjust
  window.addEventListener("resize", onWindowResize, false)

  // create a scene and a camera
  scene = new THREE.Scene()
  scene.background = new THREE.Color(173, 215, 230);
  THREE.Object3D.DefaultUp = new THREE.Vector3( 0, 0, 0 );
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(-150, -50, 50);
  camera.up.set(0, 0, 1);
  camera.lookAt(0, 0, 30);

  //camera.Translate(0, 0, 10);

  // create the renderer and add it to the html
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)

  // add some controls to orbit the camera
  controls = new OrbitControls(camera, renderer.domElement)

  // add a directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff)
  directionalLight.intensity = 2
  scene.add(directionalLight)

    //ambient light
    var light = new THREE.AmbientLight(0xffffff, 2);
    scene.add(light);

  animate()
}

/**
 * Refresh the renfered every frame
 */
function animate() {
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}

/**
 * Adjust scene size to the window width and height
 */
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  animate()
}

function meshToThreejs(mesh, material) {
  const loader = new THREE.BufferGeometryLoader()
  const geometry = loader.parse(mesh.toThreejsJSON())
  return new THREE.Mesh(geometry, material)
}

