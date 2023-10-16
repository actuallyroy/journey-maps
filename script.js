await init();

updateMapData({
  mapStyle: "mapbox://styles/pinenlime/ckykeip6o5tbz14qibbf0tjuz",
  mapZoom: 10.82572703217233,
  mapCenter: [72.83486715445213, 19.030579584418916],
  mapBearing: 0,
  routeType: "AIR",
  markers: [
    {
      markerSize: "M",
      markerLabel: "Dog Yoga",
      markerCoordinates: [240.9973245830536, 165.99331144539516],
      markerEmoji: "🐶",
      markerLocation: [72.83215377324399, 19.05219433379311],
    },
    {
      markerSize: "S",
      markerLabel: "Hi",
      markerCoordinates: [254.14761670152348, 285.9752625310421],
      markerEmoji: "🍫",
      markerLocation: [72.83724824757698, 19.008253226168932],
    },
    {
      markerSize: "L",
      markerLabel: "2023",
      markerCoordinates: [215.17370206578573, 288.973255966266],
      markerEmoji: "🎁",
      markerLocation: [72.82214960140396, 19.007155119297437],
    },
    {
      markerSize: "M",
      markerLabel: "White",
      markerCoordinates: [125.00468199578921, 424.0040131336848],
      markerEmoji: "🌆",
      markerLocation: [72.78721777219138, 18.957688459559606],
    },
    {
      markerSize: "M",
      markerLabel: "Grounded",
      markerCoordinates: [199.18440375566482, 185.04281693935394],
      markerEmoji: "❤️",
      markerLocation: [72.81595528502609, 19.0452185911103],
    },
    {
      markerSize: "M",
      markerLabel: "30 min late",
      markerCoordinates: [234.1609938111305, 41.13913213427862],
      markerEmoji: "🎵",
      markerLocation: [72.82950535210355, 19.097907448892187],
    },
    {
      markerSize: "M",
      markerLabel: "Weekend",
      markerCoordinates: [240.01203940677644, 118.00133771069845],
      markerEmoji: "🍕",
      markerLocation: [72.83177206993301, 19.069767224997392],
    },
    {
      markerSize: "M",
      markerLabel: "BP",
      markerCoordinates: [205.18039062333108, 320.95185258928933],
      markerEmoji: "🚕",
      markerLocation: [72.81827815366833, 18.995441528323454],
    },
    {
      markerSize: "M",
      markerLabel: "Vacation",
      markerCoordinates: [58.27871238295237, 177.04816778413453],
      markerEmoji: "✈️",
      markerLocation: [72.76136787194017, 19.048146189183925],
    },
  ],
  title: "",
});

upDateMap(MAP_DATA);
updateMarkersList(MAP_DATA);

MAP.on("load", () => {});

MAP.on("style.load", () => {
  renderRoute(MAP_DATA);
});

MAP.on("click", (e) => {
  console.log(e);
  STATE.lngLat = Object.values(e.lngLat);
  //create a temporary marker
  if (STATE.markerImage) {
    STATE.tempMarker = addMarker(STATE.markerImage, STATE.lngLat, STATE.markerSize);
    // STATE.markers.push(marker);
    // updateMarkersList(MAP_DATA);
    LABEL_INPUT.style.top = MAP.project(STATE.lngLat).y * STATE.mapHeightMultiplier + "px";
    LABEL_INPUT.style.left = MAP.project(STATE.lngLat).x * STATE.mapHeightMultiplier + "px";
    LABEL_INPUT.value = "";
    LABEL_INPUT.style.display = "block";
    LABEL_INPUT.focus();
    STATE.markerImage = "";
    let activeEmojiElem = EMOJI_PICKER.shadowRoot.querySelectorAll(".active-emo");
    if (activeEmojiElem[1]) activeEmojiElem[1].classList.remove("active-emo");
    if (activeEmojiElem[0]) activeEmojiElem[0].classList.remove("active-emo");
  }
});

