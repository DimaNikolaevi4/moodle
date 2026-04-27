<?php
// local/massenrol/lib.php
// Library functions for the Mass Enrolment plugin
// @package    local_massenrol
// @copyright  2026 Your Institution
// @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later

defined('MOODLE_INTERNAL') || die();

// ============================================================================
// ГЛОБАЛЬНОЕ КЭШИРОВАНИЕ (в рамках одного запроса)
// ============================================================================
static $massenrol_course_cache = [];
static $massenrol_group_cache = [];

// ============================================================================
// ДЕЙСТВИЕ 13: ПРОВЕРКА СУЩЕСТВОВАНИЯ ПОЛЬЗОВАТЕЛЯ ПО ФИО
// ============================================================================

/**
 * Проверка существования пользователя по ФИО.
 *
 * @param string $lastname Фамилия пользователя
 * @param string $firstname Имя пользователя
 * @param string $middlename Отчество пользователя (может быть пустым)
 * @return array{status: 'not_found'|'found'|'multiple'|'error', message: string, data: array|null}
 */
function local_massenrol_check_user($lastname, $firstname, $middlename = '') {
    global $DB, $CFG;

    $lastname = clean_param(trim($lastname), PARAM_TEXT);
    $firstname = clean_param(trim($firstname), PARAM_TEXT);
    $middlename = clean_param(trim($middlename), PARAM_TEXT);

    if (mb_strlen($lastname) < 2 || mb_strlen($firstname) < 2) {
        return [
            'status' => 'error',
            'message' => get_string('invalid_name_format', 'local_massenrol', 'Фамилия и имя должны содержать минимум 2 символа'),
            'data' => null
        ];
    }

    $params = [
        'firstname' => core_text::strtolower($firstname),
        'lastname' => core_text::strtolower($lastname),
        'mnethostid' => $CFG->mnet_localhost_id,
    ];

    $sql = "SELECT id, username, email, firstname, lastname, middlename, deleted
            FROM {user}
            WHERE deleted = 0
            AND mnethostid = :mnethostid
            AND LOWER(firstname) = :firstname
            AND LOWER(lastname) = :lastname";

    if (!empty($middlename)) {
        $sql .= " AND middlename = :middlename";
        $params['middlename'] = $middlename;
    }

    try {
        $users = $DB->get_records_sql($sql, $params);
    } catch (dml_exception $e) {
        error_log("[massenrol] Database error in check_user: " . $e->getMessage());
        return [
            'status' => 'error',
            'message' => get_string('ajax_error_unknown', 'local_massenrol'),
            'data' => null
        ];
    }

    if (empty($users)) {
        return [
            'status' => 'not_found',
            'message' => get_string('user_not_found', 'local_massenrol'),
            'data' => null
        ];
    } elseif (count($users) === 1) {
        $user = reset($users);
        return [
            'status' => 'found',
            'message' => get_string('user_found', 'local_massenrol'),
            'data' => [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'fullname' => fullname($user)
            ]
        ];
    } else {
        $found_users = [];
        foreach ($users as $u) {
            $found_users[] = [
                'id' => $u->id,
                'username' => $u->username,
                'email' => $u->email,
                'fullname' => fullname($u),
                'middlename' => $u->middlename ?? ''
            ];
        }
        return [
            'status' => 'multiple',
            'message' => get_string('multiple_users_found', 'local_massenrol'),
            'data' => $found_users
        ];
    }
}

// ============================================================================
// ДЕЙСТВИЕ 17: ПРОВЕРКА ДОСТУПНОСТИ ЛОГИНА
// ============================================================================

/**
 * Проверка доступности логина (уникальность).
 *
 * @param string $username Логин пользователя
 * @return bool true если логин свободен, false если занят
 */
function local_massenrol_check_login($username) {
    global $DB, $CFG;
    
    $username = clean_param(trim($username), PARAM_USERNAME);
    
    if (empty($username)) {
        return false;
    }
    
    try {
        return !$DB->record_exists('user', [
            'username' => $username,
            'deleted' => 0,
            'mnethostid' => $CFG->mnet_localhost_id
        ]);
    } catch (dml_exception $e) {
        error_log("[massenrol] Database error in check_login: " . $e->getMessage());
        return false;
    }
}

