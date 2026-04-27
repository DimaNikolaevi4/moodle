<?php
// local/massenrol/settings.php
// Administration settings for the Mass Enrolment plugin
// @package    local_massenrol
// @copyright  2026 Your Institution
// @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later

defined('MOODLE_INTERNAL') || die();

// ============================================================================
// ПРОВЕРКА ПРАВ АДМИНИСТРАТОРА
// ============================================================================
if (!$hassiteconfig) {
    return;
}

// ============================================================================
// СОЗДАНИЕ СТРАНИЦЫ НАСТРОЕК ПЛАГИНА
// ============================================================================
$settings = new admin_settingpage('local_massenrol', get_string('pluginname', 'local_massenrol'));

if ($ADMIN->fulltree) {
    
    // ==========================================================================
    // РАЗДЕЛ: ОБЩИЕ НАСТРОЙКИ
    // ==========================================================================
    $settings->add(new admin_setting_heading(
        'local_massenrol/generalsettings',
        get_string('generalsettings', 'local_massenrol', 'Общие настройки'),
        get_string('generalsettings_desc', 'local_massenrol', 'Базовые параметры работы плагина массового зачисления.')
    ));

    // --------------------------------------------------------------------------
    // Роль по умолчанию для зачисления
    // --------------------------------------------------------------------------
    $roles = role_get_names(context_system::instance(), false, true);
    $rolechoices = [];
    foreach ($roles as $role) {
        // Исключаем системные роли, которые не подходят для зачисления
        if (!in_array($role->shortname, ['guest', 'user'])) {
            $rolechoices[$role->id] = format_string($role->localname);
        }
    }
    
    $settings->add(new admin_setting_configselect(
        'local_massenrol/defaultrole',
        get_string('defaultrole', 'local_massenrol'),
        get_string('defaultrole_desc', 'local_massenrol'),
        5, // ID роли "student" по умолчанию
        $rolechoices
    ));

    // --------------------------------------------------------------------------
    // Автогенерация пароля
    // --------------------------------------------------------------------------
    $settings->add(new admin_setting_configcheckbox(
        'local_massenrol/autogeneratepassword',
        get_string('autogeneratepassword', 'local_massenrol'),
        get_string('autogeneratepassword_desc', 'local_massenrol'),
        1 // Значение по умолчанию: включено
    ));

    // --------------------------------------------------------------------------
    // Длина генерируемого пароля
    // --------------------------------------------------------------------------
    $settings->add(new admin_setting_configtext(
        'local_massenrol/passwordlength',
        get_string('passwordlength', 'local_massenrol'),
        get_string('passwordlength_desc', 'local_massenrol'),
        8,
        PARAM_INT,
        3 // Размер поля ввода
    ));
    // Валидация: длина пароля от 8 до 128 символов
    $settings->add(new admin_setting_configtext(
        'local_massenrol/passwordlength_validation',
        '',
        '',
        '',
        PARAM_RAW,
        0
    ));
    // Примечание: реальная валидация будет в коде при использовании значения

    // --------------------------------------------------------------------------
    // Специальные символы для паролей
    // --------------------------------------------------------------------------
    $settings->add(new admin_setting_configtext(
        'local_massenrol/passwordspecialchars',
        get_string('passwordspecialchars', 'local_massenrol'),
        get_string('passwordspecialchars_desc', 'local_massenrol'),
        '*-#',
        PARAM_TEXT,
        20
    ));

    // --------------------------------------------------------------------------
    // Требования к сложности пароля
    // --------------------------------------------------------------------------
    $settings->add(new admin_setting_configcheckbox(
        'local_massenrol/passwordrequireupper',
        get_string('passwordrequireupper', 'local_massenrol'),
        get_string('passwordrequireupper_desc', 'local_massenrol'),
        1
    ));
    
    $settings->add(new admin_setting_configcheckbox(
        'local_massenrol/passwordrequiredigits',
        get_string('passwordrequiredigits', 'local_massenrol'),
        get_string('passwordrequiredigits_desc', 'local_massenrol'),
        1
    ));
    
    $settings->add(new admin_setting_configcheckbox(
        'local_massenrol/passwordrequirespecial',
        get_string('passwordrequirespecial', 'local_massenrol'),
        get_string('passwordrequirespecial_desc', 'local_massenrol'),
        0
    ));

    // ==========================================================================
    // РАЗДЕЛ: ОГРАНИЧЕНИЯ И БЕЗОПАСНОСТЬ
    // ==========================================================================
    $settings->add(new admin_setting_heading(
        'local_massenrol/limitssettings',
        get_string('limitssettings', 'local_massenrol', 'Ограничения и безопасность'),
        get_string('limitssettings_desc', 'local_massenrol', 'Параметры для защиты от перегрузки и обеспечения безопасности.')
    ));

    // --------------------------------------------------------------------------
    // Максимальное количество строк для обработки
    // --------------------------------------------------------------------------
    $settings->add(new admin_setting_configtext(
        'local_massenrol/maxrows',
        get_string('maxrows', 'local_massenrol'),
        get_string('maxrows_desc', 'local_massenrol'),
        5000,
        PARAM_INT,
        6
    ));

    // --------------------------------------------------------------------------
    // Таймаут выполнения скрипта (в секундах)
    // --------------------------------------------------------------------------
    $settings->add(new admin_setting_configtext(
        'local_massenrol/maxexecutiontime',
        get_string('maxexecutiontime', 'local_massenrol'),
        get_string('maxexecutiontime_desc', 'local_massenrol'),
        300,
        PARAM_INT,
        5
    ));

    // --------------------------------------------------------------------------
    // Разрешённые домены email
    // --------------------------------------------------------------------------
    $settings->add(new admin_setting_configtext(
        'local_massenrol/allowedemaildomains',
        get_string('allowedemaildomains', 'local_massenrol'),
        get_string('allowedemaildomains_desc', 'local_massenrol'),
        '',
        PARAM_TEXT,
        50
    ));

    // --------------------------------------------------------------------------
    // Требовать подтверждение email при создании пользователя
    // --------------------------------------------------------------------------
    $settings->add(new admin_setting_configcheckbox(
        'local_massenrol/requireemailconfirmation',
        get_string('requireemailconfirmation', 'local_massenrol'),
        get_string('requireemailconfirmation_desc', 'local_massenrol'),
        0
    ));

    // ==========================================================================
    // РАЗДЕЛ: ИНТЕРФЕЙС И UX
    // ==========================================================================
    $settings->add(new admin_setting_heading(
        'local_massenrol/uisettings',
        get_string('uisettings', 'local_massenrol', 'Интерфейс и удобство'),
        get_string('uisettings_desc', 'local_massenrol', 'Настройки отображения и поведения интерфейса.')
    ));

    // --------------------------------------------------------------------------
    // Язык интерфейса по умолчанию
    // --------------------------------------------------------------------------
    $languages = get_string_manager()->get_list_of_translations();
    $settings->add(new admin_setting_configselect(
        'local_massenrol/defaultlanguage',
        get_string('defaultlanguage', 'local_massenrol'),
        get_string('defaultlanguage_desc', 'local_massenrol'),
        'ru',
        $languages
    ));

    // --------------------------------------------------------------------------
    // Количество строк по умолчанию при старте
    // --------------------------------------------------------------------------
    $settings->add(new admin_setting_configselect(
        'local_massenrol/defaultrowcount',
        get_string('defaultrowcount', 'local_massenrol'),
        get_string('defaultrowcount_desc', 'local_massenrol'),
        10,
        [5 => '5', 10 => '10', 20 => '20', 50 => '50', 100 => '100']
    ));

    // --------------------------------------------------------------------------
    // Включить автозаполнение логина из ФИО
    // --------------------------------------------------------------------------
    $settings->add(new admin_setting_configcheckbox(
        'local_massenrol/autogenerateusername',
        get_string('autogenerateusername', 'local_massenrol'),
        get_string('autogenerateusername_desc', 'local_massenrol'),
        1
    ));

    // --------------------------------------------------------------------------
    // Формат генерации логина
    // --------------------------------------------------------------------------
    $usernameformats = [
        'firstname.lastname' => get_string('username_format_firstname_lastname', 'local_massenrol'),
        'lastname.firstname' => get_string('username_format_lastname_firstname', 'local_massenrol'),
        'firstname_lastname' => get_string('username_format_firstname_lastname_underscore', 'local_massenrol'),
        'lastname_firstname' => get_string('username_format_lastname_firstname_underscore', 'local_massenrol'),
        'firstletter_lastname' => get_string('username_format_firstletter_lastname', 'local_massenrol'),
    ];
    
    $settings->add(new admin_setting_configselect(
        'local_massenrol/usernameformat',
        get_string('usernameformat', 'local_massenrol'),
        get_string('usernameformat_desc', 'local_massenrol'),
        'firstname.lastname',
        $usernameformats
    ));

    // ==========================================================================
    // РАЗДЕЛ: ОТЛАДКА И ЛОГИРОВАНИЕ
    // ==========================================================================
    $settings->add(new admin_setting_heading(
        'local_massenrol/debugsettings',
        get_string('debugsettings', 'local_massenrol', 'Отладка и логирование'),
        get_string('debugsettings_desc', 'local_massenrol', 'Параметры для разработчиков и администраторов.')
    ));

    // --------------------------------------------------------------------------
    // Отладка AJAX-запросов
    // --------------------------------------------------------------------------
    $settings->add(new admin_setting_configcheckbox(
        'local_massenrol/debugajax',
        get_string('debugajax', 'local_massenrol'),
        get_string('debugajax_desc', 'local_massenrol'),
        0
    ));

    // --------------------------------------------------------------------------
    // Логирование операций зачисления
    // --------------------------------------------------------------------------
    $settings->add(new admin_setting_configcheckbox(
        'local_massenrol/logoperations',
        get_string('logoperations', 'local_massenrol'),
        get_string('logoperations_desc', 'local_massenrol'),
        1
    ));

    // --------------------------------------------------------------------------
    // Уровень логирования
    // --------------------------------------------------------------------------
    $loglevels = [
        'error' => get_string('loglevel_error', 'local_massenrol'),
        'warning' => get_string('loglevel_warning', 'local_massenrol'),
        'info' => get_string('loglevel_info', 'local_massenrol'),
        'debug' => get_string('loglevel_debug', 'local_massenrol'),
    ];
    
    $settings->add(new admin_setting_configselect(
        'local_massenrol/loglevel',
        get_string('loglevel', 'local_massenrol'),
        get_string('loglevel_desc', 'local_massenrol'),
        'warning',
        $loglevels
    ));
}

// ============================================================================
// ДОБАВЛЕНИЕ СТРАНИЦЫ В АДМИН-МЕНЮ
// ============================================================================

// Добавляем страницу настроек в раздел "Локальные плагины"
$ADMIN->add('localplugins', $settings);

// Добавляем внешнюю страницу для доступа к интерфейсу плагина
$ADMIN->add('users', new admin_externalpage(
    'local_massenrol_interface',
    get_string('pluginname', 'local_massenrol'),
    new moodle_url('/local/massenrol/index.php'),
    'local/massenrol:manage',
    false,
    context_system::instance()
));