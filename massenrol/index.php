<?php
// local/massenrol/index.php
// Main interface for Mass Enrolment plugin (Actions 1-16+)
// @package    local_massenrol
// @copyright  2026 Your Institution
// @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

// ============================================================================
// ПРОВЕРКА ПРАВ ДОСТУПА
// ============================================================================
$context = context_system::instance();
require_login();
require_capability('local/massenrol:manage', $context);

// ============================================================================
// НАСТРОЙКА СТРАНИЦЫ MOODLE
// ============================================================================
$PAGE->set_url('/local/massenrol/index.php');
$PAGE->set_context($context);
$PAGE->set_title(get_string('pluginname', 'local_massenrol'));
$PAGE->set_heading(get_string('pluginname', 'local_massenrol'));
$PAGE->navbar->add(get_string('pluginname', 'local_massenrol'));
$PAGE->requires->jquery();

// ============================================================================
// ПОДКЛЮЧЕНИЕ CSS И JS
// ============================================================================
$PAGE->requires->css('/local/massenrol/css/jsuites.css');
$PAGE->requires->css('/local/massenrol/css/jspreadsheet.css');
$PAGE->requires->css('/local/massenrol/css/styles.css');

$PAGE->requires->js('/local/massenrol/js/jsuites.js', true);
$PAGE->requires->js('/local/massenrol/js/jspreadsheet.js', true);
$PAGE->requires->js_call_amd('core/bootstrap', 'init');

// ============================================================================
// ОБРАБОТКА СБРОСА СЕССИИ
// ============================================================================
$reset = optional_param('reset', 0, PARAM_BOOL);
if ($reset) {
    unset($SESSION->local_massenrol);
    if (function_exists('local_massenrol_purge_caches')) {
        local_massenrol_purge_caches();
    }
    redirect($PAGE->url);
}

// ============================================================================
// ПОДГОТОВКА ДАННЫХ ДЛЯ JAVASCRIPT
// ============================================================================
$saveddata = isset($SESSION->local_massenrol) ? $SESSION->local_massenrol : null;

