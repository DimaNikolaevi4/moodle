<?php
define('AJAX_SCRIPT', true);
require_once(__DIR__ . '/../../config.php');

$context = context_system::instance();
require_login();
require_capability('local/massenrol:manage', $context);

$sesskey = optional_param('sesskey', '', PARAM_RAW);
if (!confirm_sesskey($sesskey)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Invalid sesskey']);
    exit;
}

header('Content-Type: application/json');

$action = required_param('action', PARAM_TEXT);

if ($action === 'save_draft') {
    $jsonInput = file_get_contents('php://input');
    $data = json_decode($jsonInput, true);
    
    if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid data']);
        exit;
    }

    // === ДОБАВЛЕНО: ограничение количества строк из настроек ===
    $maxrows = (int) get_config('local_massenrol', 'maxrows') ?: 5000;
    if (count($data) > $maxrows) {
        $data = array_slice($data, 0, $maxrows);
    }
    // === КОНЕЦ ДОБАВЛЕНИЯ ===

    global $SESSION;
    $SESSION->local_massenrol = [
        'step' => 1,
        'data' => $data,
        'timestamp' => time()
    ];
    
    echo json_encode(['success' => true, 'rows' => count($data)]);
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Unknown action: ' . $action]);
}