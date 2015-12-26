function OpenStreetView (params) {
  var instance = this;
  var debug = true;

  // Pics data
  var picsData = {};
  var currentPicId;

  // Three.js elements
  var domElement = null;
  var threeRenderer = null;
  var threeCamera = null;
  var threeGeometry = null;
  var threeMaterial = null;
  var threeSphere = null;
  var arrowMesh = null;
  var threeArrows = [];
  var threeScene = null;
  var threeRaycaster = null;
  var threeJsonLoader = null;

  // Camera
  var lon = 0, onMouseDownLon = 0,
  lat = 0, onMouseDownLat = 0,
  phi = 0, theta = 0;
  var isUserInteracting = false;

  var defaults = {
    // The DOM element receiving the viewer
    target: 'openstreetview',
    // The viewer dimension
    width: 640,
    height: 480
  };

  // Merge default with params
  params = merge(defaults, params);

  // Init the viewer
  initViewer();
  renderingLoop();


  /**
   * Add a picture into our library
   */
  this.addPicture = function(picData) {
    picsData[picData.id] = picData;
  };

  /**
   * Get all the pictures data
   */
  this.getPictures = function() {
    return picsData;
  }

  /**
   * Show a specific picture
   */
  this.showPicture = function(id) {
    var pic = picsData[id];
    currentPicId = id;

    threeScene = new THREE.Scene();

    var threeGeometry = new THREE.SphereGeometry( 500, 60, 40 );
    threeGeometry.scale( - 1, 1, 1 );

    var threeMaterial = new THREE.MeshBasicMaterial( {
        map: THREE.ImageUtils.loadTexture(pic.url)
    });

    threeSphere = new THREE.Mesh( threeGeometry, threeMaterial );
    
    threeScene.add( threeSphere );

    showPictureArrows();
  }

  // Show/update the arrows
  function showPictureArrows() {
    arrowModel = new THREE.Object3D();
    arrowModel.add(arrowMesh);
    arrowModel.position.set(4, -2, 0);
    threeScene.add(arrowModel);
    threeArrows.push(arrowModel);
  }

  // Init the three renderer
  function initViewer() {
    domElement = document.getElementById(params.target);

    threeCamera = new THREE.PerspectiveCamera( 75, params.width / params.height, 0.1, 1100);
    threeCamera.target = new THREE.Vector3( 0, 0, 0 );

    threeScene = new THREE.Scene();

    var threeGeometry = new THREE.SphereGeometry( 500, 60, 40 );
    threeGeometry.scale( - 1, 1, 1 );

    // TODO
    var threeMaterial = new THREE.MeshBasicMaterial( {
        map: THREE.ImageUtils.loadTexture('img/1.jpg')
    });
    currentPicId = 1;

    threeSphere = new THREE.Mesh( threeGeometry, threeMaterial );
    
    threeScene.add( threeSphere );

    threeRenderer = new THREE.WebGLRenderer({ antialias: true });
    threeRenderer.setPixelRatio(window.devicePixelRatio);
    threeRenderer.setSize(params.width, params.height);
    domElement.appendChild(threeRenderer.domElement);    

    // initialize raycaster
    threeRaycaster = new THREE.Raycaster()

    // Initialize JSON model loader
    threeJsonLoader = new THREE.JSONLoader();

    // load the arrow model
    threeJsonLoader.load(
      // resource URL
      'models/arrow.json',
      // Function when resource is loaded
      function ( geometry, materials ) {
        //var material = new THREE.MeshFaceMaterial( materials );
        material = new THREE.MeshBasicMaterial({
          wireframe: true,
          wireframeLinewidth: 2,
          color: 'blue'
        });
        arrowMesh = new THREE.Mesh(geometry, material);
        
        showPictureArrows();
      }
    );

    // Setup the controls
    domElement.addEventListener( 'mousedown', onMouseDown, false);
    window.addEventListener( 'mousemove', onMouseMove, false);
    window.addEventListener( 'mouseup', onMouseUp, false );
    domElement.addEventListener( 'mousewheel', onMouseWheel, false);
    domElement.addEventListener( 'MozMousePixelScroll', onMouseWheel, false);
  }

  // The rendering loop
  function renderingLoop() {
      requestAnimationFrame(renderingLoop);
      render();
  }

  // The main rendering loop
  function render() {
      lat = Math.max(-85, Math.min(85, lat));
      phi = THREE.Math.degToRad(90 - lat);
      theta = THREE.Math.degToRad(lon);

      threeCamera.target.x = 500 * Math.sin(phi) * Math.cos(theta);
      threeCamera.target.y = 500 * Math.cos(phi);
      threeCamera.target.z = 500 * Math.sin(phi) * Math.sin(theta);

      threeCamera.lookAt(threeCamera.target);

      /*
      // distortion
      camera.position.copy( camera.target ).negate();
      */

      threeRenderer.render(threeScene, threeCamera);
  }

  function onMouseDown(event) {
      event.preventDefault();
      isUserInteracting = true;

      //
      // Prepare for camera moving with mouse DnD
      //
      onPointerDownPointerX = event.clientX;
      onPointerDownPointerY = event.clientY;
      onPointerDownLon = lon;
      onPointerDownLat = lat;


      //
      // Find out if we got a directional arrow clicked
      //
      // Local 2D x/y cursor position
      var rect = domElement.getBoundingClientRect();
      var x = event.clientX - rect.left;
      var y = event.clientY - rect.top;

      // Convert into a 3D cursor, x:(-1,1), y:(-1,1)
      var mouse = new THREE.Vector3(
        (x / params.width) * 2 - 1,
        -(y / params.height) * 2 + 1,
        0.5
      );  

      // Raycast and get the intersected arrows
      threeRaycaster.setFromCamera(mouse, threeCamera);
      var intersects = threeRaycaster.intersectObjects(threeArrows, true);
      
      // if an arrow is clicked, we navigate
      if(intersects.length > 0)
      {
        console.log(new Date());
        console.log(intersects);
        console.log(intersects[0].point);
        //instance.showPicture(2);
        // change the color of the closest face.
        // intersects[ 0 ].face.color.setRGB( 0.8 * Math.random() + 0.2, 0, 0 ); 
        // intersects[ 0 ].object.geometry.colorsNeedUpdate = true;
      }
  }

  function onMouseMove(event) {
      if ( isUserInteracting === true ) {
          lon = ( onPointerDownPointerX - event.clientX ) * 0.1 + onPointerDownLon;
          lat = ( event.clientY - onPointerDownPointerY ) * 0.1 + onPointerDownLat;
      }
  }

  function onMouseUp(event) {
      isUserInteracting = false;
  }

  function onMouseWheel(event) {
      // WebKit
      if (event.wheelDeltaY) {
          threeCamera.fov -= event.wheelDeltaY * 0.05;
      // Opera / Explorer 9
      } else if (event.wheelDelta) {
          threeCamera.fov -= event.wheelDelta * 0.05;
      // Firefox
      } else if (event.detail) {
          threeCamera.fov += event.detail * 0.05;
      }

      threeCamera.updateProjectionMatrix();

      event.preventDefault();
  }

  // Prints a log message if in debug mode and console is available
  function log(message) {
    if (window.console && debug) {
      console.log(message);
    }
  }
  
  // Merge objects together - from Secrets fo the JavaScript Ninja
  function merge(root) {
    for (var i = 1; i < arguments.length; i++) {
      for (var key in arguments[i]) {
        root[key] = arguments[i][key];
      }
    }
    return root;
  }
}