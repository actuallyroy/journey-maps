import random
import uuid
# Generating an array of 10 objects with simulated mapData based on New Delhi

# Notable locations around New Delhi for markers
locations = [
    {"label": "India Gate", "coordinates": [77.2295, 28.6129]},
    {"label": "Qutub Minar", "coordinates": [77.1855, 28.5245]},
    {"label": "Lotus Temple", "coordinates": [77.2588, 28.5535]},
    {"label": "Humayun's Tomb", "coordinates": [77.2437, 28.5933]},
    {"label": "Red Fort", "coordinates": [77.2401, 28.6562]},
    {"label": "Raj Ghat", "coordinates": [77.2415, 28.6406]},
    {"label": "Jama Masjid", "coordinates": [77.2334, 28.6507]},
    {"label": "Rashtrapati Bhawan", "coordinates": [77.1980, 28.6142]},
    {"label": "Jantar Mantar", "coordinates": [77.2153, 28.6271]},
    {"label": "Akshardham Temple", "coordinates": [77.2773, 28.6127]}
]
emojis = ["🥪", "💋", "🍻", "🍑", "🍛", "👋", "😝", "🥫", "🥜", "🥰"]

# Generating the objects
objects = []
for i in range(10):
    # Selecting two random locations for markers
    random_markers = random.sample(locations, 2)
    obj = [{
        "quantity": 1,
        "order_id": str(uuid.uuid4()),
        "sku": "0055",
        "description": "A journey through the memories",
        "gifttext": "",
        "gift": False,
        "frameSize": "8x8",
        "promptData": {},
        "cost": 1199,
        "map_type": "journeymap",
        "product_id": "Journey Map",
        "title": "",
        "frameColor": "Dark Brown",
        "mapData": {
            "mapStyle": "mapbox://styles/pinenlime/cl0tw205g000m14qij3ybq5dp",
            "mapZoom": 10,
            "mapCenter": [77.2090, 28.6139],
            "markers": [
                {
                    "markerSize": 30,
                    "markerLabel": random_markers[0]["label"],
                    "markerCoordinates": random_markers[0]["coordinates"],
                    "markerEmoji": random.choice(emojis),
                    "markerLocation": random_markers[0]["coordinates"]
                },
                {
                    "markerSize": 30,
                    "markerLabel": random_markers[1]["label"],
                    "markerCoordinates": random_markers[1]["coordinates"],
                    "markerEmoji": random.choice(emojis),
                    "markerLocation": random_markers[1]["coordinates"]
                }
            ],
            "message": f"Exploring Delhi: {random_markers[0]['label']} & {random_markers[1]['label']}",
            "mapBearing": 0
        }
    }]
    objects.append(obj)

print(objects)
