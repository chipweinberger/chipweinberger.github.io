///<reference path="lib/three.d.ts" />
/*
Authors:
Code: Chip Weinberger - charlesweinberger2015@u.northwestern.edu
Level and Model Design: Jeremy Chase - jeremychase2015@u.northwestern.edu
*/
var scene, renderer;
var scenery, road;
var gamepadSupportAvailible, gamepads;
//stores resources and whether or not they have been loaded
var imagesArray = new Array();
var imageIsLoadedArray = new Array();
var object3DObjects = new Array();
var objIsLoadedArray = new Array();
var buttonStates = new Array();//the state of the keyboard buttons stored by keycode

/*
* The first thing that runs. Loads resources (images and obj files) into an array to be used later
*/
var init = function () {
    //load relevant images
    var imgFilenames = [];
    for(var i = 0; i < imgFilenames.length; i++) {
        imageIsLoadedArray[i] = false;
        var img = new Image();
        img.src = imgFilenames[i];
        img.tabIndex = i//I would make a new variable here but typscript isnt letting me so im using tabIndex arbitrarily
        ;
        img.onload = function () {
            imagesArray[this.tabIndex] = this;
            imageIsLoadedArray[this.tabIndex] = true;
            init2();
        };
    }
    //load relevant obj files
    var objFilenames = [
        'res/finalissuemapinside.obj', 
        'res/Motorcycle.obj', 
        'res/crashing car 3.obj', 
        'finalbackgroundtrack.obj'
    ];
    for(var j = 0; j < objFilenames.length; j++) {
        objIsLoadedArray[j] = false;
        loadObjFile(objFilenames[j], j);
    }
};
/*
* Returns '1' if everything has been loaded. Returns a percentage otherwise
*/
var loadedCompletionPercent = function () {
    var numberOfThingsToLoad = imageIsLoadedArray.length + objIsLoadedArray.length;
    var thingsLoaded = 0;
    for(var j = 0; j < imageIsLoadedArray.length; j++) {
        if(imageIsLoadedArray[j] === true) {
            thingsLoaded++;
        }
    }
    for(var jj = 0; jj < objIsLoadedArray.length; jj++) {
        if(objIsLoadedArray[jj] === true) {
            thingsLoaded++;
        }
    }
    return thingsLoaded / numberOfThingsToLoad;
};
/*
* The real initiation function.
*/
var init2 = function () {
    //makes sure everyting is loaded before actually executing init2
    if(loadedCompletionPercent() !== 1) {
        return;
    }
    //THREE.js boilerplate
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(new THREE.Color().setRGB(135 / 256, 206 / 256, 235 / 256), .8);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.setAttribute('z-index', '-1');
    document.body.appendChild(renderer.domElement);
    //road
    object3DObjects[1].scale = new THREE.Vector3(.0003, .0003, .0003);
    object3DObjects[2].scale = new THREE.Vector3(.0015, .0015, .0015);
    road = new Road(object3DObjects[0], object3DObjects[3]);
    var lastRand;
    for(var g = 0; g < 110; g++) {
        var rand = Math.random() * .01;
        var rand2 = Math.random() * 3;
        while(lastRand == rand2) {
            rand2 = Math.random() * 3;
        }
        lastRand = rand2;
        road.addVehicle(new Vehicle(g / 110 + rand, .005, rand2, new THREE.Mesh(new THREE.CubeGeometry(.05, .05, .05), new THREE.MeshLambertMaterial(0xffff00))));
    }
    road.start(2)//the number of players
    ;
    //lights
    var light = new THREE.PointLight(0xffffff, 1, 1000);
    light.position.set(0, 50, 0);
    scene.add(light);
    gamepadSupportAvailible = !!navigator.webkitGetGamepads || !!navigator.webkitGamepads;
    if(gamepadSupportAvailible) {
        gamepads = navigator.webkitGetGamepads();
    }
    //keyboard inputs
    document.addEventListener('keydown', function (event) {
        buttonStates[event.keyCode] = true;
    });
    document.addEventListener('keyup', function (event) {
        buttonStates[event.keyCode] = false;
    });
    render();
};
var Road = function (object3D, scenery) {
    this.startingIndex = 80//the index the motos start at
    ;
    this.numPlayers;
    this.vehicles = new Array();
    this.motorcycles = new Array();
    this.paused = true;
    this.roadObject3D//the 3d model of the road. Must be continous. Faces must be listed in order.
    ;
    this.scenery//3d model of the scenery
    ;
    this.roadGeometry//the geometry class from the roadObject3d class
    ;
    this.roadHeightMap;
    this.middleRoadLine//THREE.Line class
    ;
    this.rightRoadLine;
    this.leftRoadLine;
    this.direction = 1//when positive means laps are clockwise and visversa
    ;
    //used to start and restart the game
    this.start = function (numPlayers) {
        this.motorcycles = new Array();
        var startIndex = this.startingIndex;
        var fwdVector = utils.fwdVectorFromLine(this.middleRoadLine, startIndex, this.direction);
        var rightRd = this.rightRoadLine.geometry.vertices[startIndex];
        var midRd = this.middleRoadLine.geometry.vertices[startIndex];
        var leftRd = this.leftRoadLine.geometry.vertices[startIndex];
        var w = window.innerWidth;
        var h = window.innerHeight;
        if(numPlayers === 4) {
            this.addMoto(new Motorcycle(0, rightRd, fwdVector, this, [
                37, 
                39
            ], {
                left: 0,
                top: h / 2,
                width: w / 2,
                height: h / 2
            }));
            this.addMoto(new Motorcycle(1, midRd, fwdVector, this, [
                65, 
                68
            ], {
                left: w / 2,
                top: h / 2,
                width: w / 2,
                height: h / 2
            }));
            this.addMoto(new Motorcycle(2, midRd, fwdVector, this, [
                74, 
                76
            ], {
                left: 0,
                top: 0,
                width: w / 2,
                height: h / 2
            }));
            this.addMoto(new Motorcycle(3, leftRd, fwdVector, this, [
                70, 
                72
            ], {
                left: w / 2,
                top: 0,
                width: w / 2,
                height: h / 2
            }));
        } else {
            if(numPlayers === 3) {
                this.addMoto(new Motorcycle(0, rightRd, fwdVector, this, [
                    37, 
                    39
                ], {
                    left: 0,
                    top: h / 2,
                    width: w / 2,
                    height: h / 2
                }));
                this.addMoto(new Motorcycle(1, midRd, fwdVector, this, [
                    65, 
                    68
                ], {
                    left: w / 2,
                    top: h / 2,
                    width: w / 2,
                    height: h / 2
                }));
                this.addMoto(new Motorcycle(2, leftRd, fwdVector, this, [
                    74, 
                    76
                ], {
                    left: 0,
                    top: 0,
                    width: w / 2,
                    height: h / 2
                }));
            } else {
                if(numPlayers === 2) {
                    this.addMoto(new Motorcycle(0, rightRd, fwdVector, this, [
                        37, 
                        39
                    ], {
                        left: 0,
                        top: 0,
                        width: w / 2,
                        height: h
                    }));
                    this.addMoto(new Motorcycle(1, leftRd, fwdVector, this, [
                        65, 
                        68
                    ], {
                        left: w / 2,
                        top: 0,
                        width: w / 2,
                        height: h
                    }));
                } else {
                    if(numPlayers === 1) {
                        this.addMoto(new Motorcycle(0, midRd, fwdVector, this, [
                            37, 
                            39
                        ], {
                            left: 0,
                            top: 0,
                            width: w,
                            height: h
                        }));
                    } else {
                        console.log("Error: Invalid number of players");
                    }
                }
            }
        }
        this.paused = false;
    };
    this.render = function () {
        var w = window.innerWidth;
        var h = window.innerHeight;
        var len = this.motorcycles.length;
        for(var i = 0; i < len; i++) {
            var l = this.motorcycles[i].viewport.left;
            var w = this.motorcycles[i].viewport.width;
            var h = this.motorcycles[i].viewport.height;
            var t = this.motorcycles[i].viewport.top;
            renderer.setViewport(l, t, w, h);
            renderer.setScissor(l, t, w, h);
            renderer.enableScissorTest(true);
            renderer.render(scene, this.motorcycles[i].motoCamera);
        }
    };
    this.pause = function () {
        this.paused = !this.paused;
    };
    this.init = function (object3D, scenery) {
        this.roadObject3D = object3D;
        this.scenery = scenery;
        this.roadGeometry = utils.getGeometryFromObject3d(object3D);
        this.roadHeightMap = new heightMap();
        this.roadHeightMap.generateHeightMapFromGeometry(this.roadGeometry, 4000, 4000);
        scene.add(this.roadObject3D);
        scene.add(this.scenery);
        this.middleRoadLine = this.lineFromRoadGeometry(this.roadGeometry, 0);
        this.leftRoadLine = this.lineFromRoadGeometry(this.roadGeometry, -.075);
        this.rightRoadLine = this.lineFromRoadGeometry(this.roadGeometry, .075);
        scene.add(this.middleRoadLine);
        scene.add(this.leftRoadLine);
        scene.add(this.rightRoadLine);
    };
    this.update = function () {
        if(!this.paused) {
            for(var i = 0; i < this.vehicles.length; i++) {
                this.vehicles[i].update();
            }
            for(var j = 0; j < this.motorcycles.length; j++) {
                this.motorcycles[j].update();
            }
        }
        //collisions
        this.checkCollisons();
        //places
        this.updatePlaces();
    };
    this.checkCollisons = function () {
        for(var i = 0; i < this.vehicles.length; i++) {
            this.vehicles[i].geometry.geometry.computeBoundingBox();
            var bb1 = this.vehicles[i].geometry.geometry.boundingBox;
            bb1.translate(this.vehicles[i].currentPosition.x, this.vehicles[i].currentPosition.y, this.vehicles[i].currentPosition.z);
            bb1 = new THREE.Box3().setFromCenterAndSize(this.vehicles[i].currentPosition, .05);
            for(var j = 0; j < this.motorcycles.length; j++) {
                this.motorcycles[j].geometry.computeBoundingBox();
                var bb2 = this.motorcycles[j].geometry.boundingBox;
                bb2.translate(this.motorcycles[j].position.x, this.motorcycles[j].position.y, this.motorcycles[j].position.z);
                bb1 = new THREE.Box3().setFromCenterAndSize(this.motorcycles[j].position, .05);
                if(bb1.isIntersectionBox(bb2)) {
                    this.motorcycles[j].speed = -this.motorcycles[j].speed;
                }
                if(this.motorcycles[j].position.distanceTo(this.vehicles[i].currentPosition) < .03) {
                    this.motorcycles[j].speed = this.motorcycles[j].speed / 2;
                }
            }
        }
    };
    var count = 0;
    this.updatePlaces = function () {
        //update places works by assiging each moto a number that characterizes its current lap, nearest index on the road, and distance to the next road vertex
        //these numbers with their motos are then added to an array and sorted.
        var places = new Array();
        count++;
        for(var i = 0; i < this.motorcycles.length; i++) {
            var map1 = (1 - 1 / (this.motorcycles[i].distToNextRoadIndex + 1));//maps distToNextRoadIndex to 0-1, smaller numbers are closer to 1
            
            //map2 accounts for the fact that vertex 79 should be higher than vertex 81 if the starting index is 80
            var map2;
            if(this.motorcycles[i].nearestRoadIndex < road.startingIndex) {
                map2 = ((this.motorcycles[i].nearestRoadIndex + 1 + road.middleRoadLine.geometry.vertices.length) * 10) / road.middleRoadLine.geometry.vertices.length;
            } else {
                //maps 1-10
                map2 = ((this.motorcycles[i].nearestRoadIndex + 1) * 10) / road.middleRoadLine.geometry.vertices.length;
            }//maps 1-10
            
            if(count % 60 === 0) {
                console.log(this.motorcycles[i].nearestRoadIndex, map2);
            }
            var total = (this.motorcycles[i].currentLap * 20) + map2 + map1;
            places.push({
                index: i,
                num: total
            });
        }
        places.sort(function (a, b) {
            if(a.num < b.num) {
                return 1;
            }
            if(a.num > b.num) {
                return -1;
            }
            return 0;
        });
        for(var j = 0; j < places.length; j++) {
            var ind = places[j].index;
            this.motorcycles[ind].currentPlace = j + 1;
        }
    };
    this.addVehicle = function (vehicle) {
        this.vehicles.push(vehicle);
    };
    this.addMoto = function (moto) {
        this.motorcycles.push(moto);
    };
    /*
    * Makes a line from the road geometry (for the other vehicles to follow).  Assumes the faces of the road are listed in order.
    * A positive offset will make the line slightly to the right of the road, and vis-versa
    */
    this.lineFromRoadGeometry = function (geom, offset) {
        var centerPointsGeometry = new THREE.Geometry();
        for(var i = 0; i < geom.faces.length; i++) {
            var centerVertex = geom.faces[i].centroid;
            var next = i + 1;
            if(next === geom.faces.length) {
                next = 0;
            }//wrap around
            
            var nextCenterVertex = geom.faces[next].centroid;//used to calculate fwdVector
            
            var fwdVector = new THREE.Vector3().subVectors(nextCenterVertex, centerVertex).normalize();
            var surfaceNormal = geom.faces[i].normal;//used to calculate the correct offset position
            
            var newVertex = new THREE.Vector3().addVectors(new THREE.Vector3().crossVectors(fwdVector, surfaceNormal).multiplyScalar(offset), centerVertex);
            centerPointsGeometry.vertices.push(newVertex);
        }
        return new THREE.Line(centerPointsGeometry);
    };
    this.init(object3D, scenery);
};
function Motorcycle(playerNumb, position, fwdVector, road, buttons, viewport) {
    this.HUDCanvasContext;
    this.viewport = viewport//has four properties: left, bottom,width,height;
    ;
    this.right//the keycode that is the right button
    ;
    this.left//the keycode that is the left button
    ;
    this.road = road;
    this.playerNumber = playerNumb;
    this.motoMesh = object3DObjects[1].clone();
    this.geometry;
    this.motoCamera;
    this.relativeCameraPosition = new THREE.Vector3(0, .03, -.08)//the location of the camera relative to the motorcycle
    ;
    this.position = position.clone()//starting position
    ;
    this.forwardVector = fwdVector.clone().normalize()//The vector that the moto is going
    ;
    this.maxSpeed = .015;
    this.speed = 0.0;
    this.lean = 0//the lean determines if the motorcycle is turning or not.
    ;
    this.maxLean = 20//the amount the motorcycle can lean Left or right.
    ;
    this.turnSpeed = .0019//how fast you can turn as a ratio to the amount of lean
    ;
    this.leanSpeed = 1.6;
    this.currentFaceNode;
    this.currentPlace = 1//the place the moto is in
    ;
    this.currentLap = 1;
    this.visitedIndexes = new Array(road.middleRoadLine.length)//makes sure all the indexes have been 'visited' before counting it as a lap
    ;
    this.nearestRoadIndex = road.startingIndex//used for determining the place
    ;
    this.distToNextRoadIndex//used for determining the place
    ;
    this.lastTimeUpdated = new Date().getTime();
    this.init = function (buttons) {
        this.motoMesh.position.set(this.position.x, road.roadHeightMap.getHeight(this.position.x, this.position.z), this.position.z);
        var surfaceNormal = road.roadHeightMap.getTerrainNormal(this.position.x, this.position.z);
        scene.add(this.motoMesh);
        //create heads up display canvas
        var canv = document.createElement('canvas');
        canv.id = 'headsUpDisplayPlayer' + this.playerNumber;
        canv.width = this.viewport.width;
        canv.height = this.viewport.height;
        canv.style.position = 'absolute';
        canv.style.left = this.viewport.left + 'px';
        canv.style.top = this.viewport.top + 'px';
        canv.setAttribute('z-index', '2');
        document.body.appendChild(canv);
        this.HUDCanvasContext = canv.getContext("2d");
        var aspectRatio = this.viewport.width / this.viewport.height;
        this.motoCamera = new THREE.PerspectiveCamera(75, aspectRatio, .0001, 5);
        for(var i = 0; i < buttons.length; i++) {
            var keycode;
            if(typeof buttons[i] === 'number') {
                keycode = buttons[i];
            } else {
                keycode = buttons[i].charCodeAt(0);
            }
            if(i == 0) {
                this.left = keycode;
            }
            if(i == 1) {
                this.right = keycode;
            }
        }
        this.geometry = utils.getGeometryFromObject3d(this.motoMesh);
    };
    this.timeSinceLastUpdate = function () {
        var currentTime = new Date().getTime();
        var difference = currentTime - this.lastTimeUpdated;
        this.lastTimeUpdated = currentTime;
        return difference;
    };
    this.pastYRotation = -utils.angleBetweenVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(this.forwardVector.x, 0, this.forwardVector.z));
    this.update = function () {
        var timeDifference = this.timeSinceLastUpdate();
        //forwardVector updates
        var surfaceNormal = road.roadHeightMap.getTerrainNormal(this.position.x, this.position.z);
        this.forwardVector.applyMatrix4(new THREE.Matrix4().rotateY(-this.lean * this.turnSpeed))//turn the vector
        ;
        //moto location updates
        var theta = 0;//the amount the moto has to turn before being on the track;initially zero.
        
        var position = new THREE.Vector3();
        var scaledForwardVector = this.forwardVector.clone().multiplyScalar(this.speed * timeDifference / 16);
        while(!position.y) {
            //if we went off the map, try turning the motorcycle (both ways)  until we are back on track
            var scaledFwdVec = scaledForwardVector.clone();
            scaledFwdVec.applyMatrix4(new THREE.Matrix4().rotateY(theta))//rotate according to theta
            ;
            position = this.position.clone();
            position = position.add(scaledFwdVec)//move to new position
            ;
            position.y = road.roadHeightMap.getHeight(position.x, position.z)//see if its on the map
            ;
            //move to next theta if the position is not on the map
            if(!position.y) {
                theta = -theta//try both positive and negative
                ;
                if(theta > 0) {
                    theta += .25;
                } else {
                    theta -= .25;
                }
                if(this.speed > 0) {
                    this.speed -= .006;
                }
            }
        }
        this.forwardVector.applyMatrix4(new THREE.Matrix4().rotateY(theta))//update the real fwdVector
        ;
        this.position = position;
        this.motoMesh.position.z = this.position.z;
        this.motoMesh.position.x = this.position.x;
        this.motoMesh.position.y = this.position.y;
        //turning updates
        this.turningUpdates2(timeDifference);
        this.updateSpeed(timeDifference);
        //moto rotation updates
        var xRotation = utils.angleBetweenVectors(surfaceNormal.projectOnPlane(new THREE.Vector3(1, 0, 0)), new THREE.Vector3(0, 1, 0));
        var yRotation = this.pastYRotation + (-this.lean * this.turnSpeed + theta);
        this.pastYRotation = yRotation;
        var zRotation = THREE.Math.degToRad(this.lean);
        this.motoMesh.rotation.x = xRotation//pitch
        ;
        this.motoMesh.rotation.y = yRotation//yaw
        ;
        this.motoMesh.rotation.z = zRotation//roll
        ;
        //camera updates
        //find the relative camera position based on the motorcycle rotations
        var rotMat;//rotation Matrix
        
        var relCamPos = this.relativeCameraPosition.clone();//work with a clone so we dont change the actual static values
        
        rotMat = new THREE.Matrix4().makeRotationX(xRotation);
        rotMat.multiply(new THREE.Matrix4().makeRotationY(yRotation));
        rotMat.multiply(new THREE.Matrix4().makeRotationZ(zRotation));
        relCamPos.applyMatrix4(rotMat);
        //set the camera to the new position
        this.motoCamera.position.x = this.position.x + relCamPos.x;
        this.motoCamera.position.y = this.position.y + relCamPos.y;
        this.motoCamera.position.z = this.position.z + relCamPos.z;
        this.motoCamera.up = surfaceNormal.applyMatrix4(new THREE.Matrix4().rotateByAxis(this.forwardVector, THREE.Math.degToRad(this.lean / 2)));
        this.motoCamera.lookAt(new THREE.Vector3(this.position.x, this.position.y, this.position.z))//update lookAt position
        ;
        //for determining placing
        this.updateRoadPositions();
        //check if we have completed a lap
        this.updateCurrentLap();
        //draw heads up display
        this.drawOverlay();
    };
    this.updateRoadPositions = function () {
        //first update nearest road index
        var current = road.middleRoadLine.geometry.vertices[this.nearestRoadIndex];//vector at current index
        
        var next = road.middleRoadLine.geometry.vertices[utils.nextVertexIndex(road.middleRoadLine, this.nearestRoadIndex, road.direction)];//vector at next index
        
        var prev = road.middleRoadLine.geometry.vertices[utils.nextVertexIndex(road.middleRoadLine, this.nearestRoadIndex, -road.direction)];//vector at prev index
        
        if(this.position.distanceTo(next) < this.position.distanceTo(current)) {
            //if we are closer to the next one
            this.nearestRoadIndex = utils.nextVertexIndex(road.middleRoadLine, this.nearestRoadIndex, road.direction);
            current = road.middleRoadLine.geometry.vertices[this.nearestRoadIndex];
            next = road.middleRoadLine.geometry.vertices[utils.nextVertexIndex(road.middleRoadLine, this.nearestRoadIndex, road.direction)];
            prev = road.middleRoadLine.geometry.vertices[utils.nextVertexIndex(road.middleRoadLine, this.nearestRoadIndex, -road.direction)];
            this.visitedIndexes[this.nearestRoadIndex] = 1;
        }
        if(this.position.distanceTo(prev) < this.position.distanceTo(current)) {
            //if we are closer to the prev one
            this.nearestRoadIndex = utils.nextVertexIndex(road.middleRoadLine, this.nearestRoadIndex, -road.direction);
            current = road.middleRoadLine.geometry.vertices[this.nearestRoadIndex];
            next = road.middleRoadLine.geometry.vertices[utils.nextVertexIndex(road.middleRoadLine, this.nearestRoadIndex, road.direction)];
            prev = road.middleRoadLine.geometry.vertices[utils.nextVertexIndex(road.middleRoadLine, this.nearestRoadIndex, -road.direction)];
        }
        //then update the distance to the next vertex
        this.distToNextRoadIndex = next.distanceTo(this.position);
    };
    //this lap counter is very rudimentary. it only cares that you visited all the vertices going in the forward direction.
    this.updateCurrentLap = function () {
        var nextLap = true;
        for(var i = 0; i < this.visitedIndexes.length; i++) {
            if(this.visitedIndexes[i] !== 1) {
                nextLap = false;
            }
        }
        if(nextLap) {
            this.currentLap++;
            for(var i = 0; i < this.visitedIndexes.length; i++) {
                this.visitedIndexes[i] = 0;
            }
        }
    };
    this.drawOverlay = function () {
        var w = this.viewport.width;
        var h = this.viewport.height;
        this.HUDCanvasContext.clearRect(0, 0, w, h);
        this.HUDCanvasContext.fillStyle = "blue";
        this.HUDCanvasContext.font = "bold 16px Arial";
        //speed
        this.HUDCanvasContext.fillText(Math.floor(this.speed * 4000) + 'mph', 30, 30);
        //place
        var place;
        if(this.currentPlace === 1) {
            place = '1st';
        }
        if(this.currentPlace === 2) {
            place = '2nd';
        }
        if(this.currentPlace === 3) {
            place = '3rd';
        }
        if(this.currentPlace === 4) {
            place = '4th';
        }
        this.HUDCanvasContext.fillText(place, w - 30, 30);
        //lap
        this.HUDCanvasContext.fillText('LAP ' + this.currentLap, 30, h - 30);
    };
    this.updateSpeed = function (timeDiff) {
        if(this.speed < this.maxSpeed) {
            this.speed += .00005 * timeDiff / 16;
        }
    };
    this.turnVelocity = 0;
    this.turningUpdates2 = function (timeDif) {
        if(buttonStates[this.left] && !buttonStates[this.right]) {
            if(this.lean > -this.maxLean) {
                this.lean -= this.leanSpeed * .55 * timeDif / 16;
            }
        } else {
            if(buttonStates[this.right] && !buttonStates[this.left]) {
                if(this.lean < this.maxLean) {
                    this.lean += this.leanSpeed * .55 * timeDif / 16;
                }
            } else {
                if(Math.abs(this.lean) >= 3) {
                    if(this.lean > 0) {
                        this.lean -= this.leanSpeed / .9 * timeDif / 16;
                    } else {
                        this.lean += this.leanSpeed / .9 * timeDif / 16;
                    }
                } else {
                    this.lean = 0;
                }
            }
        }
        if(this.lean > this.maxLean) {
            this.lean = this.maxLean;
        }
        if(this.lean < -this.maxLean) {
            this.lean = -this.maxLean;
        }
        //gamepad support
        if(gamepads[this.playerNumber]) {
            this.lean = gamepads[this.playerNumber].axes[2] * this.maxLean;
        } else {
            gamepads = navigator.webkitGetGamepads();
        }
    };
    this.init(buttons);
}
;
/*
* Vehicles follow the roadline.  The starting location is a percentage 0.0-1.0 around the track.
* Direction is either 1 or 0. object3D is the model.
*/
function Vehicle(startingPercentage, speed, direction, object3d) {
    this.vehicleMesh;
    this.geometry;
    this.followLine;
    this.currentVertexIndex;
    this.forwardVector;
    this.currentPosition;
    this.speed;
    this.init = function (startingPercentage, speed, direction, object3d) {
        //calculate the starting vector position
        if(direction > 2) {
            this.followLine = road.middleRoadLine;
        } else {
            if(direction > 1) {
                this.followLine = road.rightRoadLine;
            } else {
                this.followLine = road.leftRoadLine;
            }
        }
        this.currentVertexIndex = Math.floor(this.followLine.geometry.vertices.length * startingPercentage) % this.followLine.geometry.vertices.length;
        this.currentPosition = this.followLine.geometry.vertices[this.currentVertexIndex].clone();
        this.vehicleMesh = object3d.clone();
        this.geometry = this.vehicleMesh//utils.getGeometryFromObject3d(object3d);
        ;
        this.speed = speed;
        //calculate some of the starting parameters
        this.distanceBetweenVertices = this.followLine.geometry.vertices[this.currentVertexIndex].distanceTo(this.followLine.geometry.vertices[utils.nextVertexIndex(this.followLine, this.currentVertexIndex, this.speed)]);
        var currentVector = this.followLine.geometry.vertices[this.currentVertexIndex].clone();
        var nextVector = this.followLine.geometry.vertices[utils.nextVertexIndex(this.followLine, this.currentVertexIndex, this.speed)].clone();
        this.fwdVector = new THREE.Vector3().subVectors(nextVector, currentVector).normalize();
        this.distanceFromLastVertex = 0;
        scene.add(this.vehicleMesh);
    };
    this.lastTimeUpdated = new Date().getTime();
    this.timeSinceLastUpdate = function () {
        var currentTime = new Date().getTime();
        var difference = currentTime - this.lastTimeUpdated;
        this.lastTimeUpdated = currentTime;
        return difference;
    };
    this.distanceBetweenVertices;
    this.distanceFromLastVertex;
    this.update = function () {
        var timeDifference = this.timeSinceLastUpdate();
        //move forward
        var amountForward = this.speed;//* timeDifference / 16;
        
        this.distanceFromLastVertex += Math.abs(amountForward);
        //if we havent passed the next vertex of the line segment yet
        if(this.distanceFromLastVertex < this.distanceBetweenVertices) {
            //then just set the position to the move forward point
            var fwdClone = this.fwdVector.clone();//so we arent changeing the real fwd vector
            
            this.currentPosition = this.currentPosition.add(fwdClone.multiplyScalar(amountForward));
        } else {
            //if we did pass the next vertex
            var difference;//the amount we move past it
            
            var iterations = 0;
            while(this.distanceFromLastVertex > this.distanceBetweenVertices) {
                //we need to keep moving
                this.currentVertexIndex = utils.nextVertexIndex(this.followLine, this.currentVertexIndex, this.speed)//move to the next vertex index
                ;
                difference = this.distanceFromLastVertex - this.distanceBetweenVertices;
                this.distanceBetweenVertices = this.followLine.geometry.vertices[this.currentVertexIndex].distanceTo(this.followLine.geometry.vertices[utils.nextVertexIndex(this.followLine, this.currentVertexIndex, this.speed)]);
                this.distanceFromLastVertex = difference;
                iterations++;
                if(iterations > 10) {
                    debugger;

                }
            }
            //once we found out where we should be, set the parameters governing how the vehicle moves the next time update is called
            var currentVector = this.followLine.geometry.vertices[this.currentVertexIndex];
            var nextVector = this.followLine.geometry.vertices[utils.nextVertexIndex(this.followLine, this.currentVertexIndex, this.speed)];
            this.fwdVector = new THREE.Vector3().subVectors(nextVector, currentVector).normalize();
            this.currentPosition = this.followLine.geometry.vertices[this.currentVertexIndex].clone()//set to current vertex
            ;
            var fwdClone = this.fwdVector.clone();
            this.currentPosition = this.currentPosition.add(fwdClone.multiplyScalar(this.distanceFromLastVertex))//plus the left over distance from last vertex
            ;
        }
        //location updates
        this.vehicleMesh.position.z = this.currentPosition.z;
        this.vehicleMesh.position.x = this.currentPosition.x;
        this.vehicleMesh.position.y = this.currentPosition.y;
        //moto rotation updates
        var surfaceNormal = road.roadHeightMap.getTerrainNormal(this.currentPosition.x, this.currentPosition.z);
        var xRotation = utils.angleBetweenVectors(surfaceNormal.projectOnPlane(new THREE.Vector3(1, 0, 0)), new THREE.Vector3(0, 1, 0));
        var yRotation = 0;
        var zRotation = 0;
        this.vehicleMesh.rotation.x = 0//xRotation //pitch
        ;
        this.vehicleMesh.rotation.y = yRotation//yaw
        ;
        this.vehicleMesh.rotation.z = zRotation//roll
        ;
    };
    this.init(startingPercentage, speed, direction, object3d);
}
;
/*
* A heightmap can be loaded from an image resource, or a THREE.Geometry resource.
* The generateHeightMapFromBMP or generateHeightMapFromGeometry function must be called before using the heightmap
*/
var heightMap = function () {
    this.location//the bottom left corner location of the heightmap
    ;
    this.gridArray//2d Array for the heightmap
    ;
    this.xCellLength;
    this.zCellLength;
    this.geometry;
    this.generateHeightMapFromBMP = function (imgIndex, scale) {
        //scale of 2 means every other pixel is a point on the heightmap, 3 means every third...
        this.location = new THREE.Vector2(0, 0);
        //create canvas element and add it to dom
        var canv = document.createElement('canvas');
        canv.id = 'bmpcanvas';
        document.body.appendChild(canv)// adds the canvas to the body element
        ;
        var htmlCanvasElement = canv;
        //draw image on it
        var img = imagesArray[imgIndex];
        htmlCanvasElement.height = img.height;
        htmlCanvasElement.width = img.width;
        var context = htmlCanvasElement.getContext('2d');
        context.drawImage(img, 0, 0);
        var imgData = context.getImageData(0, 0, htmlCanvasElement.height, htmlCanvasElement.width);
        //load bmp into heightMap array
        this.gridArray = new Array();
        for(var i = 0; i < htmlCanvasElement.height; i += scale) {
            this.gridArray[i / scale] = new Array();
            for(var j = 0; j < htmlCanvasElement.width; j += scale) {
                this.gridArray[i / scale][j / scale] = imgData.data[(i * htmlCanvasElement.width * 4) + (j * 4)] / 5;
            }
        }
        //create the geometry for THREE.js
        this.geometry = new THREE.Geometry();
        //load the verticies
        for(var z = 0; z < this.gridArray.length; z += 4) {
            for(var x = 0; x < this.gridArray[z].length; x += 4) {
                this.geometry.vertices.push(new THREE.Vector3(x, this.gridArray[x][z], z));
            }
        }
        //make the faces
        var width = this.gridArray[0].length;
        for(var d = 0; d < this.geometry.vertices.length - width - 1; d++) {
            if(d % width != 0) {
                this.geometry.faces.push(new THREE.Face3(d + width, d + 1, d));
                this.geometry.faces.push(new THREE.Face3(d + width, d + width + 1, d + 1));
            }
        }
        this.geometry.computeCentroids();
        this.geometry.computeFaceNormals();
        this.xCellLength = 1;
        this.zCellLength = 1;
    };
    this.generateHeightMapFromGeometry = function (geometry, numOfXCells, numOfZCells) {
        this.geometry = geometry;
        //find the bounds of the geometry
                var maxX, maxZ, minX, minZ;
        for(var j = 0; j < geometry.vertices.length; j++) {
            if(geometry.vertices[j].x > maxX || typeof maxX === 'undefined') {
                maxX = geometry.vertices[j].x;
            }
            if(geometry.vertices[j].z > maxZ || typeof maxZ === 'undefined') {
                maxZ = geometry.vertices[j].z;
            }
            if(geometry.vertices[j].x < minX || typeof minX === 'undefined') {
                minX = geometry.vertices[j].x;
            }
            if(geometry.vertices[j].z < minZ || typeof minZ === 'undefined') {
                minZ = geometry.vertices[j].z;
            }
        }
        //allocate the space for the heightmap
        this.gridArray = new Array(numOfXCells + 1);
        for(var i = 0; i < numOfXCells + 1; i++) {
            this.gridArray[i] = new Array(numOfZCells + 1);
        }
        //set heightmap location
        this.location = new THREE.Vector2(minX, minZ);
        //set cell Lengths
        this.xCellLength = (maxX - minX) / numOfXCells;
        this.zCellLength = (maxZ - minZ) / numOfZCells;
        //fill it
        var plane;
        for(var ii = 0; ii < geometry.faces.length; ii++) {
            var face = geometry.faces[ii];
            var triangle1;
            var triangle2;
            if(face instanceof THREE.Face3) {
                var face3 = face;
                plane = new THREE.Plane().setFromCoplanarPoints(geometry.vertices[face3.a], geometry.vertices[face3.b], geometry.vertices[face3.c]);
                triangle1 = new THREE.Triangle().set(geometry.vertices[face3.a], geometry.vertices[face3.b], geometry.vertices[face3.c]);
            } else {
                var face4 = face;
                plane = new THREE.Plane().setFromCoplanarPoints(geometry.vertices[face4.a], geometry.vertices[face4.b], geometry.vertices[face4.c]);
                triangle1 = new THREE.Triangle().set(geometry.vertices[face4.a], geometry.vertices[face4.b], geometry.vertices[face4.c]);
                triangle2 = new THREE.Triangle().set(geometry.vertices[face4.a], geometry.vertices[face4.c], geometry.vertices[face4.d]);
            }
            var faceBounds = this.getFaceBounds(face, geometry);//xMax,zMax,xMin,zMin
            
            //send rays from heightmap locations inside the face bounds--so we dont have to try all the heightmap points
            var startingXCellIndex = Math.ceil((faceBounds.z - minX) / this.xCellLength);
            var startingZCellIndex = Math.ceil((faceBounds.w - minZ) / this.zCellLength);
            var endXCellIndex = Math.floor((faceBounds.x - minX) / this.xCellLength);
            var endZCellIndex = Math.floor((faceBounds.y - minZ) / this.zCellLength);
            for(var xx = startingXCellIndex; xx <= endXCellIndex; xx++) {
                for(var zz = startingZCellIndex; zz <= endZCellIndex; zz++) {
                    var cellLocation = this.getCellLocation(xx, zz);
                    var ray = new THREE.Ray(cellLocation, new THREE.Vector3(0, 1, 0));
                    var intersectionPoint = ray.intersectPlane(plane);
                    if(typeof this.gridArray[xx][zz] === 'undefined') {
                        var triangle1contains = triangle1.containsPoint(new THREE.Vector3(cellLocation.x, intersectionPoint.y, cellLocation.z));
                        var triangle2contains = false;
                        if(triangle2) {
                            triangle2contains = triangle2.containsPoint(new THREE.Vector3(cellLocation.x, intersectionPoint.y, cellLocation.z));
                        }
                        if(triangle1contains || triangle2contains) {
                            //if they are in the face bounds, add it to the heightmap
                            this.gridArray[xx][zz] = intersectionPoint.y;
                        }
                    }
                }
            }
        }
    };
    //input: cell index output:the location of the cell
    this.getCellLocation = function (xCellIndex, zCellIndex) {
        return new THREE.Vector3(this.location.x + (xCellIndex * this.xCellLength), Number.MIN_VALUE, this.location.y + (zCellIndex * this.zCellLength));
    };
    this.getHeight = function (x, z) {
        var minXIndex = Math.floor((x - this.location.x) / this.xCellLength);
        var minZIndex = Math.floor((z - this.location.y) / this.zCellLength);
        var x1 = minXIndex * this.xCellLength;
        var z1 = minZIndex * this.zCellLength;
        var x2 = x1 + this.xCellLength;
        var z2 = z1 + this.zCellLength;
        return utils.bilinearInterpolation(x - this.location.x, z - this.location.y, x1, x2, z1, z2, this.gridArray[minXIndex][minZIndex], this.gridArray[minXIndex][minZIndex + 1], this.gridArray[minXIndex + 1][minZIndex], this.gridArray[minXIndex + 1][minZIndex + 1]);
    };
    //input: x, z coordinate output:the index of the cell bottom left to those coordinates
    this.getCellIndexFromCoordinates = function (x, z) {
        var minXIndex = Math.floor((x - this.location.x) / this.xCellLength);
        var minZIndex = Math.floor((z - this.location.y) / this.zCellLength);
        return new THREE.Vector2(minXIndex, minZIndex);
    };
    this.getTerrainNormal = function (x, z) {
        //return new THREE.Vector3(0, 1, 0);
        var index1 = this.getCellIndexFromCoordinates(x, z);
        var xx = index1.x;
        var y = index1.y;
        var vec1 = new THREE.Vector3(0, this.gridArray[xx][y], 0);
        var vec2 = new THREE.Vector3(0, this.gridArray[xx][y + 1], this.zCellLength);
        var vec3 = new THREE.Vector3(this.xCellLength, this.gridArray[xx + 1][y], 0);
        if(typeof vec1 === 'undefined' || typeof vec2 === 'undefined' || typeof vec3 === 'undefined') {
            return null;
        }
        var plane = new THREE.Plane();
        plane.setFromCoplanarPoints(vec1, vec2, vec3);
        //scene.add(lineFromRay(new THREE.Ray().set(new THREE.Vector3(x, this.getHeight(x,z),z),plane.normal)));
        return plane.normal;
    };
    this.getFaceBounds = function (face, geom) {
        var maxX, maxZ, minX, minZ;
        var vertIndexArray = [];
        if(face instanceof THREE.Face3) {
            var face3 = face;
            vertIndexArray[0] = face3.a;
            vertIndexArray[1] = face3.b;
            vertIndexArray[2] = face3.c;
        } else {
            var face4 = face;
            vertIndexArray[0] = face4.a;
            vertIndexArray[1] = face4.b;
            vertIndexArray[2] = face4.c;
            vertIndexArray[3] = face4.d;
        }
        for(var j = 0; j < vertIndexArray.length; j++) {
            if(geom.vertices[vertIndexArray[j]].x > maxX || typeof maxX === 'undefined') {
                maxX = geom.vertices[vertIndexArray[j]].x;
            }
            if(geom.vertices[vertIndexArray[j]].z > maxZ || typeof maxZ === 'undefined') {
                maxZ = geom.vertices[vertIndexArray[j]].z;
            }
            if(geom.vertices[vertIndexArray[j]].x < minX || typeof minX === 'undefined') {
                minX = geom.vertices[vertIndexArray[j]].x;
            }
            if(geom.vertices[vertIndexArray[j]].z < minZ || typeof minZ === 'undefined') {
                minZ = geom.vertices[vertIndexArray[j]].z;
            }
        }
        return new THREE.Vector4(maxX, maxZ, minX, minZ);
    };
};
var utils = {
    getGeometryFromObject3d: //A crude way of getting the geometry object from an Object3d.  Only gets the geometry of the first child however.
    function (obj) {
        while(!(obj.children[0] instanceof THREE.Mesh)) {
            obj = obj.children[0];
        }
        var obj1 = obj.children[0];
        return obj1.geometry;
    },
    angleBetweenLineAndPlane: function (vector, plane) {
        var normalized = vector.normalize();
        var sinAngle = normalized.dot(plane.normal);
        return Math.asin(sinAngle);
    },
    angleBetweenVectors: function (vector1, vector2) {
        vector1.normalize();
        vector2.normalize();
        var cosTheta = vector1.dot(vector2);
        var angle = Math.acos(cosTheta);
        if(vector1.z < 0) {
            return -angle;
        } else {
            return angle;
        }
    },
    lineFromRay: function (ray) {
        var geometry = new THREE.Geometry();
        geometry.vertices.push(ray.origin);
        geometry.vertices.push(new THREE.Vector3().addVectors(ray.origin, ray.direction));
        return new THREE.Line(geometry);
    },
    nextVertexIndex: //'wraps' around the line forming a continuous loop
    function (line, index, direction) {
        if(direction >= 0) {
            var nextIndex = index + 1;
            if(nextIndex === line.geometry.vertices.length) {
                nextIndex = 0;
            }//wrap arround
            
            return nextIndex;
        } else {
            var nextIndex = index - 1;
            if(nextIndex === -1) {
                nextIndex = line.geometry.vertices.length - 1;
            }//wrap arround
            
            return nextIndex;
        }
    },
    fwdVectorFromLine: //given a line and a index into that line, returns a fwd vector
    function (line, index, direction) {
        return new THREE.Vector3().subVectors(line.geometry.vertices[utils.nextVertexIndex(line, index, direction)], line.geometry.vertices[index]);
    },
    bilinearInterpolation: function (x, y, x1, x2, y1, y2, q11, q12, q21, q22) {
        var r1 = (((x2 - x) / (x2 - x1)) * (q11)) + (((x - x1) / (x2 - x1)) * (q21));
        var r2 = (((x2 - x) / (x2 - x1)) * (q12)) + (((x - x1) / (x2 - x1)) * (q22));
        var p = (((y2 - y) / (y2 - y1)) * (r1)) + (((y - y1) / (y2 - y1)) * (r2));
        return p;
    }
};
var loadObjFile = function (filename, index) {
    var loader = new THREE.OBJLoader();
    loader.index = index;
    this.loaderCallBack = function (object) {
        object.traverse(function (child) {
            if(child instanceof THREE.Mesh) {
                //child.material.map = texture;
                            }
        });
        object3DObjects[loader.index] = object;
        objIsLoadedArray[loader.index] = true;
        init2();
    };
    loader.load(filename, this.loaderCallBack);
};
var render = function () {
    requestAnimationFrame(render);
    road.render();
    road.update();
};
init();
//@ sourceMappingURL=app.js.map
