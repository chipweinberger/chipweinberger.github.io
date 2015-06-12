//# sourceMappingURL=app.js.map
/// <reference path="main.ts"/>
var canvs = document.getElementById("raytrace");
var rayTrace_fov = MAIN_fov * 1.2;
function initRaytrace() {
}
var antialiasing = {
    jittered: true,
    n: 1,
};
var pendingRayTraces = [];
function raytrace() {
    var width = parseInt(canvas.getAttribute("width"));
    var height = parseInt(canvas.getAttribute("height"));
    //dir to upper left
    var RotXbig = new THREE.Matrix4().makeRotationY(-THREE.Math.degToRad(rayTrace_fov / 2));
    var RotYbig = new THREE.Matrix4().makeRotationX(THREE.Math.degToRad(rayTrace_fov / 2));
    var RotXYbig = new THREE.Matrix4().multiplyMatrices(RotXbig, RotYbig);
    var upper_left = new THREE.Vector3(0, 0, -1).applyMatrix4(RotXYbig);
    //shoot rays
    for (var x = 0; x < width; x++) {
        pendingRayTraces.push(window.setTimeout(raytraceBlocking, 0, x, width, height, upper_left));
    }
}
function raytraceBlocking(x, width, height, upper_left) {
    for (var y = 0; y < height; y++) {
        var avg_pix = new THREE.Vector3(0, 0, 0);
        //antialiasing
        for (var xSample = 0; xSample < antialiasing.n; xSample++) {
            for (var ySample = 0; ySample < antialiasing.n; ySample++) {
                var x2 = x + xSample / antialiasing.n; //clone
                var y2 = y + ySample / antialiasing.n; //clone
                //org
                var org = new THREE.Vector3(0, 0, 0);
                //jitter
                if (antialiasing.jittered) {
                    var step = 1 / antialiasing.n;
                    x2 = THREE.Math.randFloat(x2, x2 + step);
                    y2 = THREE.Math.randFloat(y2, y2 + step);
                }
                var degX = x2 / width * rayTrace_fov;
                var degY = y2 / width * rayTrace_fov;
                var RotX = new THREE.Matrix4().makeRotationY(THREE.Math.degToRad(degX));
                var RotY = new THREE.Matrix4().makeRotationX(-THREE.Math.degToRad(degY));
                var RotXY = new THREE.Matrix4().multiplyMatrices(RotY, RotX); //opposite order
                var dest = upper_left.clone().applyMatrix4(RotXY);
                //apply view matrix
                org.applyMatrix4(new THREE.Matrix4().getInverse(MAIN_rayTraceRot));
                org.applyMatrix4(new THREE.Matrix4().getInverse(MAIN_transMatrix));
                dest.applyMatrix4(new THREE.Matrix4().getInverse(MAIN_rayTraceRot));
                dest.applyMatrix4(new THREE.Matrix4().getInverse(MAIN_transMatrix));
                var color = trace(org, dest, 0);
                color.divideScalar(antialiasing.n * antialiasing.n);
                avg_pix.add(color);
            }
        }
        //set pixel color
        var ctx = canvs.getContext("2d");
        var p = avg_pix.clone().multiplyScalar(255).round();
        ctx.fillStyle = "rgba(" + p.x + "," + p.y + "," + p.z + "," + 255 + ")";
        ctx.fillRect(800 - x, y, 1, 1);
    }
}
var addline = function (p1, p2) {
    var material = new THREE.LineBasicMaterial({
        color: 0x0000ff
    });
    var dir = new THREE.Vector3().subVectors(p2, p1);
    var geometry = new THREE.Geometry();
    geometry.vertices.push(p1, p2);
    //geometry.vertices.push(p1, new THREE.Vector3().addVectors(p1, dir.multiplyScalar(8)));
    var line = new THREE.Line(geometry, material);
    scene.add(line);
};
//traces a single ray
function trace(org, dest, recursive_depth, originating_obj) {
    if (originating_obj === void 0) { originating_obj = null; }
    var dir = new THREE.Vector3().subVectors(dest, org);
    var nearestObj = null;
    var dist = 99999999;
    var nearestIntersection = null;
    for (var i in object_list) {
        var obj = object_list[i];
        //if (obj == originating_obj)
        //continue//no interreflection for now. alternatively: round small errors as zero distance
        var intersection = getIntersection(obj, org, dest);
        if (intersection && intersection != org) {
            var d = new THREE.Vector3().subVectors(intersection, org).length();
            if (d < dist && d > 0.0001) {
                dist = d;
                nearestObj = obj;
                nearestIntersection = intersection;
            }
        }
    }
    if (nearestObj) {
        //if (nearestObj.material.transmission == 1)
        //  if (Math.random() < 0.02)
        //    addline(intersection, newDest)
        intersection = nearestIntersection;
        //phong shading
        obj = nearestObj;
        var amb = obj.material.amb.clone();
        var normal = getNormal(obj, dest, intersection);
        var difStrength = 0.0;
        var specStrength = 0.0;
        for (var j in lights) {
            var light = lights[j];
            if (light.on) {
                var dirToLight = new THREE.Vector3().subVectors(light.pos, intersection).normalize();
                //check if in shadow
                if (isShadowed(intersection, light.pos)) {
                    continue;
                }
                else {
                    //diffuse
                    difStrength += normal.clone().dot(dirToLight) * light.strength;
                    //specular
                    var reflection = dirToLight.clone().reflect(normal).normalize();
                    var theta = Math.max(reflection.clone().dot(dir), 0);
                    var shny = obj.material.shiny;
                    theta = Math.pow(theta, shny);
                    specStrength += theta * light.strength;
                    //should scale by ligth distance here
                    var distToLight = new THREE.Vector3().subVectors(intersection, light.pos).length();
                    difStrength *= 1 / (distToLight); //not phyiscally correct
                    specStrength *= 1 / (distToLight);
                }
            }
        }
        //texture mapping
        if (obj.material.texture)
            var textureColor = getTextureColor(obj, intersection);
        //get add up colors
        var phongColor = new THREE.Vector3(0, 0, 0);
        phongColor.add(amb);
        phongColor.add(obj.material.spec.clone().multiplyScalar(specStrength));
        //if texture, use texture color as diffuse color
        if (obj.material.texture) {
            var Ds = obj.material.diff.length();
            phongColor.add(textureColor.clone().multiplyScalar(difStrength).multiplyScalar(Ds));
        }
        else {
            phongColor.add(obj.material.diff.clone().multiplyScalar(difStrength));
        }
        //if mirror
        var mirrorColor = new THREE.Vector3(0, 0, 0);
        if (obj.material.mirror.length() > 0) {
            //if (Math.random() < 0.02)
            //  addline(intersection, intersection.clone().add(normal))
            var reflection = dir.reflect(normal).normalize();
            var reflect_dest = intersection.clone().add(reflection);
            //shoot another ray
            if (recursive_depth != MAIN_maxRecursion) {
                mirrorColor = trace(intersection, reflect_dest, recursive_depth + 1, obj);
                mirrorColor.x *= obj.material.mirror.x;
                mirrorColor.y *= obj.material.mirror.y;
                mirrorColor.z *= obj.material.mirror.z;
            }
        }
        //refraction
        var transmissionColor = new THREE.Vector3(0, 0, 0);
        if (obj.material.transmission > 0) {
            var refr1;
            if (originating_obj)
                refr1 = originating_obj.material.indexOfRefraction;
            else
                refr1 = 1;
            var refr2;
            if (originating_obj == obj)
                refr2 = 1;
            else
                refr2 = obj.material.indexOfRefraction;
            var indexOfRef = refr2 / refr1;
            if (originating_obj == obj)
                normal.multiplyScalar(-1);
            var cross = new THREE.Vector3().crossVectors(normal.normalize(), dir.normalize());
            var sin0 = cross.length();
            var sin1 = sin0 / indexOfRef;
            var newDir = dir.clone().applyAxisAngle(cross, Math.asin(sin0) - Math.asin(sin1));
            var newDest = new THREE.Vector3().addVectors(intersection, newDir);
            //if (Math.random() < 0.02)
            //  addline(intersection, newDest )
            //shoot another ray
            if (recursive_depth != MAIN_maxRecursion + 1) {
                transmissionColor = trace(intersection, newDest, recursive_depth + 1, obj).multiplyScalar(obj.material.transmission);
            }
        }
        return new THREE.Vector3(0, 0, 0).addVectors(phongColor, mirrorColor).add(transmissionColor);
    }
    else {
        return new THREE.Vector3(0, 0, 0);
    }
}
//each object has its own type of texture mapping so we need a function to handle that
function getTextureColor(obj, point) {
    if (obj.material.texture) {
        var imgData = MAIN_textures[obj.material.texture];
        switch (obj.type) {
            case "plane":
                var width = imgData.width;
                var height = imgData.height;
                var pixY = Math.abs(Math.floor((point.x * 100) % width));
                var pixX = Math.abs(Math.floor((point.z * 100) % height));
                var i = (width * pixY + pixX) * 4;
                var d = imgData.data;
                return new THREE.Vector3(d[i] / 255.0, d[i + 1] / 255.0, d[i + 2] / 255.0);
                break;
        }
        return new THREE.Vector3(0, 0, 0);
    }
    else {
        return new THREE.Vector3(0, 0, 0);
    }
}
function isShadowed(point, lightpos) {
    var dirToLight = new THREE.Vector3().subVectors(lightpos, point).normalize();
    var dest = new THREE.Vector3().addVectors(point, dirToLight);
    for (var i in object_list) {
        var obj = object_list[i];
        var intersect = getIntersection(obj, point, dest);
        var lenToLight = new THREE.Vector3().subVectors(lightpos, point).length();
        if (intersect) {
            var intersectDist = new THREE.Vector3().subVectors(point, intersect).length();
            if (intersectDist < lenToLight && intersectDist > 0.001)
                return true;
        }
    }
    return false;
}
//takes and output in world space 
function getIntersection(obj, org, dest) {
    var invScale = new THREE.Matrix4().makeScale(1 / obj.scale.x, 1 / obj.scale.y, 1 / obj.scale.z);
    var scale = new THREE.Matrix4().makeScale(obj.scale.x, obj.scale.y, obj.scale.z);
    var rot = new THREE.Matrix4().makeRotationFromQuaternion(obj.rot);
    var rotT = rot.clone().transpose();
    var org = org.clone().sub(obj.pos).applyMatrix4(rotT).applyMatrix4(invScale);
    var dest = dest.clone().sub(obj.pos).applyMatrix4(rotT).applyMatrix4(invScale);
    var dir = new THREE.Vector3().subVectors(dest, org).normalize();
    switch (obj.type) {
        case "sphere":
            var cen = obj.pos;
            var a = dir.length() * dir.length();
            var b = org.dot(dir);
            var c = (org.length() * org.length()) - 1;
            break;
        case "cylinder":
            var a = (dir.x * dir.x) + (dir.y * dir.y);
            var b = 2 * (org.x * dir.x + org.y * dir.y);
            var c = (org.x * org.x) + (org.y * org.y) - 1;
            break;
        case "cone":
            var a = (dir.x * dir.x) + (dir.y * dir.y) - (dir.z * dir.z);
            var b = 2 * (org.x * dir.x + org.y * dir.y - org.z * dir.z);
            var c = (org.x * org.x) + (org.y * org.y) - (org.z * org.z);
            break;
        case "plane":
            if (dir.y < 0) {
                var t = org.y / dir.y * -1;
                return org.clone().add(dir.multiplyScalar(t));
            }
            else {
                return null;
            }
            break;
    }
    var disc = (b * b) - (a * c);
    if (disc > 0) {
        var t0 = (-b) / a + Math.sqrt(b * b - a * c) / (a);
        var t1 = (-b) / a - Math.sqrt(b * b - a * c) / (a);
        //model space points
        var p0 = org.clone().add(dir.clone().multiplyScalar(t0));
        var p1 = org.clone().add(dir.clone().multiplyScalar(t1));
        var len0 = new THREE.Vector3().subVectors(p0, org).length();
        var len1 = new THREE.Vector3().subVectors(p1, org).length();
        //only allow rays to move forward in time
        var candidates = [];
        if (t0 > 0.01)
            candidates.push(p0.applyMatrix4(scale).applyMatrix4(rot).add(obj.pos)); //convert back to world space
        if (t1 > 0.01)
            candidates.push(p1.applyMatrix4(scale).applyMatrix4(rot).add(obj.pos));
        if (candidates.length == 2) {
            if (len0 < len1)
                return p0;
            else
                return p1;
        }
        else {
            return candidates[0];
        }
    }
    else {
        return null;
    }
}
function getNormal(obj, dest, intersection) {
    var rot = new THREE.Matrix4().makeRotationFromQuaternion(obj.rot);
    var rotT = rot.clone().transpose();
    switch (obj.type) {
        case "sphere":
            var invTrans = new THREE.Matrix4().getInverse(new THREE.Matrix4().makeScale(obj.scale.x, obj.scale.y, obj.scale.z)).transpose();
            return new THREE.Vector3().subVectors(intersection, obj.pos).applyMatrix4(rotT).applyMatrix4(invTrans).normalize();
            break;
        case "cylinder":
            var invTrans = new THREE.Matrix4().getInverse(new THREE.Matrix4().makeScale(obj.scale.x, obj.scale.y, obj.scale.z)).transpose();
            var t = new THREE.Vector3(obj.x, obj.y, 0);
            return new THREE.Vector3().subVectors(intersection, t).applyMatrix4(rotT).applyMatrix4(invTrans).normalize();
            break;
        case "plane":
            return new THREE.Vector3(0, 1, 0);
            break;
    }
    return new THREE.Vector3(1, 1, 1);
}
//# sourceMappingURL=raytrace.js.map