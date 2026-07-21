// geo-utils.js
// Location services for Bravin Transport.
//
// Supports:
//  - Google Maps Places (Text Search & Geocoding) + Directions API
//  - Graceful open-source fallback (OSM Nominatim + OSRM) if key is missing or not loaded.

const UGANDA_VIEWBOX = '29.5,4.5,35.5,-1.5'; // west,north,east,south — biases search results to Uganda

// Load Google Maps API if a valid key is provided
if (typeof GOOGLE_MAPS_API_KEY !== 'undefined' && GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY') {
  if (!window.google || !window.google.maps) {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    console.log('[Geo-Utils] Initializing Google Maps API loader...');
  }
}

/**
 * Gets the device's current GPS position.
 * Returns { lat, lng } or throws if permission denied / unavailable.
 */
function getDeviceLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('Location services are not available on this device.')); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error('Could not get your location. Please allow location access, or set your pickup manually.')),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  });
}

/**
 * Converts coordinates into a human-readable address (for showing the pickup point).
 */
async function reverseGeocode(lat, lng) {
  // Try Google Geocoding if loaded
  if (window.google && google.maps && google.maps.Geocoder) {
    return new Promise((resolve, reject) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          resolve(results[0].formatted_address);
        } else {
          reject(new Error('Google reverse geocoding failed. Status: ' + status));
        }
      });
    });
  }

  // Fallback to OSM Nominatim
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!res.ok) throw new Error('Could not look up that location.');
  const data = await res.json();
  return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

/**
 * Searches for places in Uganda matching a text query.
 * Returns an array of { label, lat, lng } containing shops, schools, hotels, and landmarks.
 */
async function searchPlaces(query) {
  if (!query || query.trim().length < 3) return [];

  // Try Google Places TextSearch if loaded
  if (window.google && google.maps && google.maps.places) {
    return new Promise((resolve) => {
      try {
        const dummyDiv = document.createElement('div');
        const service = new google.maps.places.PlacesService(dummyDiv);
        
        service.textSearch({
          query: query,
          location: new google.maps.LatLng(0.3476, 32.5825), // Bias to Kampala coordinates
          radius: 120000 // 120km biasing radius
        }, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            const places = results.map(item => ({
              label: item.name + (item.formatted_address ? `, ${item.formatted_address}` : ''),
              lat: item.geometry.location.lat(),
              lng: item.geometry.location.lng()
            }));
            resolve(places);
          } else {
            // Fallback to Google Geocoder
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ address: query, componentRestrictions: { country: 'UG' } }, (geoResults, geoStatus) => {
              if (geoStatus === 'OK' && geoResults) {
                const places = geoResults.map(r => ({
                  label: r.formatted_address,
                  lat: r.geometry.location.lat(),
                  lng: r.geometry.location.lng()
                }));
                resolve(places);
              } else {
                resolve([]);
              }
            });
          }
        });
      } catch (e) {
        console.warn('[Geo-Utils] Google Places Search failed, using Nominatim fallback', e);
        resolve(searchPlacesOSM(query));
      }
    });
  }

  return searchPlacesOSM(query);
}

// Fallback search using OpenStreetMap Nominatim
async function searchPlacesOSM(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}` +
    `&countrycodes=ug&viewbox=${UGANDA_VIEWBOX}&bounded=1&limit=8&addressdetails=1`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!res.ok) throw new Error('Search failed.');
  const data = await res.json();
  return data.map(item => ({
    label: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon)
  }));
}

/**
 * Gets real driving distance (km) and duration (minutes) between two points along actual roads.
 */
async function getRoute(from, to) {
  // Try Google Directions Service if loaded
  if (window.google && google.maps && google.maps.DirectionsService) {
    return new Promise((resolve, reject) => {
      const service = new google.maps.DirectionsService();
      service.route({
        origin: new google.maps.LatLng(from.lat, from.lng),
        destination: new google.maps.LatLng(to.lat, to.lng),
        travelMode: google.maps.TravelMode.DRIVING
      }, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result && result.routes && result.routes[0]) {
          const leg = result.routes[0].legs[0];
          resolve({
            distanceKm: leg.distance.value / 1000,
            durationMin: leg.duration.value / 60
          });
        } else {
          reject(new Error('Google Directions failed. Status: ' + status));
        }
      });
    });
  }

  // Fallback to OSRM (Open Source Routing Machine)
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Could not calculate the route.');
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes || !data.routes.length) throw new Error('No route found between those points.');
  const route = data.routes[0];
  return {
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60
  };
}
