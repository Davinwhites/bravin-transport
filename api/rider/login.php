<?php
// api/rider/login.php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$body = json_body();
$phone = normalize_phone($body['phone'] ?? '');
$password = $body['password'] ?? '';

if (!$phone || !$password) fail('Phone and password are required');

$conn = get_db();
$stmt = $conn->prepare("SELECT id, password_hash, fname, lname, email FROM riders WHERE phone = ?");
$stmt->bind_param('s', $phone);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();

if (!$user || !password_verify($password, $user['password_hash'])) {
    fail('Incorrect phone number or password', 401);
}

$token = create_session($conn, 'rider', $user['id']);

respond([
    'token' => $token,
    'user' => ['id' => $user['id'], 'phone' => $phone, 'fname' => $user['fname'], 'lname' => $user['lname'], 'email' => $user['email']]
]);
