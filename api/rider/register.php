<?php
// api/rider/register.php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$body = json_body();
$phone = normalize_phone($body['phone'] ?? '');
$password = $body['password'] ?? '';
$fname = trim($body['fname'] ?? '');
$lname = trim($body['lname'] ?? '');
$email = trim($body['email'] ?? '');

if (!$phone) fail('Enter a valid Uganda phone number');
if (strlen($password) < 6) fail('Password must be at least 6 characters');
if (!$fname || !$lname) fail('First and last name are required');

$conn = get_db();

$check = $conn->prepare("SELECT id FROM riders WHERE phone = ?");
$check->bind_param('s', $phone);
$check->execute();
if ($check->get_result()->num_rows > 0) {
    fail('An account with this phone number already exists — please log in instead', 409);
}

$hash = password_hash($password, PASSWORD_BCRYPT);
$stmt = $conn->prepare(
    "INSERT INTO riders (phone, password_hash, fname, lname, email) VALUES (?, ?, ?, ?, ?)"
);
$stmt->bind_param('sssss', $phone, $hash, $fname, $lname, $email);
$stmt->execute();
$riderId = $stmt->insert_id;

$token = create_session($conn, 'rider', $riderId);

respond([
    'token' => $token,
    'user' => ['id' => $riderId, 'phone' => $phone, 'fname' => $fname, 'lname' => $lname, 'email' => $email]
], 201);
