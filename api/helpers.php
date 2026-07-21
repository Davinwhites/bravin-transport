<?php
// helpers.php — shared utility functions for the API

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // tighten this to your real domain in production
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function json_body(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function respond(array $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function fail(string $message, int $code = 400): void {
    respond(['error' => $message], $code);
}

// Normalizes any Uganda number format (07XXXXXXXX, 7XXXXXXXX, +2567XXXXXXXX) to 2567XXXXXXXX
function normalize_phone(string $phone): ?string {
    $digits = preg_replace('/\D/', '', $phone);
    if (str_starts_with($digits, '256') && strlen($digits) === 12) return $digits;
    if (str_starts_with($digits, '0') && strlen($digits) === 10) return '256' . substr($digits, 1);
    if (strlen($digits) === 9) return '256' . $digits;
    return null;
}

function generate_token(): string {
    return bin2hex(random_bytes(32));
}

// Creates a session token valid for 90 days — this is what makes login "one time"
function create_session(mysqli $conn, string $userType, int $userId): string {
    $token = generate_token();
    $stmt = $conn->prepare(
        "INSERT INTO sessions (token, user_type, user_id, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 90 DAY))"
    );
    $stmt->bind_param('ssi', $token, $userType, $userId);
    $stmt->execute();
    return $token;
}

// Reads the Bearer token from the Authorization header and returns the logged-in user, or fails the request.
function require_auth(mysqli $conn, string $expectedType): array {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (!preg_match('/Bearer\s+(.+)/', $authHeader, $m)) {
        fail('Missing or invalid Authorization header', 401);
    }
    $token = $m[1];

    $stmt = $conn->prepare(
        "SELECT user_id, user_type FROM sessions WHERE token = ? AND expires_at > NOW()"
    );
    $stmt->bind_param('s', $token);
    $stmt->execute();
    $result = $stmt->get_result();
    $session = $result->fetch_assoc();

    if (!$session || $session['user_type'] !== $expectedType) {
        fail('Session expired or invalid — please log in again', 401);
    }
    return $session;
}