$jsconfig = [
    'sesskey' => sesskey(),
    'savedData' => $saveddata,
    
    'strings' => [
        // Колонки
        'lastname' => get_string('lastname'),
        'firstname' => get_string('firstname'),
        'middlename' => get_string('middlename', 'local_massenrol'),
        'username' => get_string('username'),
        'email' => get_string('email', 'local_massenrol'),
        'password' => get_string('password'),
        'courseshortname' => get_string('courseshortname', 'local_massenrol'),
        'groupname' => get_string('groupname', 'local_massenrol'),
        'status' => get_string('status', 'local_massenrol'),
        
        // Кнопки и действия
        'addrows' => get_string('addrows', 'local_massenrol'),
        'number' => get_string('number', 'local_massenrol'),
        'add' => get_string('add', 'local_massenrol'),
        'cleartable' => get_string('cleartable', 'local_massenrol'),
        'resetall' => get_string('resetall', 'local_massenrol'),
        'check' => get_string('check', 'local_massenrol'),
        'undo' => get_string('undo', 'local_massenrol'),
        'undo_title' => get_string('undo_title', 'local_massenrol'),
        'previous' => get_string('previous', 'local_massenrol'),
        'next' => get_string('next', 'local_massenrol'),
        'cancel' => get_string('cancel', 'local_massenrol'),
        'close' => get_string('close', 'local_massenrol'),
        'search' => get_string('search', 'local_massenrol'),
        'loading' => get_string('loading', 'local_massenrol'),
        
        // Валидация ФИО
        'missing_lastname' => get_string('missing_lastname', 'local_massenrol'),
        'missing_firstname' => get_string('missing_firstname', 'local_massenrol'),
        'missing_middlename' => get_string('missing_middlename', 'local_massenrol'),
        'invalid_lastname' => get_string('invalid_lastname', 'local_massenrol'),
        'invalid_firstname' => get_string('invalid_firstname', 'local_massenrol'),
        'invalid_middlename' => get_string('invalid_middlename', 'local_massenrol'),
        'fixpassword' => get_string('fixpassword', 'local_massenrol'),
        'password_simple' => get_string('password_simple', 'local_massenrol'),
        
        // Кнопки валидации
        'addwithoutmiddlename' => get_string('addwithoutmiddlename', 'local_massenrol'),
        'fixedruncheck' => get_string('fixedruncheck', 'local_massenrol'),
        'proceedcheck' => get_string('proceedcheck', 'local_massenrol'),
        
        // Проверка пользователя (Action 13)
        'user_not_found' => get_string('user_not_found', 'local_massenrol'),
        'user_found' => get_string('user_found', 'local_massenrol'),
        'multiple_users_found' => get_string('multiple_users_found', 'local_massenrol'),
        'choose_action' => get_string('choose_action', 'local_massenrol'),
        'use_table_data' => get_string('use_table_data', 'local_massenrol'),
        'use_eos_data' => get_string('use_eos_data', 'local_massenrol'),
        'create_new_user' => get_string('create_new_user', 'local_massenrol'),
        'btn_enrol_all_new' => get_string('btn_enrol_all_new', 'local_massenrol'),
        'select_user' => get_string('select_user', 'local_massenrol'),
        'select_user_desc' => get_string('select_user_desc', 'local_massenrol'),
        'no_users_selected' => get_string('no_users_selected', 'local_massenrol'),
        
        // Статусы
        'status_new' => get_string('status_new', 'local_massenrol'),
        'status_existing' => get_string('status_existing', 'local_massenrol'),
        'status_conflict' => get_string('status_conflict', 'local_massenrol'),
        'status_ready' => get_string('status_ready', 'local_massenrol'),
        
        // Проверка логина и email
        'login_available' => get_string('login_available', 'local_massenrol'),
        'login_taken' => get_string('login_taken', 'local_massenrol'),
        'login_invalid_format' => get_string('login_invalid_format', 'local_massenrol'),
        'email_available' => get_string('email_available', 'local_massenrol'),
        'email_taken' => get_string('email_taken', 'local_massenrol'),
        'email_invalid_format' => get_string('email_invalid_format', 'local_massenrol'),
        'proceedlogincheck' => get_string('proceedlogincheck', 'local_massenrol'),
        'proceedcoursecheck' => get_string('proceedcoursecheck', 'local_massenrol'),
        
        // Проверка курсов и групп
        'course_exists' => get_string('course_exists', 'local_massenrol'),
        'course_not_found' => get_string('course_not_found', 'local_massenrol'),
        'group_exists' => get_string('group_exists', 'local_massenrol'),
        'group_not_found' => get_string('group_not_found', 'local_massenrol'),
        'search_course' => get_string('search_course', 'local_massenrol'),
        'search_course_placeholder' => get_string('search_course_placeholder', 'local_massenrol'),
        'no_courses_found' => get_string('no_courses_found', 'local_massenrol'),
        'select_course' => get_string('select_course', 'local_massenrol'),
        'create_group' => get_string('create_group', 'local_massenrol'),
        'create_all_groups' => get_string('create_all_groups', 'local_massenrol'),
        'proceedgroupcheck' => get_string('proceedgroupcheck', 'local_massenrol'),
        'proceedenrol' => get_string('proceedenrol', 'local_massenrol'),
        
        // Зачисление и отчёты
        'startenrol' => get_string('start_enrolment', 'local_massenrol'),
        'downloadreport' => get_string('download_report', 'local_massenrol'),
        'enrolment_summary' => get_string('enrolment_summary', 'local_massenrol'),
        'total_users' => get_string('total_users', 'local_massenrol'),
        'enrolment_results' => get_string('enrolment_results', 'local_massenrol'),
        'result_success' => get_string('result_success', 'local_massenrol'),
        'result_error' => get_string('result_error', 'local_massenrol'),
        
        // Сообщения
        'nousersforenrol' => get_string('nousersforenrol', 'local_massenrol'),
        'errorsfound' => get_string('errorsfound', 'local_massenrol'),
        'confirmclear' => get_string('confirmclear', 'local_massenrol'),
        'confirm_start_enrolment' => get_string('confirm_start_enrolment', 'local_massenrol'),
        'confirm_create_groups' => get_string('confirm_create_groups', 'local_massenrol'),
        
        // Подсказки и контекстное меню
        'edit_hint' => get_string('edit_hint', 'local_massenrol'),
        'insertrow' => get_string('insertrow', 'local_massenrol'),
        'deleterow' => get_string('deleterow', 'local_massenrol'),
        
        // Ошибки AJAX
        'ajax_error_unknown' => get_string('ajax_error_unknown', 'local_massenrol'),
        'ajax_error_permission' => get_string('ajax_error_permission', 'local_massenrol'),
        'ajax_error_session' => get_string('ajax_error_session', 'local_massenrol'),
        'ajax_error_network' => get_string('ajax_error_network', 'local_massenrol'),
        'ajax_error_timeout' => get_string('ajax_error_timeout', 'local_massenrol'),
        
        // Статусная панель
        'info_panel_title' => 'Статус операции',
        'info_step' => 'Шаг {$a->current} из {$a->total}: {$a->name}',
        'info_rows' => 'Строк: {$a->current} / {$a->max}',
        'info_valid' => '✅ Все строки валидны',
        'info_errors' => '❌ Ошибки в {$a} строках',
        'info_user_check' => 'Проверено пользователей: {$a->done} / {$a->total}',
        'info_autosave' => 'Черновик сохранён: {$a}',
        'info_hint_ctrl_enter' => '💡 Ctrl+Enter — быстрая проверка',
        'info_hint_paste' => '💡 Ctrl+V — вставка из Excel (строки добавятся автоматически)',
        'info_hint_generate' => '💡 Клик в поле пароля — автогенерация',
        
        // Прогресс
        'progress_validating' => 'Валидация ФИО...',
        'progress_checking_users' => 'Проверка пользователей в Moodle...',
        'progress_checking_logins' => 'Проверка уникальности логинов...',
        'progress_checking_emails' => 'Проверка email...',
        'progress_checking_courses' => 'Проверка курсов...',
        'progress_checking_groups' => 'Проверка групп...',
        'progress_enrolling' => 'Выполняется зачисление...',
    ],
    
    'config' => [
        'passwordlength' => (int) get_config('local_massenrol', 'passwordlength') ?: 8,
        'autogeneratepassword' => (bool) get_config('local_massenrol', 'autogeneratepassword'),
        'maxrows' => (int) get_config('local_massenrol', 'maxrows') ?: 5000,
        'defaultrole' => (int) get_config('local_massenrol', 'defaultrole') ?: 5,
        'passwordspecialchars' => get_config('local_massenrol', 'passwordspecialchars') ?: '*-#',
        'passwordrequireupper' => (bool) get_config('local_massenrol', 'passwordrequireupper'),
        'passwordrequiredigits' => (bool) get_config('local_massenrol', 'passwordrequiredigits'),
        'passwordrequirespecial' => (bool) get_config('local_massenrol', 'passwordrequirespecial'),
        'allowedemaildomains' => get_config('local_massenrol', 'allowedemaildomains'),
        'autogenerateusername' => (bool) get_config('local_massenrol', 'autogenerateusername'),
        'usernameformat' => get_config('local_massenrol', 'usernameformat') ?: 'firstname.lastname',
        'defaultrowcount' => (int) get_config('local_massenrol', 'defaultrowcount') ?: 10,
        'debugajax' => (bool) get_config('local_massenrol', 'debugajax'),
    ],
    
    'user' => [
        'id' => $USER->id,
        'username' => $USER->username,
        'fullname' => fullname($USER),
        'lang' => current_language(),
    ],
    
    'steps' => [
        1 => ['name' => 'Ввод данных', 'total' => 5],
        2 => ['name' => 'Проверка пользователей', 'total' => 5],
        3 => ['name' => 'Проверка курсов', 'total' => 5],
        4 => ['name' => 'Проверка групп', 'total' => 5],
        5 => ['name' => 'Зачисление', 'total' => 5],
    ],
];