// ============================================================================
// ДЕЙСТВИЕ 19: ПРОВЕРКА ДОСТУПНОСТИ EMAIL (с поддержкой национальных доменов)
// ============================================================================

/**
 * Проверка доступности email (уникальность + формат).
 * Поддерживает национальные домены (например, user@профстройобучение.рф).
 *
 * @param string $email Email пользователя
 * @return bool true если email свободен и валиден, false если занят или невалиден
 */
function local_massenrol_check_email($email) {
    global $DB, $CFG;

    $email = trim($email);
    if (empty($email)) {
        return false;
    }

    // Преобразование национального домена в punycode (IDNA2008)
    if (function_exists('idn_to_ascii')) {
        $parts = explode('@', $email, 2);
        if (count($parts) === 2) {
            $domain = idn_to_ascii($parts[1], IDNA_DEFAULT, INTL_IDNA_VARIANT_UTS46);
            if ($domain !== false) {
                $email = $parts[0] . '@' . $domain;
            }
        }
    }

    // Валидация стандартной функцией Moodle (работает с ASCII-доменами)
    if (!validate_email($email)) {
        return false;
    }

    // Проверка уникальности в базе (в БД email хранится уже в ASCII-форме)
    try {
        return !$DB->record_exists('user', [
            'email' => $email,
            'deleted' => 0,
            'mnethostid' => $CFG->mnet_localhost_id
        ]);
    } catch (dml_exception $e) {
        error_log("[massenrol] Database error in check_email: " . $e->getMessage());
        return false;
    }
}

// ============================================================================
// ДЕЙСТВИЕ 21: ПРОВЕРКА СУЩЕСТВОВАНИЯ КУРСА ПО SHORTNAME
// ============================================================================

/**
 * Проверка существования курса по shortname с кэшированием.
 *
 * @param string $shortname Короткое имя курса
 * @return array{exists: bool, courseid: int|null, fullname: string|null, visible: bool, message: string, suggestions: array}
 */
function local_massenrol_check_course($shortname) {
    global $DB;
    
    global $massenrol_course_cache;
    
    $shortname = clean_param(trim($shortname), PARAM_TEXT);
    
    if (empty($shortname)) {
        return [
            'exists' => false,
            'message' => get_string('course_empty', 'local_massenrol'),
            'suggestions' => []
        ];
    }
    
    $cache_key = 'course_' . $shortname;
    if (isset($massenrol_course_cache[$cache_key])) {
        return $massenrol_course_cache[$cache_key];
    }
    
    try {
        $course = $DB->get_record('course', ['shortname' => $shortname], 'id, shortname, fullname, visible');
    } catch (dml_exception $e) {
        error_log("[massenrol] Database error in check_course: " . $e->getMessage());
        $result = [
            'exists' => false,
            'message' => get_string('ajax_error_unknown', 'local_massenrol'),
            'suggestions' => []
        ];
        $massenrol_course_cache[$cache_key] = $result;
        return $result;
    }
    
    if ($course) {
        $result = [
            'exists' => true,
            'courseid' => $course->id,
            'fullname' => $course->fullname,
            'visible' => (bool)$course->visible,
            'message' => get_string('course_exists', 'local_massenrol'),
            'suggestions' => []
        ];
    } else {
        $result = [
            'exists' => false,
            'message' => get_string('course_not_found', 'local_massenrol'),
            'suggestions' => local_massenrol_get_similar_courses($shortname)
        ];
    }
    
    $massenrol_course_cache[$cache_key] = $result;
    return $result;
}

// ============================================================================
// ДЕЙСТВИЕ 25: ПРОВЕРКА СУЩЕСТВОВАНИЯ ГРУППЫ В КУРСЕ
// ============================================================================

/**
 * Проверка существования группы в курсе с кэшированием.
 *
 * @param int $courseid ID курса
 * @param string $groupname Название группы
 * @return array{exists: bool, groupid: int|null, message: string}
 */
