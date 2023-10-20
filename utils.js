// import MercatorCoordinate from "./mercator_coordinate.js";
// import Point from "./point-geometry.js";

async function checkAndLoadFakeDB() {
  async function hasIDB() {
    if (typeof indexedDB === "undefined") {
      return false;
    }

    try {
      const idbFailed = await new Promise((resolve) => {
        const db = indexedDB.open("test-idb");
        db.onerror = () => {
          resolve(true);
        };
        db.onsuccess = () => {
          indexedDB.deleteDatabase("test-idb");
          resolve(false);
        };
      });
      if (idbFailed) {
        return false;
      }
    } catch (e) {
      return false;
    }
    return true;
  }

  async function polyfillIDB() {
    await import("https://d1wxxs914x4wga.cloudfront.net/emoji/fakeIndexedDB.js");
    // Can't override the indexedDB global, but we can monkey-patch it
    for (const func of ["open", "deleteDatabase"]) {
      console.log(func);
      indexedDB[func] = FakeIndexedDB[func].bind(FakeIndexedDB);
    }
    for (const func of ["bound", "lowerBound", "upperBound", "only"]) {
      IDBKeyRange[func] = FDBKeyRange[func].bind(FDBKeyRange);
    }
  }

  if (!(await hasIDB())) {
    await polyfillIDB();
  }
}

async function loadFonts(fontLinksArr) {
  await Promise.all(
    fontLinksArr.map((link) => {
      return new Promise((resolve, reject) => {
        const fontFile = new FontFace(link.font_name, link.url);
        fontFile.load().then(
          (font) => {
            document.fonts.add(font);
            resolve();
          },
          (err) => {
            reject(err);
          }
        );
      });
    })
  );
  console.log("All fonts loaded");
}

function loadMap() {
  unlockMap();

  MAP.addControl(
    new mapboxgl.NavigationControl({
      visualizePitch: false,
    })
  );

  fitMap();
}

function fitMap() {
  let mapParent = document.querySelector(".map");
  let mapParentHeight = parseFloat(getComputedStyle(mapParent).height) + (STATE.isPhone ? 0 : 5);
  STATE.mapHeightMultiplier = mapParentHeight / 500;
  document.getElementById("map").style.transform = `scale(${STATE.mapHeightMultiplier})`;
}

async function init() {
  if (window.innerWidth <= 320) {
    STATE.isPhone = true;
  }
  loadMap();
  if (STATE.isPhone) lockMap();
  await loadFonts(FONTS_TO_LOAD);
  await loadStyles();
  await checkAndLoadFakeDB();
  const { Picker } = await import("https://unpkg.com/emoji-picker-element@1");

  EMOJI_PICKER = new Picker({
    dataSource: "https://cdn.jsdelivr.net/npm/emoji-picker-element-data@%5E1/en/emojibase/data.json",
  });

  EMOJI_PICKER.classList.add("light");
  EMOJI_CONT.insertBefore(EMOJI_PICKER, EMOJI_SIZE);
  let cStyle = document.createElement("style");
  cStyle.innerHTML = `
            .active-emo{
              background-color: #d9d9d9;
            }
            .favorites{
              display: none;
            }
            .body{
              transition: all 0.1s ease-in-out;
            }
            .search-row{
              padding-bottom: 0;
            }
            .pad-top{
              height: 0;
            }`;
  let interval = setInterval(() => {
    if (EMOJI_PICKER.shadowRoot) {
      clearInterval(interval);
      EMOJI_PICKER.shadowRoot.appendChild(cStyle);
    }
  }, 100);
}