echo '<script>window.massenrolConfig = ' . json_encode($jsconfig, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) . ';</script>';
$PAGE->requires->js('/local/massenrol/js/validation.js');
$PAGE->requires->js('/local/massenrol/js/massenrol.js');

echo $OUTPUT->header();
?>

<!-- ======================================================================== -->
<!-- КОНТЕЙНЕР ДЛЯ ЭТАПА 1: ВВОД ДАННЫХ                                       -->
<!-- ======================================================================== -->
<div id="step1-container" class="step-container" role="region" aria-labelledby="step1-heading">
    <h2 id="step1-heading" class="sr-only"><?php echo get_string('step1', 'local_massenrol'); ?></h2>
    
    <div id="add-rows-panel-x" class="alert alert-warning" role="note">
        <i class="icon fa fa-info-circle" aria-hidden="true"></i>
        <?php echo get_string('edit_hint', 'local_massenrol'); ?>
    </div>

    <form id="step1-form" novalidate>
        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
        <input type="hidden" name="rows" id="rows-input" value="">

        <div class="action-bar mb-3" role="toolbar" aria-label="<?php echo get_string('actions', 'local_massenrol'); ?>">
            <button type="button" id="undo-btn" class="btn btn-secondary" 
                    title="<?php echo get_string('undo_title', 'local_massenrol'); ?>"
                    aria-label="<?php echo get_string('undo', 'local_massenrol'); ?>">
                ↩ <?php echo get_string('undo', 'local_massenrol'); ?>
            </button>
            <button type="button" id="clear-table" class="btn btn-outline-secondary">
                <?php echo get_string('cleartable', 'local_massenrol'); ?>
            </button>
        </div>

        <div id="validation-errors" class="alert alert-danger" role="alert" style="display: none;" aria-live="polite"></div>

        <div id="spreadsheet" role="grid" aria-label="<?php echo get_string('pluginname', 'local_massenrol'); ?>"></div>

        <div id="add-rows-panel" class="mt-3 d-flex align-items-center gap-2" role="group" aria-label="<?php echo get_string('addrows', 'local_massenrol'); ?>">
            <label for="rows-to-add" class="mb-0">
                <?php echo get_string('addrows', 'local_massenrol'); ?>:
            </label>
            <input type="number" id="rows-to-add" value="1" min="1" max="100" 
                   class="form-control form-control-sm" style="width: 80px;"
                   aria-label="<?php echo get_string('number', 'local_massenrol'); ?>">
            <button type="button" id="add-rows-btn" class="btn btn-primary btn-sm">
                <?php echo get_string('add', 'local_massenrol'); ?>
            </button>
        </div>

        <!-- Информационная панель (синяя) -->
        <div id="info-panel" class="alert alert-primary mt-3 mb-0" role="status" aria-live="polite">
            <div class="d-flex flex-wrap align-items-center gap-3">
                <div>
                    <strong>Строк:</strong>
                    <span id="info-rows">0</span>
                    <span id="info-autosave" class="ms-3 text-success">✅ Черновик сохранён: --:--:--</span>
                </div>
            </div>
             <!-- ✅ Новая постоянная подсказка о редактировании -->
    <div class="small text-muted mt-2" id="static-edit-hint">
        ✏️ Для изменения данных в ячейке дважды щёлкните по ячейке.
    </div>
            <div class="small text-muted mt-1" id="info-hint">
    Для начала зачисления нажмите пожалуйста кнопку «Проверить данные»