function local_massenrol_check_group($courseid, $groupname) {
    global $DB;
    
    global $massenrol_group_cache;
    
    $courseid = clean_param($courseid, PARAM_INT);
    $groupname = clean_param(trim($groupname), PARAM_TEXT);
    
    if ($courseid <= 0 || empty($groupname)) {
        return [
            'exists' => false,
            'message' => get_string('group_empty', 'local_massenrol')
        ];
    }
    
    $cache_key = 'group_' . $courseid . '_' . $groupname;
    if (isset($massenrol_group_cache[$cache_key])) {
        return $massenrol_group_cache[$cache_key];
    }
    
    try {
        $group = $DB->get_record('groups', ['courseid' => $courseid, 'name' => $groupname], 'id, name, courseid');
    } catch (dml_exception $e) {
        error_log("[massenrol] Database error in check_group: " . $e->getMessage());
        $result = [
            'exists' => false,
            'message' => get_string('ajax_error_unknown', 'local_massenrol')
        ];
        $massenrol_group_cache[$cache_key] = $result;
        return $result;
    }
    
    if ($group) {
        $result = [
            'exists' => true,
            'groupid' => $group->id,
            'message' => get_string('group_exists', 'local_massenrol')
        ];
    } else {
        $result = [
            'exists' => false,
            'message' => get_string('group_not_found', 'local_massenrol')
        ];
    }
    
    $massenrol_group_cache[$cache_key] = $result;
    return $result;
}

// ============================================================================
// ДЕЙСТВИЕ 26: СОЗДАНИЕ НОВОЙ ГРУППЫ В КУРСЕ
// ============================================================================

/**
 * Создание новой группы в курсе.
 *
 * @param int $courseid ID курса
 * @param string $groupname Название группы
 * @return array{success: bool, groupid: int|null, message: string, groupname: string, error_code?: string}
 */
function local_massenrol_create_group($courseid, $groupname) {
    global $DB, $USER;
    
    $courseid = clean_param($courseid, PARAM_INT);
    $groupname = clean_param(trim($groupname), PARAM_TEXT);
    
    if ($courseid <= 0) {
        return [
            'success' => false,
            'message' => get_string('course_invalid', 'local_massenrol'),
            'groupid' => null,
            'error_code' => 'invalid_courseid'
        ];
    }
    
    if (empty($groupname) || mb_strlen($groupname) < 2) {
        return [
            'success' => false,
            'message' => get_string('group_invalid', 'local_massenrol'),
            'groupid' => null,
            'error_code' => 'invalid_groupname'
        ];
    }
    
    try {
        $coursecontext = context_course::instance($courseid);
    } catch (Exception $e) {
        return [
            'success' => false,
            'message' => get_string('course_not_found', 'local_massenrol'),
            'groupid' => null,
            'error_code' => 'course_context_error'
        ];
    }
    
    if (!has_capability('moodle/course:managegroups', $coursecontext)) {
        return [
            'success' => false,
            'message' => get_string('ajax_error_permission', 'local_massenrol'),
            'groupid' => null,
            'error_code' => 'permission_denied'
        ];
    }
    
    if ($DB->record_exists('groups', ['courseid' => $courseid, 'name' => $groupname])) {
        return [
            'success' => false,
            'message' => get_string('group_already_exists', 'local_massenrol'),
            'groupid' => null,
            'error_code' => 'already_exists'
        ];
    }
    
    $group = new stdClass();
    $group->courseid = $courseid;
    $group->name = $groupname;
    $group->description = '';
    $group->descriptionformat = FORMAT_HTML;
    $group->timecreated = time();
    $group->timemodified = time();
    
    try {
        $groupid = $DB->insert_record('groups', $group);
        
        if (!$groupid) {
            throw new moodle_exception('Failed to insert group record');
        }
        
    } catch (dml_exception $e) {
        error_log("[massenrol] Failed to create group: " . $e->getMessage());
        return [
            'success' => false,
            'message' => get_string('error', 'local_massenrol') . ': ' . $e->getMessage(),
            'groupid' => null,
            'error_code' => 'db_insert_failed'
        ];
    }
    
    if (class_exists('\core\event\group_created')) {
        try {
            $event = \core\event\group_created::create([
                'objectid' => $groupid,
                'context' => $coursecontext,
                'userid' => $USER->id,
                'other' => ['groupname' => $groupname]
            ]);
            $event->trigger();
        } catch (Exception $e) {
            error_log("[massenrol] Failed to trigger group_created event: " . $e->getMessage());
        }
    }
    
    global $massenrol_group_cache;
    unset($massenrol_group_cache['group_' . $courseid . '_' . $groupname]);
    
    return [
        'success' => true,
        'message' => get_string('group_created', 'local_massenrol'),
        'groupid' => $groupid,
        'groupname' => $groupname
    ];
}