async function loadStyles() {
  await fetch(STYLES_URL)
    .then((response) => response.json())
    .then((mapStyles) => {
      let mapStyleCont = document.getElementById("map-style-cont");
      mapStyles.forEach((mapStyle) => {
        if (mapStyle.Title == "BluePrint") return;
        let mapStyleElem = document.createElement("div");
        mapStyleElem.classList.add("map-style");
        mapStyleElem.title = mapStyle.Title;
        if (mapStyle.styleId == DEFAULT_MAP_STYLE.unlabelled) mapStyleElem.classList.add("active-style");
        mapStyleElem.setAttribute("styleID", mapStyle.styleId);
        mapStyleElem.setAttribute("styleIDlabelled", mapStyle.styleIdLabelled);
        mapStyleElem.setAttribute("title", mapStyle.Title);
        mapStyleElem.innerHTML = `<img src="${mapStyle.image}" alt="" srcset="">`;
        mapStyleElem.onclick = () => {
          let activeStyle = document.querySelector(".active-style");
          if (activeStyle) activeStyle.classList.remove("active-style");
          mapStyleElem.classList.add("active-style");
          var style = mapStyle.styleId;
          if (MAP_LABEL_SWITCH.checked) style = mapStyle.styleIdLabelled;
          if (style != MAP_DATA.mapStyle) {
            STATE.styleTitle = mapStyle.Title;
            MAP_DATA.mapStyle = style;
            updateMapData();
            upDateMap(MAP_DATA);
            STATE.mapStyle = style;
          }
        };
        mapStyleCont.appendChild(mapStyleElem);
      });
      let activeStyleElem = document.querySelector(`[styleidlabelled="${MAP_DATA.mapStyle}"]`) || document.querySelector(`[styleid="${MAP_DATA.mapStyle}"]`);
      activeStyleElem.click();
    });
}

function upDateMap(MAP_DATA) {
  STATE.markers.forEach((marker) => {
    marker.remove();
  });
  STATE.markers = [];
  let temp = MAP_DATA.mapStyle.replace("mapbox://styles/pinenlime/", "");
  try {
    if (MAP.getStyle().sprite.indexOf(temp) == -1) {
      MAP.setStyle(MAP_DATA.mapStyle);
      let activeStyleElem = document.querySelector(`[styleidlabelled="${MAP_DATA.mapStyle}"]`) || document.querySelector(`[styleid="${MAP_DATA.mapStyle}"]`);
      if(document.querySelector(`[styleidlabelled="${MAP_DATA.mapStyle}"]`)){
        MAP_LABEL_SWITCH.checked = true;
      }else{
        MAP_LABEL_SWITCH.checked = false;
      }
      activeStyleElem.click();
    }
  } catch (error) {}
  MAP.setZoom(MAP_DATA.mapZoom);
  MAP.setBearing(MAP_DATA.mapBearing);
  MAP.setCenter(MAP_DATA.mapCenter);
  MAP_DATA.markers.forEach((marker) => {
    addMarker(generateMarkerImg(marker.markerEmoji, marker.markerLabel, MAP_STYLE_FONTS[document.querySelector(".active-style").getAttribute("title")], 100), marker.markerLocation, marker.markerSize);
  });
  if (MAP_DATA.title && MAP_DATA.title != "") {
    TITLE.innerHTML = MAP_DATA.title;
  } else if (MAP_DATA.title != null) {
    TITLE.innerHTML = "";
    TITLE.parentElement.style.display = "none";
  }
  renderRoute(MAP_DATA);
}

function emojiToImg(emojiTxt, size) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.height = (size * 9) / 8;
  canvas.width = (size * 12) / 8;

  ctx.font = `${size}px "Noto Color Emoji"`;
  ctx.fillText(emojiTxt, size / 8, (size * 4.5) / 5);

  return canvas.toDataURL();
}

function unlockMap() {
  LOCK_BUTTON.classList.remove("bi-lock-fill");
  LOCK_BUTTON.classList.add("bi-unlock-fill");
  MAP.scrollZoom.enable();
  MAP.dragPan.enable();
  MAP.touchZoomRotate.enable();
  // if (STATE.isPhone) {
  //   let tempElem = document.querySelector(".map-container")
  //   tempElem = document.querySelector(".map-container")
  //   var rect = tempElem.getBoundingClientRect();
  //   tempElem.style.position = "fixed";
  //   //fix the element wherever it is
  //   tempElem.style.top = rect.top + "px";
  //   document.querySelector(".emoji-style-cont").style.marginTop = 305 + "px";
  // }
}

function lockMap() {
  LOCK_BUTTON.classList.remove("bi-unlock-fill");
  LOCK_BUTTON.classList.add("bi-lock-fill");
  MAP.scrollZoom.disable();
  MAP.dragPan.disable();
  MAP.touchZoomRotate.disable();
  // if (STATE.isPhone) {
  //   document.querySelector(".map-container").style.position = "static";
  //   document.querySelector(".emoji-style-cont").style.marginTop = 0;
  // }
}

