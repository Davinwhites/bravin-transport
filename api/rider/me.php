<?php
// api/rider/me.php — returns the logged-in rider's profile if their token is still valid
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$conn = get_db();
$session = require_auth($conn, 'rider');

$stmt = $conn->prepare("SELECT id, phone, fname, lname, email FROM riders WHERE id = ?");
$stmt->bind_param('i', $session['user_id']);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();

if (!$user) fail('Account not found', 404);

respond(['user' => $user]);
