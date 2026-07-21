<?php
// api/driver/register.php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$body = json_body();
$phone = normalize_phone($body['phone'] ?? '');
$password = $body['password'] ?? '';
$fname = trim($body['fname'] ?? '');
$lname = trim($body['lname'] ?? '');
$email = trim($body['email'] ?? '');
$vehicleType = $body['vehicleType'] ?? '';
$plate = strtoupper(trim($body['plate'] ?? ''));
$route = trim($body['route'] ?? '');

if (!$phone) fail('Enter a valid Uganda phone number');
if (strlen($password) < 6) fail('Password must be at least 6 characters');
if (!$fname || !$lname) fail('First and last name are required');
if (!in_array($vehicleType, ['boda', 'taxi', 'private'])) fail('Choose a valid vehicle type');
if (!$plate) fail('Number plate is required');

$conn = get_db();

$check = $conn->prepare("SELECT id FROM drivers WHERE phone = ?");
$check->bind_param('s', $phone);
$check->execute();
if ($check->get_result()->num_rows > 0) {
    fail('An account with this phone number already exists — please log in instead', 409);
}

$hash = password_hash($password, PASSWORD_BCRYPT);
$stmt = $conn->prepare(
    "INSERT INTO drivers (phone, password_hash, fname, lname, email, vehicle_type, plate, route, approval_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')"
);
$stmt->bind_param('ssssssss', $phone, $hash, $fname, $lname, $email, $vehicleType, $plate, $route);
$stmt->execute();
$driverId = $stmt->insert_id;

$token = create_session($conn, 'driver', $driverId);

respond([
    'token' => $token,
    'user' => [
        'id' => $driverId, 'phone' => $phone, 'fname' => $fname, 'lname' => $lname, 'email' => $email,
        'vehicleType' => $vehicleType, 'plate' => $plate, 'route' => $route, 'approvalStatus' => 'pending'
    ]
], 201);