</div>

    
            <!-- Скрытые элементы для JS (прогресс и т.п.) -->
            <div id="info-progress-container" style="display: none;" class="mt-2">
                <div class="progress" style="height: 4px;">
                    <div id="info-progress-bar" class="progress-bar" role="progressbar" style="width: 0%"></div>
                </div>
                <small id="info-progress-text" class="text-muted"></small>
            </div>
        </div>

        <div id="validation-buttons" class="mt-3" role="region" aria-live="polite"></div>

        <!-- КНОПКА МАССОВОГО НАЗНАЧЕНИЯ КУРСОВ (будет показана после проверки паролей) -->
        <div id="mass-assign-container" class="mt-3" style="display: none;">
            <button type="button" id="mass-assign-btn" class="btn btn-primary btn-lg" disabled>
    <i class="icon fa fa-copy"></i> Изменить курсы/группы для выделенных строк
</button>
        </div>

        <!-- Кнопка проверки по центру -->
        <div id="check-btn-container" class="d-flex justify-content-center mt-4 pt-3 border-top">
            <button type="button" id="check-btn" class="btn btn-success btn-lg">
                Проверить данные
            </button>
        </div>
    </form>
</div>

<!-- ======================================================================== -->
<!-- КОНТЕЙНЕРЫ ДЛЯ ЭТАПОВ 2-5 (сокращённо, аналогично step1)               -->
<!-- ======================================================================== -->
<div id="step2-container" class="step-container" style="display: none;" role="region">
    <h2><?php echo get_string('step2', 'local_massenrol'); ?></h2>
    <p class="text-muted"><?php echo get_string('step2_desc', 'local_massenrol'); ?></p>
    <div id="validation-panel" class="card card-body bg-light">
        <p class="mb-0"><i class="icon fa fa-cog fa-spin" aria-hidden="true"></i> <?php echo get_string('loading', 'local_massenrol'); ?></p>
    </div>
    <div class="d-flex justify-content-between mt-4 pt-3 border-top">
        <button type="button" id="back-to-step1" class="btn btn-secondary"><?php echo get_string('previous', 'local_massenrol'); ?></button>
        <button type="button" id="next-to-step3" class="btn btn-primary" disabled><?php echo get_string('next', 'local_massenrol'); ?></button>
    </div>
