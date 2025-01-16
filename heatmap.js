// Import and initialize Firebase Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAuuAzSne7gkiZHpzKfRIbAxOT-0sG45U0",
    authDomain: "map-project-35018.firebaseapp.com",
    databaseURL: "https://map-project-35018-default-rtdb.firebaseio.com",
    projectId: "map-project-35018",
    storageBucket: "map-project-35018.firebasestorage.app",
    messagingSenderId: "372181602839",
    appId: "1:372181602839:web:3f18b1bfbed6b4dd03c252",
    measurementId: "G-S5NR435BG2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize Heatmap Variables
let map;
let heatmapLayer;
let pinCount = 0;

// Initialize Heatmap with a **Teal-to-Black Gradient**
function initHeatmap() {
    map = L.map('map').setView([39.8283, -98.5795], 4);

    // Dark Theme Base Map
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // Create Heatmap Layer with Enhanced Teal-to-Black Gradient
    heatmapLayer = L.heatLayer([], {
        radius: 30,
        blur: 15,
        maxZoom: 19,
        minOpacity: 0.5, // Increased minimum visibility
        maxZoom: 18,
        max: 10.0, // Increased maximum intensity by 10x
        gradient: {
            0.0: '#000000',
            0.3: '#004040',
            0.6: '#008080',
            0.8: '#00BFBF',
            1.0: '#00FFFF'
        }
    }).addTo(map);

    loadHeatmapData();
}

// Load Existing Pins from Firebase Firestore
async function loadHeatmapData() {
    const querySnapshot = await getDocs(collection(db, "pins"));
    const heatmapData = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        heatmapData.push([data.lat, data.lon, 1]); // Higher intensity for multiple fans
        pinCount++;
    });

    // Update heatmap with new data
    heatmapLayer.setLatLngs(heatmapData);
    document.getElementById('pinCount').innerText = `${pinCount} fans have joined the map!`;
}

// Add New Pins to Heatmap and Firestore
document.getElementById('pinForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const zipCode = document.getElementById('zipCode').value;
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;

    $.getJSON(`https://nominatim.openstreetmap.org/search?format=json&postalcode=${zipCode}&country=us`, async function(data) {
        if (data.length > 0) {
            const location = data[0];
            const lat = parseFloat(location.lat);
            const lon = parseFloat(location.lon);

            // Add new point to heatmap and a marker pin
            heatmapLayer.addLatLng([lat, lon, 5]); // Add point with medium intensity
            
            // Add a teal marker pin
            const marker = L.marker([lat, lon], {
                icon: L.divIcon({
                    className: 'custom-pin',
                    html: '<div class="pin"></div>',
                    iconSize: [30, 30],
                    iconAnchor: [15, 30]
                })
            }).addTo(map);

            pinCount++;
            document.getElementById('pinCount').innerText = `${pinCount} fans have joined the map!`;
            document.getElementById('pinForm').reset();
            document.getElementById('formOverlay').style.display = 'none'; // Hide the form overlay

            // Save new pin to Firestore
            try {
                // Save new pin to Firestore
                await addDoc(collection(db, "pins"), {
                    zipCode: zipCode,
                    name: name,
                    email: email,
                    lat: lat,
                    lon: lon
                });
                console.log("Pin successfully saved to Firestore!");

                // Count fans in the same zip code
                const q = query(collection(db, "pins"), where("zipCode", "==", zipCode));
                const querySnapshot = await getDocs(q);
                const zipCodeCount = querySnapshot.size;

                document.getElementById('zipCount').innerText = `${zipCodeCount} fan${zipCodeCount !== 1 ? 's' : ''} in your zip code (${zipCode})`;
            } catch (error) {
                console.error("Error adding document: ", error);
            }
        } else {
            alert('Invalid Zip Code. Please try again.');
        }
    });
});

// Initialize the Heatmap on Page Load
document.addEventListener('DOMContentLoaded', function() {
    initHeatmap();
});
