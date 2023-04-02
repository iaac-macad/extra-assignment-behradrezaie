// Import libraries
import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { Rhino3dmLoader } from "three/addons/loaders/3DMLoader.js"
import rhino3dm from "rhino3dm"
import { RhinoCompute } from "rhinocompute"

const definitionName = "furniture.gh"

// Set up sliders
const Legs_Width_Start_Point_slider = document.getElementById("Legs_Width_Start_Point")
Legs_Width_Start_Point_slider.addEventListener("mouseup", onSliderChange, false)
Legs_Width_Start_Point_slider.addEventListener("touchend", onSliderChange, false)

const Legs_Width_End_Point_slider = document.getElementById("Legs_Width_End_Point")
Legs_Width_End_Point.addEventListener("mouseup", onSliderChange, false)
Legs_Width_End_Point.addEventListener("touchend", onSliderChange, false)

const Legs_Length_Start_Point_slider = document.getElementById("Legs_Length_Start_Point")
Legs_Length_Start_Point_slider.addEventListener("mouseup", onSliderChange, false)
Legs_Length_Start_Point_slider.addEventListener("touchend", onSliderChange, false)

const Legs_Length_End_Point_slider = document.getElementById("Legs_Length_End_Point")
Legs_Length_End_Point.addEventListener("mouseup", onSliderChange, false)
Legs_Length_End_Point.addEventListener("touchend", onSliderChange, false)

const Legs_Height_Start_Point_slider = document.getElementById("Legs_Height_Start_Point")
Legs_Height_Start_Point.addEventListener("mouseup", onSliderChange, false)
Legs_Height_Start_Point.addEventListener("touchend", onSliderChange, false)

const Legs_Height_End_Point_slider = document.getElementById("Legs_Height_End_Point")
Legs_Height_End_Point.addEventListener("mouseup", onSliderChange, false)
Legs_Height_End_Point.addEventListener("touchend", onSliderChange, false)

const Rotation_Angel_slider = document.getElementById("Rotation_Angel")
Rotation_Angel.addEventListener("mouseup", onSliderChange, false)
Rotation_Angel.addEventListener("touchend", onSliderChange, false)

const uCount_slider = document.getElementById("uCount")
uCount.addEventListener("mouseup", onSliderChange, false)
uCount.addEventListener("touchend", onSliderChange, false)

const vCount_slider = document.getElementById("vCount")
vCount.addEventListener("mouseup", onSliderChange, false)
vCount.addEventListener("touchend", onSliderChange, false)

const Thickness_slider = document.getElementById("Thickness")
Thickness.addEventListener("mouseup", onSliderChange, false)
Thickness.addEventListener("touchend", onSliderChange, false)

const Smoothness_slider = document.getElementById("Smoothness")
Smoothness.addEventListener("mouseup", onSliderChange, false)
Smoothness.addEventListener("touchend", onSliderChange, false)

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
  // Create and asign first parameter value
  const param1 = new RhinoCompute.Grasshopper.DataTree("Legs_Width_Start_Point")
  param1.append([0], [Legs_Width_Start_Point_slider.valueAsNumber])
  
  const param2 = new RhinoCompute.Grasshopper.DataTree("Legs_Width_End_Point")
  param2.append([0], [Legs_Width_End_Point_slider.valueAsNumber])

  const param3 = new RhinoCompute.Grasshopper.DataTree("Legs_Length_Start_Point")
  param3.append([0], [Legs_Length_Start_Point_slider.valueAsNumber])

  const param4 = new RhinoCompute.Grasshopper.DataTree("Legs_Length_End_Point")
  param4.append([0], [Legs_Length_End_Point_slider.valueAsNumber])

  const param5 = new RhinoCompute.Grasshopper.DataTree("Legs_Height_Start_Point")
  param5.append([0], [Legs_Height_Start_Point_slider.valueAsNumber])
  
  const param6 = new RhinoCompute.Grasshopper.DataTree("Legs_Height_End_Point")
  param6.append([0], [Legs_Height_End_Point_slider.valueAsNumber])
  
  const param7 = new RhinoCompute.Grasshopper.DataTree("Rotation_Angel")
  param7.append([0], [Rotation_Angel_slider.valueAsNumber])
  
  const param8 = new RhinoCompute.Grasshopper.DataTree("uCount")
  param8.append([0], [uCount_slider.valueAsNumber])

  const param9 = new RhinoCompute.Grasshopper.DataTree("vCount")
  param9.append([0], [vCount_slider.valueAsNumber])

  const param10 = new RhinoCompute.Grasshopper.DataTree("Thickness")
  param10.append([0], [Thickness_slider.valueAsNumber])

  const param11 = new RhinoCompute.Grasshopper.DataTree("Smoothness")
  param11.append([0], [Smoothness_slider.valueAsNumber])

  // clear values
  const trees = []
  trees.push(param1)
  trees.push(param2)
  trees.push(param3)
  trees.push(param4)
  trees.push(param5)
  trees.push(param6)
  trees.push(param7)
  trees.push(param8)
  trees.push(param9)
  trees.push(param10)
  trees.push(param11)
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

    // asign geometry userstrings to object attributes
    if (rhinoObject.geometry().userStringCount > 0) {
      const g_userStrings = rhinoObject.geometry().getUserStrings()

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
  scene.background = new THREE.Color(1, 1, 1)
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.z = -30

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

  const ambientLight = new THREE.AmbientLight()
  scene.add(ambientLight)

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

