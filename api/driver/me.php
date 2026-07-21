<?php
// api/driver/me.php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$conn = get_db();
$session = require_auth($conn, 'driver');

$stmt = $conn->prepare(
    "SELECT id, phone, fname, lname, email, vehicle_type, plate, route, approval_status
     FROM drivers WHERE id = ?"
);
$stmt->bind_param('i', $session['user_id']);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();

if (!$user) fail('Account not found', 404);

respond(['user' => [
    'id' => $user['id'], 'phone' => $user['phone'], 'fname' => $user['fname'], 'lname' => $user['lname'],
    'email' => $user['email'], 'vehicleType' => $user['vehicle_type'], 'plate' => $user['plate'],
    'route' => $user['route'], 'approvalStatus' => $user['approval_status']
]]);