function getRoute(coordinates, callback) {
  var url = coordinates.join(";") + "?alternatives=true&geometries=geojson&language=en&overview=full&steps=true&access_token=" + ACCESS_TOKEN;
  fetch("https://api.mapbox.com/directions/v5/mapbox/walking/" + url)
    .then((response) => response.json())
    .then((data) => {
      let res = [];
      data.routes[0].geometry.coordinates.forEach((coordinate, index) => {
        res.push(coordinate);
      });
      route = {};
      callback(null, res);
    })
    .catch((error) => {
      callback(error);
    });
}

// // Function to display the route on the MAP
function displayRoute(coordinates) {
  // Check if the route source already exists
  if (MAP.getSource("route-source")) {
    // Update the source data if the source exists
    MAP.getSource("route-source").setData({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: coordinates,
      },
    });
  } else {
    var landColor;
    if (Array.isArray(MAP.getPaintProperty("land", "background-color"))) {
      landColor = MAP.getPaintProperty("land", "background-color")[4];
    } else {
      landColor = MAP.getPaintProperty("land", "background-color") || MAP.getPaintProperty("background", "background-color");
    }
    updateMapData({ routeColor: colorToHex(getNegativeColor(landColor)) });
    // Add a new source and layer if they don't exist
    MAP.addSource("route-source", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: coordinates,
        },
      },
    });

    MAP.addLayer({
      id: "curved-line",
      type: "line",
      source: "route-source",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": getNegativeColor(landColor),
        "line-width": 2,
        // "line-dasharray": [1, 2],
      },
    });
  }
}

function renderRoute(MAP_DATA) {
  if (MAP_DATA.markers.length < 2) {
    if (MAP.getSource("route-source")) {
      MAP.removeLayer("curved-line");
      MAP.removeSource("route-source");
    }
    return;
  }
  switch (MAP_DATA.routeType) {
    case "AIR":
      let coordinates = MAP_DATA.markers.map((marker) => marker.markerLocation);
      var line = turf.lineString(coordinates);
      var curved = turf.bezierSpline(line, { sharpness: 1 });
      displayRoute(curved.geometry.coordinates);
      airRoute.click()
      break;
    case "ROAD":
      getRoute(
        MAP_DATA.markers.map((marker) => marker.markerLocation),
        (err, coordinates) => {
          if (err) {
            console.log(err);
            return;
          }
          displayRoute(coordinates);
          roadRoute.click();
        }
      );
      break;
    case "NONE":
      if (MAP.getSource("route-source")) {
        MAP.removeLayer("curved-line");
        MAP.removeSource("route-source");
      }
      noRoute.click()
      break;
    default:
      break;
  }
}

function generateMarkerImg(emojiTxt, label, labelFont, size) {
  const canvas = document.createElement("canvas");
  let fontSize = size * 0.6;
  const ctx = canvas.getContext("2d");
  ctx.font = `${fontSize}px ${labelFont}`;
  const labelMetrics = ctx.measureText(label);
  const textWidth = labelMetrics.width + 20;
  let emojiY = size * 0.9;

  let textHeight = size * 0.92;
  // if (label == "") {
  //   fontSize = 0;
  //   emojiY += textHeight / 2;
  // }

  ctx.font = `${size}px "Noto Color Emoji"`;
  const emojiMetrics = ctx.measureText(emojiTxt);
  const emojiWidth = emojiMetrics.width;

  canvas.height = textHeight + size + 20;
  canvas.width = Math.max(emojiWidth, textWidth);

  ctx.font = `${size}px "Noto Color Emoji"`;
  ctx.fillText(emojiTxt, textWidth / 2 - emojiWidth / 2 < 0 ? 0 : textWidth / 2 - emojiWidth / 2, emojiY);
  ctx.font = `${fontSize}px ${labelFont}`;
  ctx.strokeStyle = "white"; // Outline color
  ctx.lineWidth = 15; // Outline width
  ctx.strokeText(label, 10, size + size * 0.72);

  ctx.fillText(label, 10, size + size * 0.72);

  return canvas.toDataURL();
}

