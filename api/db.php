<?php
// db.php — shared database connection with automatic schema provisioning

function get_db(): mysqli {
    $configs = [
        // Primary user-configured credentials
        ['host' => 'localhost', 'user' => 'bravin_app', 'pass' => 'BravinApp2026!', 'name' => 'bravin_transport'],
        // Standard XAMPP / WAMP / Laragon local default fallbacks
        ['host' => '127.0.0.1', 'user' => 'root', 'pass' => '', 'name' => 'bravin_transport'],
        ['host' => 'localhost', 'user' => 'root', 'pass' => '', 'name' => 'bravin_transport']
    ];

    $conn = null;
    $last_error = '';

    // Step 1: Try connecting directly to the database
    foreach ($configs as $cfg) {
        $conn = @new mysqli($cfg['host'], $cfg['user'], $cfg['pass'], $cfg['name']);
        if (!$conn->connect_error) {
            $conn->set_charset('utf8mb4');
            return $conn;
        }
        $last_error = $conn->connect_error;
    }

    // Step 2: Connection failed because db doesn't exist? Try to connect to server to provision it
    foreach ($configs as $cfg) {
        $conn = @new mysqli($cfg['host'], $cfg['user'], $cfg['pass']);
        if (!$conn->connect_error) {
            $dbname = $conn->real_escape_string($cfg['name']);
            if ($conn->query("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")) {
                if ($conn->select_db($cfg['name'])) {
                    // Check if tables exist. If empty, auto-import schema.sql
                    $tables = $conn->query("SHOW TABLES");
                    if ($tables && $tables->num_rows === 0) {
                        $schemaPath = __DIR__ . '/../db/schema.sql';
                        if (file_exists($schemaPath)) {
                            $sql = file_get_contents($schemaPath);
                            // Execute multiple queries from the schema file
                            if ($conn->multi_query($sql)) {
                                do {
                                    if ($result = $conn->store_result()) {
                                        $result->free();
                                    }
                                } while ($conn->more_results() && $conn->next_result());
                            }
                        }
                    }
                    $conn->set_charset('utf8mb4');
                    return $conn;
                }
            }
        }
    }

    // Step 3: Fully failed. Respond with error and setup diagnostics guidance
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Database connection failed',
        'details' => $last_error,
        'help' => 'Please verify that MySQL server is running. If running locally with XAMPP or WAMP, start the MySQL module. Default root credentials with no password will be auto-configured and provisioned.'
    ]);
    exit;
}
