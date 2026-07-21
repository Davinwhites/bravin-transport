// pricing-config.js
// Uganda ride pricing — these are starter rates, edit freely to match your real pricing.
// All amounts in UGX (Ugandan Shilling).

const RIDE_TYPES = {
  boda: {
    label: 'Boda Boda',
    icon: '🏍️',
    description: 'Fast & affordable, 1 passenger',
    baseFare: 1000,      // flat fee just for starting the trip
    perKm: 500,          // UGX per kilometre
    perMin: 50,           // UGX per minute (accounts for traffic/waiting)
    minimumFare: 2000
  },
  taxi: {
    label: 'Taxi',
    icon: '🚕',
    description: 'Regular car, up to 4 passengers',
    baseFare: 2500,
    perKm: 1200,
    perMin: 100,
    minimumFare: 5000
  },
  private: {
    label: 'Special Hire',
    icon: '🚗',
    description: 'Private car, most comfortable',
    baseFare: 4000,
    perKm: 1800,
    perMin: 150,
    minimumFare: 8000
  }
};

/**
 * Calculates the fare for a ride.
 * distanceKm: driving distance in kilometres
 * durationMin: estimated driving time in minutes
 */
function calculateFare(rideType, distanceKm, durationMin) {
  const rate = RIDE_TYPES[rideType];
  if (!rate) throw new Error('Unknown ride type: ' + rideType);
  const raw = rate.baseFare + (rate.perKm * distanceKm) + (rate.perMin * durationMin);
  const fare = Math.max(raw, rate.minimumFare);
  // Round to nearest 100 UGX, which is how most Uganda transport pricing is quoted
  return Math.round(fare / 100) * 100;
}

function formatUGX(amount) {
  return 'UGX ' + amount.toLocaleString('en-UG');
}