function getNegativeColor(color) {
  // HEX format
  if (color.charAt(0) == "#") {
    const hex = color.substring(1);
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    const invertedR = 255 - r;
    const invertedG = 255 - g;
    const invertedB = 255 - b;

    return `#${((1 << 24) + (invertedR << 16) + (invertedG << 8) + invertedB).toString(16).slice(1)}`;
  }

  // RGB format
  if (color.startsWith("rgb")) {
    const matches = color.match(/(\d+),\s*(\d+),\s*(\d+)/);
    const invertedR = 255 - parseInt(matches[1]);
    const invertedG = 255 - parseInt(matches[2]);
    const invertedB = 255 - parseInt(matches[3]);

    return `rgb(${invertedR}, ${invertedG}, ${invertedB})`;
  }

  // HSL format
  if (color.startsWith("hsl")) {
    const matches = color.match(/(\d+),\s*(\d+)%,\s*(\d+)%/);
    const invertedH = (parseInt(matches[1]) + 180) % 360;
    const invertedS = 100 - parseInt(matches[2]);
    const invertedL = 100 - parseInt(matches[3]);

    return `hsl(${invertedH}, ${invertedS}%, ${invertedL}%)`;
  }

  throw new Error("Unsupported color format");
}

function colorToHex(color) {
  // Create a temporary div to utilize browser's ability to convert colors
  const div = document.createElement("div");
  div.style.color = color;

  // Attach the div to the body to compute the computed style
  document.body.appendChild(div);

  // Get the computed style
  const computedColor = getComputedStyle(div).color;

  // Remove the div after getting the computed style
  document.body.removeChild(div);

  // Extract the RGB values
  const match = computedColor.match(/\d+/g);
  const [r, g, b] = match;

  // Convert RGB to Hex
  const hex = `${Number(r).toString(16).padStart(2, "0")}${Number(g).toString(16).padStart(2, "0")}${Number(b).toString(16).padStart(2, "0")}`;

  return hex.toUpperCase();
}

function updateMapData(mapData, save = true) {
  console.log(mapData);
  if (mapData) {
    if (mapData.mapCenter) MAP_DATA.mapCenter = mapData.mapCenter;
    if (mapData.mapZoom) MAP_DATA.mapZoom = mapData.mapZoom;
    if (mapData.mapBearing) MAP_DATA.mapBearing = mapData.mapBearing;
    if (mapData.routeType) MAP_DATA.routeType = mapData.routeType;
    if (mapData.markers) MAP_DATA.markers = mapData.markers;
    if (mapData.mapStyle) MAP_DATA.mapStyle = mapData.mapStyle;
    if (mapData.title != null) MAP_DATA.title = mapData.title;
    if (mapData.routeColor) MAP_DATA.routeColor = mapData.routeColor;
  }
  MAP_DATA.markers.forEach((marker) => {
    marker.markerCoordinates = Object.values(MAP.project({ lng: marker.markerLocation[0], lat: marker.markerLocation[1] }));
  });
  if (save) {
    saveState();
  }
}

function updateMarkersList(mapData) {
  let draggableElem = new DraggableListElem({
    listArray: mapData.markers,
    container: MARKERS_LIST,
    className: "list-item",
    renderer: (marker) => {
      return `<div onclick="selectMarker(this, event)" class="marker-list-elem"><div class="marker-list-elem-emoji">${marker.markerEmoji}</div>
      <div class="marker-list-elem-label">${marker.markerLabel}</div>
      <div class="marker-list-elem-more"><i class="bi bi-list"></i></i></div>
      <div onclick="markerDelBtn(this)" class="marker-list-elem-delete"><i class="bi bi-trash-fill"></i></div></div>`;
    },
  });

  draggableElem.onDrag((e) => {
    updateMapData({ markers: e.listArray });
    console.log(e);
    upDateMap(MAP_DATA);
  });
}

