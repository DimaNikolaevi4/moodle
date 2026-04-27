<?php
/**
 * local_massenrol/ajax.php
 * Обработчик AJAX-запросов для плагина массового зачисления
 *
 * @package    local_massenrol
 * @copyright  2026 Your Institution
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

$context = context_system::instance();
require_login();
require_capability('local/massenrol:manage', $context);
require_sesskey();

header('Content-Type: application/json');

$action = required_param('action', PARAM_ALPHANUMEXT);

function send_response($data) {
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP);
    exit;
}

try {
    switch ($action) {

        case 'check_user':
            $lastname   = required_param('lastname', PARAM_TEXT);
            $firstname  = required_param('firstname', PARAM_TEXT);
            $middlename = optional_param('middlename', '', PARAM_TEXT);
            $result = local_massenrol_check_user($lastname, $firstname, $middlename);
            send_response($result);
            break;

        case 'check_login':
            $username = required_param('username', PARAM_USERNAME);
            $available = local_massenrol_check_login($username);
            send_response(['available' => $available]);
            break;

        case 'check_email':
            $email = required_param('email', PARAM_TEXT);
            $available = local_massenrol_check_email($email);
            send_response(['available' => $available]);
            break;

        case 'check_course':
            $shortname = required_param('shortname', PARAM_TEXT);
            error_log("[massenrol] check_course: searching for shortname = " . $shortname);
            $result = local_massenrol_check_course($shortname);
            error_log("[massenrol] check_course: result = " . json_encode($result, JSON_UNESCAPED_UNICODE));
            send_response($result);
            break;

        case 'list_courses':
            $search = required_param('search', PARAM_TEXT);
            $limit  = optional_param('limit', 50, PARAM_INT);
            $courses = local_massenrol_list_courses($search, $limit);
            send_response(['courses' => $courses]);
            break;

        case 'check_group':
            $courseid  = required_param('courseid', PARAM_INT);
            $groupname = required_param('groupname', PARAM_TEXT);
            $result = local_massenrol_check_group($courseid, $groupname);
            send_response($result);
            break;

        case 'create_group':
            $courseid  = required_param('courseid', PARAM_INT);
            $groupname = required_param('groupname', PARAM_TEXT);
            $result = local_massenrol_create_group($courseid, $groupname);
            send_response($result);
            break;

        case 'list_groups':
            $courseid = required_param('courseid', PARAM_INT);
            $groups = local_massenrol_list_groups($courseid);
            send_response(['groups' => $groups]);
            break;

        // --------------------------------------------------------------------
        // Новый обработчик для массового зачисления
        // --------------------------------------------------------------------
        case 'process_enrolment':
            $input = json_decode(file_get_contents('php://input'), true);
            if (!is_array($input)) {
                send_response(['success' => false, 'error' => 'Invalid JSON']);
            }
            $results = local_massenrol_process_enrolment($input);
            send_response(['success' => true, 'results' => $results]);
            break;

        default:
            send_response([
                'success' => false,
                'error'   => 'Unknown action',
                'message' => get_string('ajax_error_unknown', 'local_massenrol')
            ]);
    }
} catch (Exception $e) {
    error_log("[massenrol] AJAX fatal error: " . $e->getMessage());
    send_response([
        'success' => false,
        'error'   => 'server_error',
        'message' => get_string('ajax_error_unknown', 'local_massenrol')
    ]);
}