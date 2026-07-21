<?php
// db.php — shared database connection
// IMPORTANT: change these credentials to match your real hosting environment.
// This file should sit OUTSIDE the public web root in production if possible.

function get_db(): mysqli {
    $host = 'localhost';
    $user = 'bravin_app';
    $pass = 'BravinApp2026!';
    $name = 'bravin_transport';

    $conn = new mysqli($host, $user, $pass, $name);
    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed']);
        exit;
    }
    $conn->set_charset('utf8mb4');
    return $conn;
}
