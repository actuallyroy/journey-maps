
// Main map application logic
document.addEventListener("DOMContentLoaded", function () {
    const accessToken = "pk.eyJ1IjoicGluZW5saW1lIiwiYSI6ImNrN3N6eTQ0bzByNmgzbXBsdmlwY25reDIifQ.QZROImVZfGk44ZIJLlYXQg";
    mapboxgl.accessToken = accessToken;
    // Initialize map
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        zoom: 12,
        center: [12.4924, 41.8902],
        attributionControl: false
    });

    map.addControl(new mapboxgl.NavigationControl());
    map.addControl(new mapboxgl.AttributionControl({
        compact: true
    }));

    // Utility functions
    function transformEmojiToImage(emoji) {
        const canvas = document.createElement('canvas');
        canvas.height = 60;
        canvas.width = 60;
        const ctx = canvas.getContext('2d');
        ctx.font = '40px sans-serif';
        ctx.fillText(emoji, 10, 40);
        return canvas.toDataURL();
    }

    function preloadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = url;
            img.onload = resolve;
            img.onerror = reject;
        });
    }

    function saveMapState() {
        const state = {
            markers: markers.map(marker => ({
                id: marker._element.id,
                emoji: marker._element.dataset.emoji,
                lngLat: marker.getLngLat()
            }))
        };
        indexedDB.open('mapApp').transaction(['markers'], 'readwrite')
            .objectStore('markers').put(state, 'mapState');
    }

    function loadMapState() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('mapApp').transaction(['markers'])
                .objectStore('markers').get('mapState');
            request.onsuccess = function () {
                resolve(request.result);
            };
            request.onerror = function () {
                reject(request.error);
            };
        });
    }

    function generateMapImage() {
        const mapCanvas = document.querySelector('.mapboxgl-canvas');
        const clonedCanvas = mapCanvas.cloneNode(true);
        clonedCanvas.getContext('2d').drawImage(mapCanvas, 0, 0);
        return clonedCanvas.toDataURL('image/png');
    }

    // Marker management
    let markers = [];
    function addMarker(emoji, lngLat) {
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.backgroundImage = 'url(' + transformEmojiToImage(emoji) + ')';
        el.dataset.emoji = emoji;
        const marker = new mapboxgl.Marker(el)
            .setLngLat(lngLat)
            .addTo(map);
        markers.push(marker);
        el.addEventListener('click', function () {
            removeMarker(marker);
        });
        saveMapState();
    }

    function removeMarker(marker) {
        marker.remove();
        markers = markers.filter(m => m !== marker);
        saveMapState();
    }

    function removeAllMarkers() {
        markers.forEach(marker => marker.remove());
        markers = [];
        saveMapState();
    }

    // UI components
    document.querySelector('#addMarker').addEventListener('click', function () {
        emojiPicker.showPicker(this);
    });

    const emojiPicker = new EmojiButton({
        position: 'top-start',
        theme: 'dark',
        autoFocusSearch: false
    });

    emojiPicker.on('emoji', emoji => {
        map.once('click', function (e) {
            addMarker(emoji, e.lngLat);
        });
    });

    document.querySelector('#clearMarkers').addEventListener('click', removeAllMarkers);
    document.querySelector('#downloadMap').addEventListener('click', function () {
        const dataURL = generateMapImage();
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = 'map.png';
        a.click();
    });

    // Load saved state
    loadMapState().then(state => {
        if (state) {
            state.markers.forEach(markerData => {
                addMarker(markerData.emoji, markerData.lngLat);
            });
        }
    }).catch(error => {
        console.error("Error loading saved state:", error);
    });

    // Communicate with parent window
    window.addEventListener('message', function (event) {
        if (event.data.action === 'switchMapStyle') {
            map.setStyle(event.data.styleUrl);
        }
    });
});

// Polyfill for IndexedDB
if (!window.indexedDB) {
    window.indexedDB = window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
    window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
}

// Initialize database
const request = indexedDB.open('mapApp', 1);
request.onupgradeneeded = function () {
    const db = request.result;
    if (!db.objectStoreNames.contains('markers')) {
        db.createObjectStore('markers');
    }
};