</div>

<div id="step3-container" class="step-container" style="display: none;" role="region">
    <h2><?php echo get_string('step3', 'local_massenrol'); ?></h2>
    <p class="text-muted"><?php echo get_string('step3_desc', 'local_massenrol'); ?></p>
    <div id="courses-panel" class="card card-body bg-light">
        <p class="mb-0"><i class="icon fa fa-cog fa-spin" aria-hidden="true"></i> <?php echo get_string('loading', 'local_massenrol'); ?></p>
    </div>
    <div class="d-flex justify-content-between mt-4 pt-3 border-top">
        <button type="button" id="back-to-step2" class="btn btn-secondary"><?php echo get_string('previous', 'local_massenrol'); ?></button>
        <button type="button" id="next-to-step4" class="btn btn-primary" disabled><?php echo get_string('next', 'local_massenrol'); ?></button>
    </div>
</div>

<div id="step4-container" class="step-container" style="display: none;" role="region">
    <h2><?php echo get_string('step4', 'local_massenrol'); ?></h2>
    <p class="text-muted"><?php echo get_string('step4_desc', 'local_massenrol'); ?></p>
    <div id="groups-panel" class="card card-body bg-light">
        <p class="mb-0"><i class="icon fa fa-cog fa-spin" aria-hidden="true"></i> <?php echo get_string('loading', 'local_massenrol'); ?></p>
    </div>
    <div class="d-flex justify-content-between mt-4 pt-3 border-top">
        <button type="button" id="back-to-step3" class="btn btn-secondary"><?php echo get_string('previous', 'local_massenrol'); ?></button>
        <button type="button" id="next-to-step5" class="btn btn-primary" disabled><?php echo get_string('proceedenrol', 'local_massenrol'); ?></button>
    </div>