function highLightClickedEmoji() {
  const activeEmojiElem = EMOJI_PICKER.shadowRoot.querySelectorAll(".active-emo");
  if (activeEmojiElem[1]) activeEmojiElem[1].classList.remove("active-emo");
  if (activeEmojiElem[0]) activeEmojiElem[0].classList.remove("active-emo");
  const clickedEmoji1 = EMOJI_PICKER.shadowRoot.getElementById("emo-" + event.detail.emoji.unicode);
  const clickedEmoji2 = EMOJI_PICKER.shadowRoot.getElementById("fav-" + event.detail.emoji.unicode);
  if (clickedEmoji1) clickedEmoji1.classList.add("active-emo");
  if (clickedEmoji2) clickedEmoji2.classList.add("active-emo");
}

function setCursorImg(imgUrl) {
  if (imgUrl == "none" || !imgUrl) {
    // document.body.style.cursor = `auto`;
    document.querySelector(".mapboxgl-canvas-container.mapboxgl-interactive").style.cursor = `auto`;
    return;
  }
  let tempImg = new Image();
  tempImg.src = imgUrl;
  tempImg.onload = () => {
    // document.body.style.cursor = `url(${imgUrl}) ${tempImg.width / 2} ${tempImg.height / 2}, auto`;
    document.querySelector(".mapboxgl-canvas-container.mapboxgl-interactive").style.cursor = `url(${imgUrl}) ${tempImg.width / 2} ${tempImg.height}, auto`;
  };
}

function addMarker(markerImage, lngLat, markerSize) {
  let markerElem = document.createElement("img");
  markerElem.classList.add("marker");
  markerElem.src = markerImage;
  markerElem.height = MARKER_SIZE_MAP[markerSize] * 2.2;
  // markerElem.style.transform = `translate(-${markerSize / 2}px, -${markerSize}px)`;
  let markerObj = new mapboxgl.Marker(markerElem);
  markerObj.index = STATE.markers.length;
  STATE.markers.push(markerObj);
  markerObj.setLngLat(lngLat);
  markerObj.addTo(MAP);
  markerObj.getElement().onclick = () => {
    selectMarker(markerObj.index);
  };
  return markerObj;
}

function markerDelBtn(elem) {
  let index = elem.parentElement.parentElement.getAttribute("index");
  deleteMarker(index);
}

function deleteMarker(index) {
  STATE.markers[index].remove();
  STATE.markers.splice(index, 1);
  MAP_DATA.markers.splice(index, 1);
  upDateMap(MAP_DATA);
  updateMarkersList(MAP_DATA);
}

function selectMarker(x, e) {
  if (!e || e.target.className.indexOf("bi") == "-1") {
    //remove existing selectedMarker styles
    let selectedMarkerListItem = document.querySelector(".selected-list-item");
    if (selectedMarkerListItem) {
      selectedMarkerListItem.classList.remove("selected-list-item");
      let selectedMarkerEmoji = selectedMarkerListItem.firstElementChild.firstElementChild;
      let selectedMarkerLabel = selectedMarkerListItem.firstElementChild.firstElementChild.nextElementSibling;
      if (selectedMarkerListItem != x.parentElement) {
        selectedMarkerLabel.setAttribute("contenteditable", false);
        selectedMarkerLabel.style.textOverflow = "ellipsis";
      }
    }
    if (STATE.selectedMarker) {
      STATE.selectedMarker.setDraggable(false);
      STATE.selectedMarker.getElement().classList.remove("selectedMarker");
    }
    let index;
    console.log(x);
    if (typeof x == "number") {
      index = x;
      selectedMarkerListItem = document.querySelector(`[index="${index}"]`);
      selectedMarkerListItem.classList.add("selected-list-item");
      STATE.selectedMarker = STATE.markers[index];
    } else {
      selectedMarkerListItem = x.parentElement;
      index = parseInt(selectedMarkerListItem.getAttribute("index"));
      STATE.selectedMarker = STATE.markers[index];
    }
    selectedMarkerListItem.classList.add("selected-list-item");
    let selectedMarkerEmoji = selectedMarkerListItem.firstElementChild.firstElementChild;
    let selectedMarkerLabel = selectedMarkerListItem.firstElementChild.firstElementChild.nextElementSibling;
    selectedMarkerLabel.setAttribute("contenteditable", true);
    selectedMarkerLabel.style.textOverflow = "unset";
    selectedMarkerLabel.onkeypress = (e) => {
      if (e.key == "Enter") {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(selectedMarkerLabel);
        range.collapse(true); // Set the range to the beginning
        sel.removeAllRanges();
        sel.addRange(range);
        selectedMarkerLabel.blur();
        deSelectMarker(index);
      }
    };
    selectedMarkerLabel.onblur = () => {
      MAP_DATA.markers[index].markerLabel = selectedMarkerLabel.textContent.trim();
      updateMapData();
      selectedMarkerLabel.style.textOverflow = "ellipsis";
      upDateMap(MAP_DATA);
    };

    let selectedMarkerElem = STATE.selectedMarker.getElement();
    selectedMarkerElem.classList.add("selectedMarker");

    STATE.selectedMarker.setDraggable(true);
    STATE.selectedMarker.on("drag", (e) => {
      if (MAP_DATA.routeType == "AIR") {
        MAP_DATA.markers[index].markerLocation = Object.values(e.target._lngLat);
        updateMapData();
        renderRoute(MAP_DATA);
      }
    });
    STATE.selectedMarker.on("dragend", (e) => {
      if (MAP_DATA.routeType != "AIR") {
        MAP_DATA.markers[index].markerLocation = Object.values(e.target._lngLat);
        updateMapData();
        renderRoute(MAP_DATA);
      }
    });
  }
}