// ============================================================================
// ДЕЙСТВИЕ 21/28: ПОЛУЧЕНИЕ СПИСКА КУРСОВ (ДЛЯ ПОИСКА)
// ============================================================================

/**
 * Получение списка курсов для поиска с поддержкой фильтрации.
 *
 * @param string $search Строка поиска (по shortname или fullname)
 * @param int $limit Лимит количества результатов (1-200)
 * @param int|null $categoryid ID категории для фильтрации (null = все категории)
 * @return array массив курсов с полями id, shortname, fullname, label
 */
function local_massenrol_list_courses($search = '', $limit = 50, $categoryid = null) {
    global $DB;
    
    $limit = max(1, min($limit, 200));
    $search = clean_param($search, PARAM_TEXT);
    
    $params = [];
    $where = 'c.visible = 1 AND c.id != :siteid';
    $params['siteid'] = SITEID;
    
    if ($categoryid !== null && $categoryid > 0) {
        $where .= ' AND c.category = :categoryid';
        $params['categoryid'] = $categoryid;
    }
    
    if (!empty($search)) {
        $search_param = '%' . $DB->sql_like_escape($search) . '%';
        $where .= ' AND (' . $DB->sql_like('c.shortname', ':search1', false) . ' OR ' . $DB->sql_like('c.fullname', ':search2', false) . ')';
        $params['search1'] = $search_param;
        $params['search2'] = $search_param;
    }
    
    $sql = "SELECT c.id, c.shortname, c.fullname, c.category
            FROM {course} c
            WHERE $where
            ORDER BY c.fullname ASC";
    
    try {
        $courses = $DB->get_records_sql($sql, $params, 0, $limit);
    } catch (dml_exception $e) {
        error_log("[massenrol] Database error in list_courses: " . $e->getMessage());
        return [];
    }
    
    $result = [];
    foreach ($courses as $c) {
        $result[] = [
            'id' => $c->id,
            'shortname' => $c->shortname,
            'fullname' => $c->fullname,
            'category' => $c->category,
            'label' => $c->shortname . ' — ' . $c->fullname
        ];
    }
    
    return $result;
}

// ============================================================================
// ДЕЙСТВИЕ 28: ПОЛУЧЕНИЕ СПИСКА ГРУПП КУРСА
// ============================================================================

/**
 * Получение списка групп курса.
 *
 * @param int $courseid ID курса
 * @return array массив групп с полями id, name, description
 */
function local_massenrol_list_groups($courseid) {
    global $DB;
    
    $courseid = clean_param($courseid, PARAM_INT);
    
    if ($courseid <= 0) {
        return [];
    }
    
    try {
        $groups = $DB->get_records('groups', ['courseid' => $courseid], 'name ASC', 'id, name, courseid, description, descriptionformat');
    } catch (dml_exception $e) {
        error_log("[massenrol] Database error in list_groups: " . $e->getMessage());
        return [];
    }
    
    $result = [];
    foreach ($groups as $g) {
        $result[] = [
            'id' => $g->id,
            'name' => $g->name,
            'description' => $g->description ?? '',
            'descriptionformat' => $g->descriptionformat ?? FORMAT_HTML
        ];
    }
    
    return $result;
}

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

/**
 * Поиск похожих курсов для подсказок (при ошибке "курс не найден").
 *
 * @param string $shortname Короткое имя курса для поиска похожих
 * @param int $limit Лимит результатов
 * @return array массив похожих курсов с полями shortname, fullname, label
 */