</div>

<div id="step5-container" class="step-container" style="display: none;" role="region">
    <h2><?php echo get_string('step5', 'local_massenrol'); ?></h2>
    <p class="text-muted"><?php echo get_string('step5_desc', 'local_massenrol'); ?></p>
    
    <div id="enrolment-summary" class="card mb-4">
        <div class="card-header bg-primary text-white">
            <h3 class="mb-0"><?php echo get_string('enrolment_summary', 'local_massenrol'); ?></h3>
        </div>
        <div class="card-body">
            <div class="row" id="summary-content">
                <div class="col-md-6">
                    <p><strong><?php echo get_string('total_users', 'local_massenrol'); ?>:</strong> <span id="summary-users">—</span></p>
                    <p><strong><?php echo get_string('new_users_count', 'local_massenrol'); ?>:</strong> <span id="summary-new">—</span></p>
                </div>
                <div class="col-md-6">
                    <p><strong><?php echo get_string('total_courses', 'local_massenrol'); ?>:</strong> <span id="summary-courses">—</span></p>
                    <p><strong><?php echo get_string('total_groups', 'local_massenrol'); ?>:</strong> <span id="summary-groups">—</span></p>
                </div>
            </div>
        </div>
    </div>
    
    <div id="enrolment-progress" class="card mb-4" style="display: none;">
        <div class="card-header">
            <h4 class="mb-0"><?php echo get_string('enrolment_in_progress', 'local_massenrol'); ?></h4>
        </div>
        <div class="card-body">
            <div class="progress mb-3" role="progressbar">
                <div id="progress-bar" class="progress-bar progress-bar-striped progress-bar-animated" style="width: 0%">0%</div>
            </div>
            <div id="progress-status" class="text-muted small" aria-live="polite"></div>
            <div id="progress-log" class="mt-3 small" style="max-height: 200px; overflow-y: auto; display: none;"></div>
        </div>
    </div>
    
    <div id="results-panel" class="card" style="display: none;">
        <div class="card-header bg-success text-white">
            <h3 class="mb-0"><?php echo get_string('enrolment_complete', 'local_massenrol'); ?></h3>
        </div>
        <div class="card-body">
            <div id="results-summary" class="alert alert-info mb-3"></div>
            <div id="results-table" class="table-responsive"></div>
        </div>
    </div>
    
    <div class="d-flex justify-content-between mt-4 pt-3 border-top">
        <button type="button" id="new-enrolment-btn" class="btn btn-outline-danger">
            <?php echo get_string('resetall', 'local_massenrol'); ?>
        </button>
        <div>
            <button type="button" id="start-enrol-btn" class="btn btn-success btn-lg me-2">
                <?php echo get_string('start_enrolment', 'local_massenrol'); ?>
            </button>
            <button type="button" id="download-report-btn" class="btn btn-outline-success" style="display: none;">
                <?php echo get_string('download_report', 'local_massenrol'); ?>
            </button>
        </div>
    </div>
</div>

