# Bravin Transport — Step 1: Real Persistent Accounts (PHP + MySQL)

This has been tested and confirmed working end-to-end (register, duplicate-account
rejection, login, wrong-password rejection, session token auth, driver approval
status) against a real MySQL database before being sent to you.

## Folder structure
```
bravin-transport/
├── rider.html          rider app (login/register/home/ride booking/pricing)
├── driver.html         driver app (login/register/home, vehicle info, approval status)
├── pricing-config.js    Uganda ride rates — edit this to change pricing
├── geo-utils.js          location search, geocoding, and route/distance calculation
├── manifest.json        makes the apps installable to a phone's home screen
├── sw.js                 minimal service worker (required for installability)
├── db/
│   └── schema.sql        MySQL database schema (riders, drivers, sessions, trips)
└── api/
    ├── db.php             database connection
    ├── helpers.php        shared request/response/auth helpers
    ├── rider/
    │   ├── register.php
    │   ├── login.php
    │   └── me.php          used on app launch to auto-log the rider back in
    └── driver/
        ├── register.php
        ├── login.php
        └── me.php
```

## How login persistence works
1. Register or log in once → the server returns a random 64-character token, stored
   in the `sessions` table for 90 days, tied to that account.
2. The app saves that token in the browser's `localStorage`.
3. Every time the app opens, it silently calls `/api/rider/me.php` (or `/driver/me.php`)
   with that token. If it's still valid, the user goes straight to their home screen —
   no re-entering phone/password, ever, until the token expires or they tap Log Out.

## Setting it up on your own server (shared hosting, VPS, etc.)

1. **Create the database.** Import the schema:
   ```
   mysql -u your_mysql_user -p < db/schema.sql
   ```
2. **Create a dedicated database user** (don't use root in production):
   ```sql
   CREATE USER 'bravin_app'@'localhost' IDENTIFIED BY 'choose-a-strong-password';
   GRANT ALL PRIVILEGES ON bravin_transport.* TO 'bravin_app'@'localhost';
   FLUSH PRIVILEGES;
   ```
3. **Edit `api/db.php`** and put in your real database host/user/password.
4. **Upload the whole folder** to your web host (needs PHP 8+ and MySQL/MariaDB —
   this is standard on almost any shared hosting, e.g. cPanel hosting, or a small VPS).
5. Open `https://yourdomain.com/rider.html` and `https://yourdomain.com/driver.html`.

### Testing locally before you upload
```
mysql -u root < db/schema.sql
php -S localhost:8080
```
Then open `http://localhost:8080/rider.html`.

## Security notes
- Passwords are hashed with bcrypt (`password_hash`) — never stored in plain text.
- `api/db.php` currently has the test database password in it — change this before
  putting the app on a real public server.
- `Access-Control-Allow-Origin: *` in `helpers.php` is wide open for easy testing;
  tighten it to your real domain before going live.

## What's working now
- Real accounts stored in MySQL — no re-signup, ever.
- Separate rider and driver apps.
- Two-stage loading transition on launch, same brand colors.
- Install-to-home-screen button that hides itself once the app is installed.
- Driver signup collects vehicle type, plate, route, and starts "pending approval".
- Blocking "no internet connection" screen — the app requires an active connection.
- **Rider ride-booking flow, fully working:**
  - Choose Boda / Taxi / Special Hire, each with its own rate
  - Pickup is auto-detected from the device's real GPS (editable — tap to search a different pickup)
  - Destination search-as-you-type, covering anywhere in Uganda (via OpenStreetMap)
  - Real driving distance & time calculated along actual roads (via OSRM), not straight-line
  - Instant price quote in UGX based on `pricing-config.js` (edit that file to change your rates)
  - "Pair with a Driver" button is wired up and ready — the actual matching logic is the next step

### About the mapping services used
`geo-utils.js` uses **OpenStreetMap Nominatim** (search/geocoding) and **OSRM** (routing) —
both free, no API key, and they cover all of Uganda today. This is why location search
and pricing already work without you needing a Google Maps key.

Trade-off: these are shared public demo servers meant for light/testing use, not heavy
production traffic. Once you're getting real usage, either:
- Self-host Nominatim + OSRM (both are open source), or
- Swap in Google Maps Places/Directions API (better autocomplete, business listings) —
  the function signatures in `geo-utils.js` (`searchPlaces`, `getRoute`, `reverseGeocode`)
  are written so you can swap the implementation without touching the rest of the app.

## Next steps (in order, once you confirm this works on your server)
1. ~~Real Google Maps integration~~ → done using free OSM-based services (see above);
   swap to Google Maps later if you want their autocomplete/business data.
2. ~~Ride request flow: rider picks ride type → sees price~~ → done.
3. Pairing: rider taps "Pair with a Driver" → nearby *online, approved* drivers are notified
   in real time, see the rider's live location, and can accept/decline. (The `trips` table
   is already in the schema, ready for this.)
4. Live route tracking on both sides while the trip is in progress.
5. In-app chat + tap-to-call using the rider's registered phone number.
6. Admin dashboard to approve drivers and monitor trips.