function local_massenrol_get_similar_courses($shortname, $limit = 5) {
    global $DB;
    
    $shortname = clean_param(trim($shortname), PARAM_TEXT);
    
    if (empty($shortname) || mb_strlen($shortname) < 3) {
        return [];
    }
    
    $search_param = '%' . $DB->sql_like_escape($shortname) . '%';
    $sql = "SELECT id, shortname, fullname
            FROM {course}
            WHERE visible = 1
            AND id != :siteid
            AND (" . $DB->sql_like('shortname', ':search', false) . " OR " . $DB->sql_like('fullname', ':search', false) . ")
            ORDER BY fullname ASC";
    
    try {
        $courses = $DB->get_records_sql($sql, ['siteid' => SITEID, 'search' => $search_param], 0, $limit);
    } catch (dml_exception $e) {
        error_log("[massenrol] Database error in get_similar_courses: " . $e->getMessage());
        return [];
    }
    
    $result = [];
    foreach ($courses as $c) {
        $result[] = [
            'id' => $c->id,
            'shortname' => $c->shortname,
            'fullname' => $c->fullname,
            'label' => $c->shortname . ' — ' . $c->fullname
        ];
    }
    
    return $result;
}

/**
 * Очистка кэшей плагина.
 *
 * @return void
 */
function local_massenrol_purge_caches() {
    global $massenrol_course_cache, $massenrol_group_cache;
    $massenrol_course_cache = [];
    $massenrol_group_cache = [];
}

/**
 * Валидация имени пользователя (кириллица, пробелы, дефисы).
 *
 * @param string $name Проверяемая строка
 * @return bool true если имя валидно, false если нет
 */
function local_massenrol_validate_cyrillic_name($name) {
    $name = trim($name);
    if (empty($name)) {
        return false;
    }
    return preg_match('/^[а-яё\s-]+$/iu', $name) === 1;
}

/**
 * Генерация безопасного пароля.
 *
 * @param int $length Длина пароля (мин. 8)
 * @param array $options Дополнительные опции (require_special, require_upper, etc.)
 * @return string Сгенерированный пароль
 */
function local_massenrol_generate_password($length = 8, $options = []) {
    $length = max(8, min($length, 128));
    
    $lower = 'abcdefghijklmnopqrstuvwxyz';
    $upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $digits = '0123456789';
    $special = get_config('local_massenrol', 'passwordspecialchars') ?: '*-#';
    
    $chars = $lower;
    if (!empty($options['require_upper'])) {
        $chars .= $upper;
    }
    if (!empty($options['require_digits']) || true) {
        $chars .= $digits;
    }
    if (!empty($options['require_special'])) {
        $chars .= $special;
    }
    
    $password = '';
    $char_length = strlen($chars);
    
    for ($i = 0; $i < $length; $i++) {
        $password .= $chars[random_int(0, $char_length - 1)];
    }
    
    return $password;
}

/**
 * Логирование действий плагина.
 *
 * @param string $message Сообщение для лога
 * @param string $level Уровень лога (info, warning, error)
 * @return void
 */
function local_massenrol_log($message, $level = 'info') {
    if (!get_config('local_massenrol', 'debugajax') && $level !== 'error') {
        return;
    }
    
    $prefix = "[massenrol]";
    $timestamp = date('Y-m-d H:i:s');
    $full_message = sprintf("%s [%s] %s: %s", $prefix, $timestamp, strtoupper($level), $message);
    
    error_log($full_message);
}

// ============================================================================
// ДЕЙСТВИЕ 29: ПРОЦЕСС МАССОВОГО ЗАЧИСЛЕНИЯ (ПОДДЕРЖКА МНОЖЕСТВЕННЫХ КУРСОВ)
// ============================================================================

/**
 * Обработка массового зачисления пользователей.
 * Поддерживает множественные курсы и группы в одной строке (разделитель ";").
 *
 * @param array $data Массив данных для зачисления. Каждый элемент должен содержать:
 *                    - firstname, lastname, middlename, username, email, password
 *                    - courseshortname (строка с короткими именами через ";")
 *                    - groupname (строка с названиями групп через ";", необязательно)
 *                    - selectedUserId (если выбран существующий пользователь)
 * @return array Массив результатов для каждой строки с полями success, userid, message
 */
