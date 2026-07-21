/**
 * Bravin Transport — Portable Mock DB Backend Simulator
 * 
 * Automatically intercepts /api/ calls and runs a client-side database
 * in localStorage if the real PHP + MySQL server is unavailable (e.g., on Vercel).
 */

(function() {
  const SESSION_VALIDITY_DAYS = 90;

  // Helper: Get or initialize DB tables in localStorage
  function getTable(name) {
    const data = localStorage.getItem(`db_${name}`);
    return data ? JSON.parse(data) : [];
  }

  function saveTable(name, arr) {
    localStorage.setItem(`db_${name}`, JSON.stringify(arr));
  }

  function generateToken() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < 64; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  function logSimulatedSQL(query) {
    console.log(`%c[MOCK SQL] %c${query}`, "color:#FF9F0A; font-weight:bold;", "color:#30D158; font-family: monospace;");
  }

  // Primary API Simulator
  window.simulateBackendCall = function(path, options = {}) {
    return new Promise((resolve, reject) => {
      // Simulate network delay
      setTimeout(() => {
        try {
          const result = handleRoute(path, options);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      }, 400);
    });
  };

  function handleRoute(path, options) {
    const token = localStorage.getItem('bravin_rider_token') || localStorage.getItem('bravin_driver_token');
    const body = options.body ? JSON.parse(options.body) : {};

    // 1. RIDER REGISTRATION
    if (path === '/rider/register.php') {
      const riders = getTable('riders');
      const phone = body.phone;
      
      if (riders.some(r => r.phone === phone)) {
        throw new Error('This phone number is already registered.');
      }

      const newRider = {
        id: riders.length + 1,
        fname: body.fname,
        lname: body.lname,
        phone: body.phone,
        email: body.email || '',
        password: body.password // In mock we store plaintext
      };
      
      riders.push(newRider);
      saveTable('riders', riders);

      const sessionToken = generateToken();
      const sessions = getTable('sessions');
      sessions.push({
        token: sessionToken,
        user_type: 'rider',
        user_id: newRider.id,
        expires: Date.now() + (SESSION_VALIDITY_DAYS * 24 * 60 * 60 * 1000)
      });
      saveTable('sessions', sessions);

      logSimulatedSQL(`INSERT INTO riders (fname, lname, phone, email, password_hash) VALUES ('${newRider.fname}', '${newRider.lname}', '${newRider.phone}', '${newRider.email}', 'bcrypt_hash_simulated');`);
      logSimulatedSQL(`INSERT INTO sessions (token, user_type, user_id, expires) VALUES ('${sessionToken.substring(0, 10)}...', 'rider', ${newRider.id}, NOW() + INTERVAL 90 DAY);`);

      return {
        token: sessionToken,
        user: { id: newRider.id, fname: newRider.fname, lname: newRider.lname, phone: newRider.phone, email: newRider.email }
      };
    }

    // 2. RIDER LOGIN
    if (path === '/rider/login.php') {
      const riders = getTable('riders');
      const user = riders.find(r => r.phone === body.phone && r.password === body.password);
      
      if (!user) {
        throw new Error('Invalid phone number or password.');
      }

      const sessionToken = generateToken();
      const sessions = getTable('sessions');
      sessions.push({
        token: sessionToken,
        user_type: 'rider',
        user_id: user.id,
        expires: Date.now() + (SESSION_VALIDITY_DAYS * 24 * 60 * 60 * 1000)
      });
      saveTable('sessions', sessions);

      logSimulatedSQL(`SELECT * FROM riders WHERE phone = '${body.phone}';`);
      logSimulatedSQL(`INSERT INTO sessions (token, user_type, user_id, expires) VALUES ('${sessionToken.substring(0, 10)}...', 'rider', ${user.id}, NOW() + INTERVAL 90 DAY);`);

      return {
        token: sessionToken,
        user: { id: user.id, fname: user.fname, lname: user.lname, phone: user.phone, email: user.email }
      };
    }

    // 3. RIDER ME (GET PROFILE)
    if (path === '/rider/me.php') {
      const authHeader = options.headers ? options.headers['Authorization'] : '';
      const reqToken = authHeader ? authHeader.replace('Bearer ', '').trim() : token;

      if (!reqToken) throw new Error('Unauthorized session.');

      const sessions = getTable('sessions');
      const session = sessions.find(s => s.token === reqToken && s.user_type === 'rider' && s.expires > Date.now());

      if (!session) {
        throw new Error('Session expired or invalid.');
      }

      const riders = getTable('riders');
      const user = riders.find(r => r.id === session.user_id);
      if (!user) throw new Error('User not found.');

      logSimulatedSQL(`SELECT * FROM sessions WHERE token = '${reqToken.substring(0, 10)}...';`);
      logSimulatedSQL(`SELECT * FROM riders WHERE id = ${session.user_id};`);

      return {
        user: { id: user.id, fname: user.fname, lname: user.lname, phone: user.phone, email: user.email }
      };
    }

    // 4. DRIVER REGISTRATION
    if (path === '/driver/register.php') {
      const drivers = getTable('drivers');
      const phone = body.phone;
      
      if (drivers.some(d => d.phone === phone)) {
        throw new Error('This phone number is already registered as a driver.');
      }

      const newDriver = {
        id: drivers.length + 1,
        fname: body.fname,
        lname: body.lname,
        phone: body.phone,
        email: body.email || '',
        vehicleType: body.vehicleType,
        plate: body.plate,
        route: body.route,
        password: body.password,
        approvalStatus: 'pending' // Driver starts as pending approval
      };
      
      drivers.push(newDriver);
      saveTable('drivers', drivers);

      const sessionToken = generateToken();
      const sessions = getTable('sessions');
      sessions.push({
        token: sessionToken,
        user_type: 'driver',
        user_id: newDriver.id,
        expires: Date.now() + (SESSION_VALIDITY_DAYS * 24 * 60 * 60 * 1000)
      });
      saveTable('sessions', sessions);

      logSimulatedSQL(`INSERT INTO drivers (fname, lname, phone, email, vehicle_type, plate, route, password_hash, approval_status) VALUES ('${newDriver.fname}', '${newDriver.lname}', '${newDriver.phone}', '${newDriver.email}', '${newDriver.vehicleType}', '${newDriver.plate}', '${newDriver.route}', 'bcrypt_hash_simulated', 'pending');`);
      logSimulatedSQL(`INSERT INTO sessions (token, user_type, user_id, expires) VALUES ('${sessionToken.substring(0, 10)}...', 'driver', ${newDriver.id}, NOW() + INTERVAL 90 DAY);`);

      // Mock Auto-Approval Trigger (Approve driver in 5 seconds so they can test the rest of the flow!)
      setTimeout(() => {
        const currentDrivers = getTable('drivers');
        const dr = currentDrivers.find(d => d.id === newDriver.id);
        if (dr && dr.approvalStatus === 'pending') {
          dr.approvalStatus = 'approved';
          saveTable('drivers', currentDrivers);
          logSimulatedSQL(`[AUTO-ADMIN] UPDATE drivers SET approval_status = 'approved' WHERE id = ${newDriver.id};`);
          console.log('%c[MOCK ADMIN] Driver auto-approved by background checker!', 'color:#30D158; font-weight:bold;');
          
          // Dispatch custom event to notify UI if currently running
          window.dispatchEvent(new CustomEvent('mock_driver_approved', { detail: { driverId: newDriver.id } }));
        }
      }, 6000);

      return {
        token: sessionToken,
        user: { id: newDriver.id, fname: newDriver.fname, lname: newDriver.lname, phone: newDriver.phone, email: newDriver.email, vehicleType: newDriver.vehicleType, plate: newDriver.plate, route: newDriver.route, approvalStatus: newDriver.approvalStatus }
      };
    }

    // 5. DRIVER LOGIN
    if (path === '/driver/login.php') {
      const drivers = getTable('drivers');
      const user = drivers.find(d => d.phone === body.phone && d.password === body.password);
      
      if (!user) {
        throw new Error('Invalid phone number or password.');
      }

      const sessionToken = generateToken();
      const sessions = getTable('sessions');
      sessions.push({
        token: sessionToken,
        user_type: 'driver',
        user_id: user.id,
        expires: Date.now() + (SESSION_VALIDITY_DAYS * 24 * 60 * 60 * 1000)
      });
      saveTable('sessions', sessions);

      logSimulatedSQL(`SELECT * FROM drivers WHERE phone = '${body.phone}';`);
      logSimulatedSQL(`INSERT INTO sessions (token, user_type, user_id, expires) VALUES ('${sessionToken.substring(0, 10)}...', 'driver', ${user.id}, NOW() + INTERVAL 90 DAY);`);

      return {
        token: sessionToken,
        user: { id: user.id, fname: user.fname, lname: user.lname, phone: user.phone, email: user.email, vehicleType: user.vehicleType, plate: user.plate, route: user.route, approvalStatus: user.approvalStatus }
      };
    }

    // 6. DRIVER ME (GET PROFILE)
    if (path === '/driver/me.php') {
      const authHeader = options.headers ? options.headers['Authorization'] : '';
      const reqToken = authHeader ? authHeader.replace('Bearer ', '').trim() : token;

      if (!reqToken) throw new Error('Unauthorized session.');

      const sessions = getTable('sessions');
      const session = sessions.find(s => s.token === reqToken && s.user_type === 'driver' && s.expires > Date.now());

      if (!session) {
        throw new Error('Session expired or invalid.');
      }

      const drivers = getTable('drivers');
      const user = drivers.find(d => d.id === session.user_id);
      if (!user) throw new Error('User not found.');

      logSimulatedSQL(`SELECT * FROM sessions WHERE token = '${reqToken.substring(0, 10)}...';`);
      logSimulatedSQL(`SELECT * FROM drivers WHERE id = ${session.user_id};`);

      return {
        user: { id: user.id, fname: user.fname, lname: user.lname, phone: user.phone, email: user.email, vehicleType: user.vehicleType, plate: user.plate, route: user.route, approvalStatus: user.approvalStatus }
      };
    }

    throw new Error(`Mock endpoint not implemented for path: ${path}`);
  }
})();
