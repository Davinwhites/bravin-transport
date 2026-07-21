<?php
// api/driver/login.php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$body = json_body();
$phone = normalize_phone($body['phone'] ?? '');
$password = $body['password'] ?? '';

if (!$phone || !$password) fail('Phone and password are required');

$conn = get_db();
$stmt = $conn->prepare(
    "SELECT id, password_hash, fname, lname, email, vehicle_type, plate, route, approval_status
     FROM drivers WHERE phone = ?"
);
$stmt->bind_param('s', $phone);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();

if (!$user || !password_verify($password, $user['password_hash'])) {
    fail('Incorrect phone number or password', 401);
}

$token = create_session($conn, 'driver', $user['id']);

respond([
    'token' => $token,
    'user' => [
        'id' => $user['id'], 'phone' => $phone, 'fname' => $user['fname'], 'lname' => $user['lname'],
        'email' => $user['email'], 'vehicleType' => $user['vehicle_type'], 'plate' => $user['plate'],
        'route' => $user['route'], 'approvalStatus' => $user['approval_status']
    ]
]);