window.onkeyup = (e) => {
  console.log(e.key);
  if (e.key == "Escape") {
    LABEL_INPUT.style.display = "none";
    STATE.markerEmoji = null;
    STATE.markerImage = null;
    if (STATE.tempMarker) STATE.tempMarker.remove();
    setCursorImg(null);
    let activeEmojiElem = EMOJI_PICKER.shadowRoot.querySelectorAll(".active-emo");
    if (activeEmojiElem[1]) activeEmojiElem[1].classList.remove("active-emo");
    if (activeEmojiElem[0]) activeEmojiElem[0].classList.remove("active-emo");
  }
};

MAP.on("moveend", (e) => {
  const center = Object.values(MAP.getCenter());
  const zoom = MAP.getZoom();
  const bearing = MAP.getBearing();
  updateMapData({ mapCenter: center, mapZoom: zoom, mapBearing: bearing });
  console.log(e);
});

MAP.on("move", (e) => {
  if (STATE.isPhone) {
    const center = Object.values(MAP.getCenter());
    if (STATE.tempMarker) {
      STATE.tempMarker.setLngLat(center);
    }
  }
});

LABEL_INPUT.onkeypress = (e) => {
  if (e.key === "Enter" || e.key === "Tab") {
    STATE.enterClicked = true
    LABEL_INPUT.blur()
  }
};

LABEL_INPUT.onblur = () => {
  console.log(STATE.enterClicked);
  if (STATE.isPhone || STATE.enterClicked) {
    const label = LABEL_INPUT.value;
    STATE.tempMarker.remove();
    STATE.markerImage = generateMarkerImg(STATE.markerEmoji, label, MAP_STYLE_FONTS[STATE.styleTitle], 100);
    const marker = addMarker(STATE.markerImage, STATE.lngLat, STATE.markerSize, label);
    STATE.markers.push(marker);
    let markers = MAP_DATA.markers;
    markers.push({
      markerSize: STATE.markerSize,
      markerLabel: label,
      markerCoordinates: MAP.project(STATE.lngLat),
      markerEmoji: STATE.markerEmoji,
      markerLocation: STATE.lngLat,
    });
    updateMapData({ markers: markers });
    upDateMap(MAP_DATA);
    updateMarkersList(MAP_DATA);
    LABEL_INPUT.style.display = "none";
    STATE.markerEmoji = null;
    STATE.markerImage = null;
    setCursorImg(null);
    if(STATE.isPhone){
      lockMap()
    }
  }
};

ROUTE_OPTIONS.onclick = (e) => {
  let routeType = e.target.value;
  if (routeType) {
    updateMapData({ routeType: routeType });
    renderRoute(MAP_DATA);
  }
};

MAP_LABEL_SWITCH.onclick = () => {
  let activeMapStyle = document.querySelector(".active-style");
  if (MAP_LABEL_SWITCH.checked) {
    updateMapData({ mapStyle: activeMapStyle.getAttribute("styleIDlabelled") });
  } else {
    updateMapData({ mapStyle: activeMapStyle.getAttribute("styleID") });
  }
  upDateMap(MAP_DATA);
};

LOCK_BUTTON.onclick = () => {
  if (LOCK_BUTTON.classList.contains("bi-lock-fill")) {
    unlockMap();
  } else {
    lockMap();
  }
};