function local_massenrol_process_enrolment($data) {
    global $DB, $CFG;
    require_once($CFG->dirroot . '/user/lib.php');
    require_once($CFG->dirroot . '/enrol/locallib.php');
    require_once($CFG->dirroot . '/group/lib.php');

    $results = [];
    $defaultrole = get_config('local_massenrol', 'defaultrole') ?: 5; // student

    // Локальный кэш courseid по shortname для ускорения
    $course_cache = [];

    foreach ($data as $index => $row) {
        $result = [
            'success' => false,
            'userid' => null,
            'message' => ''
        ];

        try {
            // --- 1. Получаем или создаём пользователя ---
            $user = null;
            if (!empty($row['selectedUserId'])) {
                $user = $DB->get_record('user', ['id' => $row['selectedUserId'], 'deleted' => 0]);
            }

            if (!$user) {
                // Создаём нового пользователя
                $user = new stdClass();
                $user->username    = $row['username'] ?? '';
                $user->firstname   = $row['firstname'] ?? '';
                $user->lastname    = $row['lastname'] ?? '';
                $user->middlename  = $row['middlename'] ?? '';
                $user->email       = $row['email'] ?? '';
                $user->confirmed   = 1;
                $user->mnethostid  = $CFG->mnet_localhost_id;
                $user->lang        = current_language();
                $user->timecreated = time();
                $user->timemodified = $user->timecreated;

                $user->id = user_create_user($user, false, false);
                if (!$user->id) {
                    throw new moodle_exception('Cannot create user');
                }

                // Устанавливаем пароль
                if (!empty($row['password']) && $row['password'] !== '********') {
                    update_internal_user_password($user, $row['password']);
                } else {
                    // Генерируем случайный пароль
                    $newpassword = generate_password();
                    update_internal_user_password($user, $newpassword);
                }
            }

            // --- 2. Разбираем курсы и группы ---
            $courseshortnames = array_map('trim', explode(';', $row['courseshortname'] ?? ''));
            $courseshortnames = array_filter($courseshortnames, function($v) { return $v !== ''; });
            
            $groupnames = array_map('trim', explode(';', $row['groupname'] ?? ''));

            if (empty($courseshortnames)) {
                throw new moodle_exception('No courses specified');
            }

            $enrolment_errors = [];
            $enrolment_success_count = 0;

            // --- 3. Зачисляем на каждый курс ---
            foreach ($courseshortnames as $i => $shortname) {
                // Получаем courseid (с кэшированием)
                if (!isset($course_cache[$shortname])) {
                    $course = $DB->get_record('course', ['shortname' => $shortname], 'id');
                    $course_cache[$shortname] = $course ? $course->id : null;
                }
                $courseid = $course_cache[$shortname];

                if (!$courseid) {
                    $enrolment_errors[] = "Курс '{$shortname}' не найден";
                    continue;
                }

                // Получаем экземпляр manual enrolment для этого курса
                $enrol = enrol_get_plugin('manual');
                $instances = enrol_get_instances($courseid, true);
                $manualinstance = null;
                foreach ($instances as $instance) {
                    if ($instance->enrol === 'manual') {
                        $manualinstance = $instance;
                        break;
                    }
                }
                if (!$manualinstance) {
                    $enrolment_errors[] = "Ручной метод зачисления не найден для курса '{$shortname}'";
                    continue;
                }

                // Зачисляем пользователя
                $enrol->enrol_user($manualinstance, $user->id, $defaultrole, time(), 0, ENROL_USER_ACTIVE);

                // --- 4. Добавляем в группу, если указана для этого курса ---
                if (isset($groupnames[$i]) && trim($groupnames[$i]) !== '') {
                    $groupname = trim($groupnames[$i]);
                    $group = $DB->get_record('groups', ['courseid' => $courseid, 'name' => $groupname]);
                    if (!$group) {
                        // Создаём группу (без дополнительной проверки прав – они уже должны быть у текущего пользователя)
                        $group = new stdClass();
                        $group->courseid = $courseid;
                        $group->name = $groupname;
                        $group->timecreated = time();
                        $group->timemodified = time();
                        $group->id = $DB->insert_record('groups', $group);
                    }
                    groups_add_member($group, $user->id);
                }

                $enrolment_success_count++;
            }

            // --- 5. Формируем результат для строки ---
            if (empty($enrolment_errors)) {
                $result['success'] = true;
                $result['userid'] = $user->id;
                $result['message'] = "OK ({$enrolment_success_count} курсов)";
            } else {
                $result['message'] = implode('; ', $enrolment_errors);
                // success остаётся false
            }

        } catch (Exception $e) {
            $result['message'] = $e->getMessage();
        }

        $results[$index] = $result;
    }

    return $results;
}