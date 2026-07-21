// geo-utils.js
// Location services for Bravin Transport.
//
// Uses free, no-API-key services so the app works right now, everywhere in Uganda:
//  - OpenStreetMap Nominatim for place search + reverse geocoding
//  - OSRM (Open Source Routing Machine) public demo server for real driving distance/time
//
// NOTE: These are the right services to swap out for Google Maps Places/Directions
// once a Google Maps API key with billing is available — same function signatures,
// just replace the fetch calls inside. Everything that calls these functions
// elsewhere in the app does not need to change.

const UGANDA_VIEWBOX = '29.5,4.5,35.5,-1.5'; // west,north,east,south — biases search results to Uganda

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
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!res.ok) throw new Error('Could not look up that location.');
  const data = await res.json();
  return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

/**
 * Searches for places in Uganda matching a text query (for destination search-as-you-type).
 * Returns an array of { label, lat, lng }.
 */
async function searchPlaces(query) {
  if (!query || query.trim().length < 3) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}` +
    `&countrycodes=ug&viewbox=${UGANDA_VIEWBOX}&bounded=1&limit=6&addressdetails=1`;
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
