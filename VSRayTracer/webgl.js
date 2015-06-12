var canvas = document.getElementById("webgl");
var SCREEN_WIDTH = canvas.getAttribute("width");
var SCREEN_HEIGHT = canvas.getAttribute("height");
var camera, scene, renderer, mesh;
var cameraPerspective;
var renderer;
var lightSphere = [];
function initWebgl() {
    camera = new THREE.PerspectiveCamera(70, 1, 0.1, 1000);
    camera.position.set(0, 4, 20);
    camera.up.set = new THREE.Vector3(0, 0, -1);
    camera.lookAt(new THREE.Vector3(0, 0, -1));
    console.log(camera.projectionMatrix);
    // renderer
    renderer = new THREE.WebGLRenderer({ canvas: canvas });
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    // scene
    scene = new THREE.Scene();
    // camera
    camera = new THREE.Camera();
    scene.add(camera);
    camera.projectionMatrix = MAIN_viewMatrix;
    for (var i in object_list) {
        var obj = object_list[i];
        switch (obj.type) {
            case "sphere":
                var sp = new THREE.Mesh(new THREE.SphereGeometry(1, 100, 100), new THREE.MeshNormalMaterial());
                sp.position.set(obj.pos.x, obj.pos.y, obj.pos.z);
                sp.scale.set(obj.scale.x, obj.scale.y, obj.scale.z);
                sp.rotation.set(obj.rot.x * Math.PI / 2, obj.rot.y * Math.PI / 2, obj.rot.z * Math.PI / 2);
                sp["assoc_light"] = obj;
                lightSphere.push(sp);
                scene.add(sp);
                break;
            case "plane":
                var plane = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), new THREE.MeshBasicMaterial({ color: 0xA0888888, side: THREE.DoubleSide }));
                plane.position.set(obj.pos.x, obj.pos.y, obj.pos.z);
                plane.lookAt(new THREE.Vector3(0, 1, 0));
                scene.add(plane);
                break;
            case "cylinder":
                var plane = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1000), new THREE.MeshNormalMaterial());
                plane.position.set(obj.pos.x, obj.pos.y, obj.pos.z);
                plane.rotation.set(obj.rot.x * Math.PI / 2, obj.rot.y * Math.PI / 2, obj.rot.z * Math.PI / 2);
                scene.add(plane);
                break;
        }
    }
    for (i in lights) {
        var light = lights[i];
        var sp = new THREE.Mesh(new THREE.SphereGeometry(.3, 100, 100), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        sp.position.set(light.pos.x, light.pos.y, light.pos.z);
        scene.add(sp);
        sp["assoc_light"] = light;
        lightSphere.push(sp);
    }
}
function renderWebgl() {
    for (var i in lightSphere) {
        var sph = lightSphere[i];
        var light = sph.assoc_light;
        sph.position.set(light.pos.x, light.pos.y, light.pos.z);
    }
    camera.projectionMatrix = MAIN_viewMatrix;
    renderer.render(scene, camera);
}
//# sourceMappingURL=webgl.js.map