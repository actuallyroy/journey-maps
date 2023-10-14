async function checkAndLoadFakeDB() {
  async function hasIDB() {
    if (typeof indexedDB === "undefined") {
      return false;
    }

    try {
      const idbFailed = await new Promise((resolve) => {
        const db = indexedDB.open("test-idb");
        db.onerror = () => resolve(true);
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
  lockMap();

  MAP.addControl(
    new mapboxgl.NavigationControl({
      visualizePitch: false,
    })
  );

  let mapParent = document.querySelector(".map");
  let mapParentHeight = getComputedStyle(mapParent).height;
  mapParentHeight = mapParentHeight.substring(0, mapParentHeight.length - 2);
  document.getElementById("map").style.transform = `scale(${parseFloat(mapParentHeight) / 500})`;
}

async function init() {
  checkAndLoadFakeDB();
  loadMap();
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
  await Promise.all([loadFonts(FONTS_TO_LOAD), loadStyles()]);
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
          currentLabelFont = MAP_STYLE_FONTS[mapStyle.Title];
          let allLabels = document.querySelectorAll(".label");
          allLabels.forEach((label) => {
            label.style.fontFamily = currentLabelFont;
          });
          if (MAP_LABEL_SWITCH.checked) style = mapStyle.styleIdLabelled;
          // don't change the mapStyle if it's the same
          if (style != MAP_DATA.mapStyle) {
            STATE.styleTitle = mapStyle.Title;
            MAP_DATA.mapStyle = style;
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
  if (MAP.getStyle().sprite.indexOf(temp) == -1) {
    MAP.setStyle(MAP_DATA.mapStyle);
    let activeStyleElem = document.querySelector(`[styleidlabelled="${MAP_DATA.mapStyle}"]`) || document.querySelector(`[styleid="${MAP_DATA.mapStyle}"]`);
    activeStyleElem.click();
  }
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
}

function lockMap() {
  LOCK_BUTTON.classList.remove("bi-unlock-fill");
  LOCK_BUTTON.classList.add("bi-lock-fill");
  MAP.scrollZoom.disable();
  MAP.dragPan.disable();
  MAP.touchZoomRotate.disable();
}

function getRoute(coordinates, callback) {
  var url = coordinates.join(";") + "?alternatives=true&geometries=geojson&language=en&overview=full&steps=true&access_token=" + ACCESS_TOKEN;
  fetch("https://api.mapbox.com/directions/v5/mapbox/walking/" + url)
    .then((response) => response.json())
    .then((data) => {
      let res = [];
      data.routes[0].geometry.coordinates.forEach((coordinate, index) => {
        if (index % 10 == 0) res.push(coordinate);
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
        "line-dasharray": [1, 2],
      },
    });
  }
}

function renderRoute(MAP_DATA) {
  if (MAP_DATA.markers.length < 2) return;
  switch (MAP_DATA.routeType) {
    case "AIR":
      let coordinates = MAP_DATA.markers.map((marker) => marker.markerLocation);
      var line = turf.lineString(coordinates);
      var curved = turf.bezierSpline(line, { sharpness: 1 });
      displayRoute(curved.geometry.coordinates);
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
        }
      );
      break;
    case "NONE":
      if (MAP.getSource("route-source")) {
        MAP.removeLayer("curved-line");
        MAP.removeSource("route-source");
      }
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
  if (label == "") {
    fontSize = 0;
    emojiY += textHeight / 2;
  }

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
  console.log(color);
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

function updateMapData(mapData) {
  if (mapData.mapCenter) MAP_DATA.mapCenter = mapData.mapCenter;
  if (mapData.mapZoom) MAP_DATA.mapZoom = mapData.mapZoom;
  if (mapData.mapBearing) MAP_DATA.mapBearing = mapData.mapBearing;
  if (mapData.routeType) MAP_DATA.routeType = mapData.routeType;
  if (mapData.markers) MAP_DATA.markers = mapData.markers;
  if (mapData.mapStyle) MAP_DATA.mapStyle = mapData.mapStyle;
  if (mapData.title != null) MAP_DATA.title = mapData.title;
}

function updateMarkersList(mapData) {
  MARKERS_LIST.innerHTML = "";
  mapData.markers.forEach((marker, index) => {
    let markerElem = document.createElement("div");
    markerElem.classList.add("marker-list-elem");
    markerElem.innerHTML = `<div class="marker-list-elem-emoji">${marker.markerEmoji}</div>
    <div class="marker-list-elem-label">${marker.markerLabel}</div>
    <div class="marker-list-elem-more"><i class="bi bi-three-dots-vertical"></i></i></div>
    <div class="marker-list-elem-delete"><i class="bi bi-trash-fill"></i></div>`;
    markerElem.onclick = () => {
      if (STATE.activeMarker) STATE.activeMarker.togglePopup();
      STATE.activeMarker = STATE.markers[index];
      STATE.markers[index].togglePopup();
    };
    MARKERS_LIST.appendChild(markerElem);
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
    document.body.style.cursor = `auto`;
    document.querySelector(".mapboxgl-canvas-container.mapboxgl-interactive").style.cursor = `auto`;
    return;
  }
  let tempImg = new Image();
  tempImg.src = imgUrl;
  tempImg.onload = () => {
    document.body.style.cursor = `url(${imgUrl}) ${tempImg.width / 2} ${tempImg.height / 2}, auto`;
    document.querySelector(".mapboxgl-canvas-container.mapboxgl-interactive").style.cursor = `url(${imgUrl}) ${tempImg.width / 2} ${tempImg.height / 2}, auto`;
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
    if (STATE.activeMarker) {
      STATE.activeMarker.togglePopup();
    }
    STATE.activeMarker = markerObj;
  };
  return markerObj;
}
