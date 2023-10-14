
//STRINGS
const ACCESS_TOKEN = "pk.eyJ1IjoicGluZW5saW1lIiwiYSI6ImNrN3N6eTQ0bzByNmgzbXBsdmlwY25reDIifQ.QZROImVZfGk44ZIJLlYXQg";
const STYLES_URL = "https://d1wxxs914x4wga.cloudfront.net/MapDesigns/design.json";


// OBJECTS
const FONTS_TO_LOAD = [
  {
    font_name: "Source Sans Pro SemiBold",
    url: "url(https://d1wxxs914x4wga.cloudfront.net/Fonts/SourceSansPro-Semibold.otf)",
  },
  {
    font_name: "DINPro-Medium",
    url: "url(https://d1wxxs914x4wga.cloudfront.net/Fonts/DINPro-Medium_13936.ttf)",
  },
  {
    font_name: "Beth Ellen",
    url: "url(https://fonts.gstatic.com/s/bethellen/v17/WwkbxPW2BE-3rb_JNT-qIIcoVQ.woff2)",
  },
  {
    font_name: "Alegreya SC",
    url: "url(https://fonts.gstatic.com/s/alegreyasc/v14/taiOGmRtCJ62-O0HhNEa-a6o.ttf)",
  },
  {
    font_name: "Bree Serif Regular",
    url: "url(https://fonts.gstatic.com/s/breeserif/v17/4UaHrEJCrhhnVA3DgluA96rp5w.woff2)",
  },
  {
    font_name: "Overpass",
    url: "url(https://fonts.gstatic.com/s/overpass/v13/qFda35WCmI96Ajtm83upeyoaX6QPnlo6_PPbPpqK.woff2)",
  },
  {
    font_name: "Roboto Mono",
    url: "url(https://fonts.gstatic.com/s/robotomono/v12/L0x5DF4xlVMF-BfR8bXMIjhLq38.woff2)",
  },
  {
    font_name: "DIN Offc Pro Black",
    url: "url(https://d1wxxs914x4wga.cloudfront.net/Fonts/DINOffcPro-Black.ttf)",
  },
  {
    font_name: "Frank Ruhl Libre",
    url: "url(https://fonts.gstatic.com/s/frankruhllibre/v20/j8_96_fAw7jrcalD7oKYNX0QfAnPcbzNEEB7OoicBw4iZmqXNRU.woff2)",
  },
  {
    font_name: "Noto Color Emoji",
    url: "url(https://fonts.gstatic.com/s/notocoloremoji/v25/Yq6P-KqIXTD0t4D9z1ESnKM3-HpFabsE4tq3luCC7p-aXxcn.0.woff2)",
  },
  {
    font_name: "Noto Color Emoji",
    url: "url(https://fonts.gstatic.com/s/notocoloremoji/v25/Yq6P-KqIXTD0t4D9z1ESnKM3-HpFabsE4tq3luCC7p-aXxcn.1.woff2)",
  },
  {
    font_name: "Noto Color Emoji",
    url: "url(https://fonts.gstatic.com/s/notocoloremoji/v25/Yq6P-KqIXTD0t4D9z1ESnKM3-HpFabsE4tq3luCC7p-aXxcn.2.woff2)",
  },
  {
    font_name: "Noto Color Emoji",
    url: "url(https://fonts.gstatic.com/s/notocoloremoji/v25/Yq6P-KqIXTD0t4D9z1ESnKM3-HpFabsE4tq3luCC7p-aXxcn.3.woff2)",
  },
  {
    font_name: "Noto Color Emoji",
    url: "url(https://fonts.gstatic.com/s/notocoloremoji/v25/Yq6P-KqIXTD0t4D9z1ESnKM3-HpFabsE4tq3luCC7p-aXxcn.4.woff2)",
  },
  {
    font_name: "Noto Color Emoji",
    url: "url(https://fonts.gstatic.com/s/notocoloremoji/v25/Yq6P-KqIXTD0t4D9z1ESnKM3-HpFabsE4tq3luCC7p-aXxcn.5.woff2)",
  },
  {
    font_name: "Noto Color Emoji",
    url: "url(https://fonts.gstatic.com/s/notocoloremoji/v25/Yq6P-KqIXTD0t4D9z1ESnKM3-HpFabsE4tq3luCC7p-aXxcn.6.woff2)",
  },
  {
    font_name: "Noto Color Emoji",
    url: "url(https://fonts.gstatic.com/s/notocoloremoji/v25/Yq6P-KqIXTD0t4D9z1ESnKM3-HpFabsE4tq3luCC7p-aXxcn.7.woff2)",
  },
  {
    font_name: "Noto Color Emoji",
    url: "url(https://fonts.gstatic.com/s/notocoloremoji/v25/Yq6P-KqIXTD0t4D9z1ESnKM3-HpFabsE4tq3luCC7p-aXxcn.8.woff2)",
  },
  {
    font_name: "Noto Color Emoji",
    url: "url(https://fonts.gstatic.com/s/notocoloremoji/v25/Yq6P-KqIXTD0t4D9z1ESnKM3-HpFabsE4tq3luCC7p-aXxcn.9.woff2)",
  },
];