function deSelectMarker(x) {
  let selectedMarkerListItem = document.querySelector(".selected-list-item");
  if (selectedMarkerListItem) {
    selectedMarkerListItem.classList.remove("selected-list-item");
    let selectedMarkerEmoji = selectedMarkerListItem.firstElementChild.firstElementChild;
    let selectedMarkerLabel = selectedMarkerListItem.firstElementChild.firstElementChild.nextElementSibling;
    const selection = window.getSelection();
    selection.removeAllRanges();
    selectedMarkerLabel.setAttribute("contenteditable", false);
    selectedMarkerLabel.style.textOverflow = "ellipsis";
  }
  if (STATE.selectedMarker) {
    STATE.selectedMarker.setDraggable(false);
    STATE.selectedMarker.getElement().classList.remove("selectedMarker");
  }
}

function _postMessage(data) {
  window.parent.postMessage(data, "*");
}

function loadState(productData) {
  let mapData = productData.mapData;

  //For Backwards Compatibility
  const temp = {
    20: "S",
    30: "M",
    40: "L",
  };
  if (productData.mapData.message != undefined) {
    mapData.title = mapData.message;
    delete mapData.message;
    mapData.markers.forEach((marker) => {
      marker.markerSize = temp[marker.markerSize];
    });
  }
  //-------------End-----------

  updateMapData(mapData, false);
  upDateMap(MAP_DATA);
  updateMarkersList(MAP_DATA);
}

function saveState() {
  PRODUCT_DATA.mapData = MAP_DATA;
  PRODUCT_DATA.title = MAP_DATA.title;
  _postMessage({
    type: "SAVE_STATE",
    payload: PRODUCT_DATA,
  });
}

function setPreview(mapData) {}

function generatePreview(mapData) {}

function convertLocToCoords(coords, mapZoom, pixelMatrix) {
  function project(lng, lat) {
    const x = mercatorXfromLng(lng);
    const y = mercatorYfromLat(lat);
    return { x, y, z: 0 };
  }

  function mercatorXfromLng(lng) {
    return (180 + lng) / 360;
  }

  function mercatorYfromLat(lat) {
    return (180 - (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))) / 360;
  }
  function locationCoordinate(lngLat, altitude = 0) {
    const z = undefined;
    const projectedLngLat = project(lngLat.lng, lngLat.lat);
    return new MercatorCoordinate(projectedLngLat.x, projectedLngLat.y, z);
  }
  coords = locationCoordinate({ lng: coords[0], lat: coords[1] });
  function transformMat4(out, a, m) {
    var x = a[0],
      y = a[1],
      z = a[2],
      w = a[3];
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
    out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
    return out;
  }
  let worldSize = Math.pow(2, mapZoom) * 512;
  const p = [coord.x * worldSize, coord.y * worldSize, coord.toAltitude(), 1];
  transformMat4(p, p, pixelMatrix);
  return p[3] > 0 ? new Point(p[0] / p[3], p[1] / p[3]) : new Point(Number.MAX_VALUE, Number.MAX_VALUE);
}