EMOJI_PICKER.addEventListener("emoji-click", (event) => {
  if (!STATE.isPhone) {
    highLightClickedEmoji();
    STATE.markerImage = generateMarkerImg(event.detail.unicode, "", "", 100);
    STATE.markerEmoji = event.detail.unicode;
    setCursorImg(emojiToImg(STATE.markerEmoji, MARKER_SIZE_MAP[STATE.markerSize]));
    console.log(EMOJI_SIZE_ITEMS);
    EMOJI_SIZE_ITEMS.forEach((item) => {
      item.innerHTML = STATE.markerEmoji;
    });
  } else {
    highLightClickedEmoji();
    STATE.markerImage = generateMarkerImg(event.detail.unicode, "", "", 100);
    STATE.markerEmoji = event.detail.unicode;
    setCursorImg(emojiToImg(STATE.markerEmoji, MARKER_SIZE_MAP[STATE.markerSize]));
    let markerElem = new Image();
    markerElem.classList.add("marker");
    markerElem.src = STATE.markerImage;
    markerElem.height = MARKER_SIZE_MAP[STATE.markerSize] * 2.2;
    // markerElem.style.transform = `translate(-${markerSize / 2}px, -${markerSize}px)`;
    let markerObj = new mapboxgl.Marker(markerElem);
    markerObj.setLngLat(MAP.getCenter());
    markerObj.addTo(MAP);
    STATE.tempMarker = markerObj;
    EMOJI_PICKER.style.pointerEvents = "none";
    OK_CANCEL.style.display = "flex";
    unlockMap()
  }
});

EMOJI_SIZE.onclick = (e) => {
  if (e.target.className.indexOf("emoji-size-items") != -1) {
    const selectedEmojiSize = document.querySelector(".selected-marker-size");
    if (selectedEmojiSize) {
      selectedEmojiSize.classList.remove("selected-marker-size");
    }
    const size = e.target.getAttribute("value");
    if (size) {
      e.target.classList.add("selected-marker-size");
      STATE.markerSize = size;
      if(STATE.tempMarker) STATE.tempMarker._element.height = MARKER_SIZE_MAP[size] * 2.2;
      if (STATE.markerEmoji) {
        setCursorImg(emojiToImg(STATE.markerEmoji, MARKER_SIZE_MAP[STATE.markerSize]));
      }
    }
  }
};

TITLE.onblur = () => {
  if (TITLE.innerHTML == "") {
    TITLE.parentElement.style.display = "none";
    ADD_TITLE.style.display = "block";
  } else {
    TITLE_TXT.innerHTML = "Title: " + TITLE.innerHTML
    updateMapData({ title: TITLE.innerHTML });
  }
};

TITLE.onkeypress = (e) => {
  if (e.key === "Enter") {
    TITLE.blur();
  }
};

CLOSE_TITLE.onclick = () => {
  updateMapData({ title: "" });
  TITLE.parentElement.style.display = "none";
  ADD_TITLE.style.display = "block";
};

ADD_TITLE.onclick = () => {
  TITLE.parentElement.style.display = "block";
  ADD_TITLE.style.display = "none";
  TITLE.focus();
};

CANCEL_BUTTON.onclick = () => {
  STATE.tempMarker.remove();
  STATE.markerEmoji = null;
  STATE.markerImage = null;
  OK_CANCEL.style.display = "none";
};

OK_BUTTON.onclick = () => {
  OK_CANCEL.style.display = "none";
  EMOJI_PICKER.style.pointerEvents = "auto";
  STATE.lngLat = Object.values(MAP.getCenter())
  LABEL_INPUT.style.top = MAP.project(STATE.lngLat).y * STATE.mapHeightMultiplier + "px";
  LABEL_INPUT.style.left = MAP.project(STATE.lngLat).x * STATE.mapHeightMultiplier + "px";
  LABEL_INPUT.value = "";
  LABEL_INPUT.style.display = "block";
  LABEL_INPUT.focus();
  let activeEmojiElem = EMOJI_PICKER.shadowRoot.querySelectorAll(".active-emo");
  if (activeEmojiElem[1]) activeEmojiElem[1].classList.remove("active-emo");
  if (activeEmojiElem[0]) activeEmojiElem[0].classList.remove("active-emo");
};

ADD_TO_CART_BTN.onclick = () => {
  PRODUCT_DATA.title = MAP_DATA.title
  PRODUCT_DATA.mapData = MAP_DATA
  postMessage({
    type: "ADD_TO_CART",
    productData: PRODUCT_DATA,
  });
}

// NEXT_BTN.onclick = () => {
//   document.querySelector(".main-window").style.display = "none"
//   tempWidth = parseInt(getComputedStyle(document.body).height)
// }

document.body.onresize = () => {
  fitMap()
}