const DEFAULT_MAP_STYLE = {
  labelled: "mapbox://styles/pinenlime/ckknu6rsw62dq17nubbhdk7zg",
  unlabelled: "mapbox://styles/pinenlime/ckqzddkfy3p9l18p7toi6zq4r",
};

const MAP_DATA = {
  mapStyle: DEFAULT_MAP_STYLE.labelled,
  mapZoom: 15,
  routeType: "AIR",
  mapBearing: 0,
  mapCenter: [55.14, 25.069],
  title: null,
  markers: [],
};

const MARKER_SIZE_MAP = {
  "S": 12,
  "M": 15,
  "L": 20
}

const MAP_OPTIONS = {
  style: MAP_DATA.mapStyle,
  center: MAP_DATA.mapCenter,
  zoom: MAP_DATA.mapZoom,
  attributionControl: false,
  crossSourceCollisions: false,
  pitchWithRotate: false,
  touchPitch: false,
  projection: 'globe'
};

const MAP_STYLE_FONTS = {
  Rust: "Source Sans Pro SemiBold",
  Breezy: "DINPro-Medium",
  Evening: "DINPro-Medium",
  OriginalBlue: "DINPro-Medium",
  Night: "DINPro-Medium",
  Blush: "DINPro-Medium",
  Ruby: "Beth Ellen",
  Raven: "Alegreya SC",
  Moss: "Source Sans Pro SemiBold",
  Sky: "DINPro-Medium",
  Romeo: "Beth Ellen",
  Vanilla: "Source Sans Pro SemiBold",
  Garden: "Bree Serif Regular",
  Cloud: "Overpass",
  Sailor: "Roboto Mono",
  BluePrint: "DIN Offc Pro Black",
  Clay: "Frank Ruhl Libre",
  Sherlock: "Roboto Mono",
  Forest: "Overpass",
  Monochrome: "DINPro-Medium",
  Game: "Roboto Mono",
  Classic: "DINPro-Medium",
  Strawberry: "DINPro-Medium",
  ForgetMeNot: "Beth Ellen",
  Daffodil: "Beth Ellen",
};


const STATE = {
  markers: [],
  markerImage: "",
  markerEmoji: "",
  markerSize: "M",
  lngLat: [],
  tempMarker: null,
  styleTitle: "",
  mapStyle: MAP_DATA.mapStyle
}


const FRAME_URLS = {
  "Dark Brown": "https://static.wixstatic.com/media/9fba21_24db682ca706494b8072a122e128fc89~mv2.png",
  Natural: "https://static.wixstatic.com/media/9fba21_6cd730decf5c49fab0b42cc9ebef495c~mv2.png",
};

mapboxgl.accessToken = ACCESS_TOKEN;
const MAP = new mapboxgl.Map({ container: "map", ...MAP_OPTIONS });

//ELEMENTS
EMOJI_SIZE_ITEMS = document.querySelectorAll(".emoji-size-items")