<!-- ======================================================================== -->
<!-- МОДАЛЬНЫЕ ОКНА                                                            -->
<!-- ======================================================================== -->
<div class="modal fade" id="userSelectionModal" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable" role="document">
        <div class="modal-content">
            <div class="modal-header bg-warning">
                <h5 class="modal-title" id="userSelectionModalLabel">
                    <i class="icon fa fa-users" aria-hidden="true"></i>
                    <?php echo get_string('select_user', 'local_massenrol'); ?>
                </h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="<?php echo get_string('close', 'local_massenrol'); ?>">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <p class="text-muted mb-3"><?php echo get_string('select_user_desc', 'local_massenrol'); ?></p>
                <div id="userSelectionList" role="listbox"></div>
                <div id="userSelectionEmpty" class="alert alert-warning" style="display: none;">
                    <?php echo get_string('no_users_selected', 'local_massenrol'); ?>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">
                    <?php echo get_string('cancel', 'local_massenrol'); ?>
                </button>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="courseSearchModal" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="courseSearchModalLabel">
                    <i class="icon fa fa-search" aria-hidden="true"></i>
                    <?php echo get_string('search_course', 'local_massenrol'); ?>
                </h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="<?php echo get_string('close', 'local_massenrol'); ?>">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="courseSearchInput" class="sr-only"><?php echo get_string('search', 'local_massenrol'); ?></label>
                    <input type="text" id="courseSearchInput" class="form-control" 
                           placeholder="<?php echo get_string('search_course_placeholder', 'local_massenrol'); ?>"
                           autocomplete="off">
                </div>
                <div id="courseSearchResults" class="mt-3" role="listbox"></div>
                <div id="courseSearchEmpty" class="alert alert-info mt-3" style="display: none;">
                    <?php echo get_string('no_courses_found', 'local_massenrol'); ?>
                </div>
                <div id="courseSearchLoading" class="text-center py-3" style="display: none;">
                    <div class="spinner-border text-primary" role="status">
                        <span class="sr-only"><?php echo get_string('loading', 'local_massenrol'); ?></span>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">
                    <?php echo get_string('cancel', 'local_massenrol'); ?>
                </button>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="confirmActionModal" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header bg-danger text-white">
                <h5 class="modal-title" id="confirmActionModalLabel">
                    <i class="icon fa fa-exclamation-triangle" aria-hidden="true"></i>
                    <?php echo get_string('warning', 'local_massenrol'); ?>
                </h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="<?php echo get_string('close', 'local_massenrol'); ?>">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <p id="confirmActionMessage"></p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">
                    <?php echo get_string('cancel', 'local_massenrol'); ?>
                </button>
                <button type="button" id="confirmActionProceed" class="btn btn-danger">
                    <?php echo get_string('yes', 'local_massenrol'); ?>
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Модальное окно для массового назначения курсов (новое) -->
<div class="modal fade" id="assignCoursesModal" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-header bg-primary text-white">
                <h5 class="modal-title">Назначение курсов и групп выделенным строкам</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <p>Введите списки курсов и групп для назначения всем выделенным строкам.</p>
                <div class="form-group">
                    <label for="coursesInput">Список курсов (через точку с запятой):</label>
                    <input type="text" id="coursesInput" class="form-control" placeholder="Например: ДПО_Б.1.10;ДПО_Б.1.11;ДПО_Б.8.3" required>
                </div>
                <div class="form-group">
                    <label for="groupsInput">Список групп (через точку с запятой, необязательно):</label>
                    <input type="text" id="groupsInput" class="form-control" placeholder="Группы в том же порядке">
                </div>
                <small class="text-muted">Если групп меньше, для оставшихся курсов группа не указывается.</small>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Отмена</button>
                <button type="button" id="applyAssignBtn" class="btn btn-primary">Применить</button>
            </div>
        </div>
    </div>
</div>

<!-- ======================================================================== -->
<!-- СКРЫТЫЕ ЭЛЕМЕНТЫ ДЛЯ JS                                                 -->
<!-- ======================================================================== -->
<div id="ajax-loader" class="ajax-loader" style="display: none;" aria-hidden="true">
    <div class="spinner-border text-primary" role="status">
        <span class="sr-only"><?php echo get_string('loading', 'local_massenrol'); ?></span>
    </div>
</div>

<div id="toast-container" class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 9999;" aria-live="polite" aria-atomic="true"></div>

<?php
echo $OUTPUT->footer();