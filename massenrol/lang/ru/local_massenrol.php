<?php
// lang/ru/local_massenrol.php
// Russian language pack for local_massenrol plugin
// @package    local_massenrol
// @copyright  2026 Your Institution
// @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later

defined('MOODLE_INTERNAL') || die();

// ============================================================================
// ОСНОВНЫЕ СТРОКИ ПЛАГИНА
// ============================================================================
$string['pluginname'] = 'Массовое зачисление';
$string['massenrol:manage'] = 'Управление массовым зачислением';
$string['privacy:metadata'] = 'Плагин «Массовое зачисление» не хранит персональные данные пользователей.';

// ============================================================================
// НАСТРОЙКИ ПЛАГИНА
// ============================================================================
$string['settings'] = 'Настройки массового зачисления';
$string['defaultrole'] = 'Роль по умолчанию';
$string['defaultrole_desc'] = 'Роль, которая будет назначаться пользователям при зачислении на курс.';
$string['autogeneratepassword'] = 'Автогенерация пароля';
$string['autogeneratepassword_desc'] = 'Если поле пароля пустое, автоматически генерировать случайный пароль.';
$string['passwordlength'] = 'Длина пароля';
$string['passwordlength_desc'] = 'Количество символов в автоматически генерируемом пароле (мин. 8).';
$string['maxrows'] = 'Максимальное количество строк';
$string['maxrows_desc'] = 'Ограничение на количество обрабатываемых строк за один раз (защита от перегрузки).';
$string['allowedemaildomains'] = 'Разрешённые домены email';
$string['allowedemaildomains_desc'] = 'Список доменов email, разделённых запятыми. Оставьте пустым для разрешения любых доменов.';
$string['debugajax'] = 'Отладка AJAX-запросов';
$string['debugajax_desc'] = 'Записывать детали AJAX-запросов в error_log для отладки.';

// ============================================================================
// ЭТАП 1: ВВОД ДАННЫХ
// ============================================================================
$string['step1'] = 'Шаг 1: Ввод данных';
$string['step1_desc'] = 'Скопируйте строки из Excel и вставьте их в таблицу (Ctrl+V). После вставки вы можете отредактировать любые ячейки.';
$string['edit_hint'] = '💡 Подсказка: Выделите нужные ячейки в Excel, скопируйте (Ctrl+C), затем кликните в левую верхнюю ячейку таблицы и нажмите Ctrl+V. Строки и колонки добавятся автоматически. Важно: порядок колонок должен соответствовать порядку в таблице (Фамилия, Имя, Отчество, Логин, Email, Пароль, Курс, Группа). При возникновении ошибок внимательно читайте информацию под таблицей (сиреневая область) и следуйте рекомендациям.';
// Заголовки колонок таблицы
$string['lastname'] = 'Фамилия';
$string['firstname'] = 'Имя';
$string['middlename'] = 'Отчество';
$string['username'] = 'Логин';
$string['email'] = 'Эл. почта';
$string['password'] = 'Пароль';
$string['courseshortname'] = 'Курс';
$string['groupname'] = 'Группа';
$string['status'] = 'Статус';

// Кнопки и действия этапа 1
$string['addrows'] = 'Добавить строки';
$string['number'] = 'Количество';
$string['add'] = 'Добавить';
$string['cleartable'] = 'Очистить таблицу';
$string['resetall'] = 'Новое зачисление';
$string['confirmclear'] = 'Вы действительно хотите очистить таблицу? Все несохранённые данные будут потеряны.';
$string['check'] = 'Проверить';
$string['undo'] = 'Отменить';
$string['undo_title'] = 'Отменить последнее действие (Ctrl+Z)';
$string['insertrow'] = 'Вставить строку';
$string['deleterow'] = 'Удалить строку';

// Валидация ФИО (Действия 10–12)
$string['missing_lastname'] = 'Фамилия не заполнена';
$string['missing_firstname'] = 'Имя не заполнено';
$string['missing_middlename'] = 'Отчество не заполнено';
$string['invalid_lastname'] = 'Недопустимые символы в фамилии';
$string['invalid_firstname'] = 'Недопустимые символы в имени';
$string['invalid_middlename'] = 'Недопустимые символы в отчестве';
$string['name_chars_allowed'] = 'Разрешены только кириллица, пробелы и дефисы';
$string['fixpassword'] = '🔑 Исправить пароль';
$string['password_simple'] = 'Пароль слишком простой';

// Кнопки валидации
$string['addwithoutmiddlename'] = 'Добавлять без отчества';
$string['fixedruncheck'] = 'Исправил, запустить проверку';
$string['proceedcheck'] = 'Перейти к проверке пользователей';
$string['nousersforenrol'] = 'Нет пользователей для зачисления';
$string['errorsfound'] = 'Найдены ошибки в {$a} строках';

// ============================================================================
// ДЕЙСТВИЕ 13: ПРОВЕРКА СУЩЕСТВОВАНИЯ ПОЛЬЗОВАТЕЛЯ
// ============================================================================
$string['user_not_found'] = 'Пользователь не найден — будет создан новый';
$string['user_found'] = 'Пользователь уже существует в системе';
$string['multiple_users_found'] = 'Найдено несколько пользователей с таким ФИО';
$string['choose_action'] = 'Выберите действие:';
$string['use_table_data'] = 'Оставить данные из таблицы';
$string['use_eos_data'] = 'Использовать данные из ЭОС';
$string['create_new_user'] = 'Создать нового пользователя';
$string['btn_enrol_all_new'] = 'Зачислить всех пользователей как новых';
$string['select_user'] = 'Выбор пользователя';
$string['select_user_desc'] = 'Найдите и выберите нужного пользователя из списка:';
$string['no_users_selected'] = 'Пользователь не выбран';

// Статусы пользователей
$string['status_new'] = '🆕 Новый пользователь';
$string['status_existing'] = '👤 Существующий пользователь';
$string['status_conflict'] = '⚠️ Требуется выбор действия';
$string['status_ready'] = '✅ Готов к зачислению';

// ============================================================================
// ДЕЙСТВИЯ 17–18: ВАЛИДАЦИЯ ЛОГИНА
// ============================================================================
$string['login_check'] = 'Проверка логина';
$string['login_available'] = 'Логин доступен';
$string['login_taken'] = 'Логин уже занят';
$string['login_invalid_format'] = 'Логин должен содержать только латинские буквы, цифры и символы _ . -';
$string['login_empty'] = 'Логин не может быть пустым';
$string['login_unique'] = 'Логин должен быть уникальным';
$string['fix_login'] = 'Исправить логин';
$string['proceedlogincheck'] = 'Перейти к проверке email';

// ============================================================================
// ДЕЙСТВИЯ 19–20: ВАЛИДАЦИЯ EMAIL
// ============================================================================
$string['email_check'] = 'Проверка email';
$string['email_available'] = 'Email доступен';
$string['email_taken'] = 'Email уже зарегистрирован';
$string['email_invalid_format'] = 'Неверный формат email';
$string['email_domain_not_allowed'] = 'Домен email не разрешён настройками плагина';
$string['email_empty'] = 'Email не может быть пустым';
$string['fix_email'] = 'Исправить email';
$string['proceedcoursecheck'] = 'Перейти к проверке курсов';

// ============================================================================
// ДЕЙСТВИЯ 21–24: ПРОВЕРКА КУРСОВ
// ============================================================================
$string['step3'] = 'Шаг 3: Проверка курсов';
$string['step3_desc'] = 'Проверьте, что все указанные курсы существуют в системе. Для несуществующих курсов выберите аналог из списка или создайте курс вручную.';
$string['course_exists'] = 'Курс найден';
$string['course_not_found'] = 'Курс не найден';
$string['course_invalid'] = 'Неверное короткое имя курса';
$string['course_empty'] = 'Курс не указан';
$string['search_course'] = '🔍 Выбрать курс';
$string['search_course_placeholder'] = 'Введите название или shortname курса...';
$string['no_courses_found'] = 'Курсы не найдены';
$string['select_course'] = 'Выбрать этот курс';
$string['course_selected'] = 'Курс выбран: {$a}';
$string['proceedgroupcheck'] = 'Перейти к проверке групп';

// ============================================================================
// ДЕЙСТВИЯ 25–29: ПРОВЕРКА И СОЗДАНИЕ ГРУПП
// ============================================================================
$string['step4'] = 'Шаг 4: Проверка групп';
$string['step4_desc'] = 'Проверьте, что все указанные группы существуют в соответствующих курсах. При необходимости создайте недостающие группы.';
$string['group_exists'] = 'Группа найдена';
$string['group_not_found'] = 'Группа не найдена';
$string['group_invalid'] = 'Неверное название группы';
$string['group_empty'] = 'Группа не указана';
$string['group_created'] = 'Группа успешно создана';
$string['group_already_exists'] = 'Группа с таким названием уже существует в этом курсе';
$string['create_group'] = 'Создать группу';
$string['create_all_groups'] = 'Создать все недостающие группы';
$string['confirm_create_groups'] = 'Создать {$a} недостающих групп? Это действие нельзя отменить.';
$string['creating_groups'] = 'Создание групп...';
$string['groups_created'] = 'Создано групп: {$a}';
$string['show_course_groups'] = 'Показать группы курса';
$string['course_groups_title'] = 'Группы курса: {$a}';
$string['no_groups_in_course'] = 'В этом курсе нет групп';
$string['proceedenrol'] = 'Перейти к зачислению';

// ============================================================================
// ДЕЙСТВИЯ 30–32: ЗАЧИСЛЕНИЕ И ОТЧЁТЫ
// ============================================================================
$string['step5'] = 'Шаг 5: Зачисление';
$string['step5_desc'] = 'Проверьте сводку и начните процесс массового зачисления пользователей на курсы.';
$string['enrolment_summary'] = 'Сводка зачисления';
$string['total_users'] = 'Всего пользователей: {$a}';
$string['total_courses'] = 'Всего курсов: {$a}';
$string['total_groups'] = 'Всего групп: {$a}';
$string['new_users_count'] = 'Будет создано новых пользователей: {$a}';
$string['existing_users_count'] = 'Будет использовано существующих пользователей: {$a}';
$string['start_enrolment'] = 'Начать зачисление';
$string['confirm_start_enrolment'] = 'Начать зачисление {$a} пользователей? Это действие может занять несколько минут.';

// Прогресс зачисления
$string['enrolment_in_progress'] = 'Выполняется зачисление...';
$string['processing_user'] = 'Обработка: {$a->fullname} ({$a->current}/{$a->total})';
$string['creating_user'] = 'Создание пользователя...';
$string['enrolling_user'] = 'Зачисление на курс...';
$string['adding_to_group'] = 'Добавление в группу...';
$string['enrolment_complete'] = 'Зачисление завершено';
$string['enrolment_finished'] = 'Обработано: {$a->total} записей. Успешно: {$a->success}, Ошибки: {$a->errors}';

// Результаты и отчёты
$string['enrolment_results'] = 'Результаты зачисления';
$string['result_success'] = '✅ Успешно';
$string['result_error'] = '❌ Ошибка';
$string['result_warning'] = '⚠️ Предупреждение';
$string['error_details'] = 'Детали ошибки';
$string['download_report'] = 'Скачать отчёт (CSV)';
$string['report_generated'] = 'Отчёт сформирован';
$string['report_filename'] = 'massenrol_report_{$a}.csv';

// Сообщения об ошибках зачисления
$string['error_user_create'] = 'Не удалось создать пользователя: {$a}';
$string['error_user_update'] = 'Не удалось обновить данные пользователя: {$a}';
$string['error_enrol'] = 'Не удалось зачислить пользователя на курс: {$a}';
$string['error_group_add'] = 'Не удалось добавить пользователя в группу: {$a}';
$string['error_course_not_found'] = 'Курс не найден: {$a}';
$string['error_group_not_found'] = 'Группа не найдена: {$a}';
$string['error_permission'] = 'Недостаточно прав для выполнения операции';

// ============================================================================
// НАВИГАЦИЯ И ОБЩИЕ ЭЛЕМЕНТЫ
// ============================================================================
$string['previous'] = 'Назад';
$string['next'] = 'Далее';
$string['cancel'] = 'Отмена';
$string['close'] = 'Закрыть';
$string['search'] = 'Поиск';
$string['loading'] = 'Загрузка...';
$string['saving'] = 'Сохранение...';
$string['saved'] = 'Сохранено';
$string['error'] = 'Ошибка';
$string['warning'] = 'Предупреждение';
$string['success'] = 'Успешно';
$string['yes'] = 'Да';
$string['no'] = 'Нет';

// ============================================================================
// AJAX-ОШИБКИ
// ============================================================================
$string['ajax_error_unknown'] = 'Неизвестная ошибка сервера';
$string['ajax_error_permission'] = 'Недостаточно прав для выполнения этого действия';
$string['ajax_error_session'] = 'Сессия истекла. Пожалуйста, обновите страницу и попробуйте снова';
$string['ajax_error_network'] = 'Ошибка сетевого соединения. Проверьте подключение к интернету';
$string['ajax_error_timeout'] = 'Превышено время ожидания ответа сервера';

// ============================================================================
// ПОДСКАЗКИ И TOOLTIPS
// ============================================================================
$string['tooltip_copy'] = 'Копировать выделенные ячейки (Ctrl+C)';
$string['tooltip_paste'] = 'Вставить из буфера обмена (Ctrl+V)';
$string['tooltip_delete_row'] = 'Удалить выделенную строку';
$string['tooltip_generate_password'] = 'Сгенерировать случайный пароль';
$string['tooltip_check_user'] = 'Проверить существование пользователя в Moodle';
$string['tooltip_select_course'] = 'Открыть поиск курсов';
$string['tooltip_create_group'] = 'Создать новую группу в курсе';

// ============================================================================
// СООБЩЕНИЯ ПОДТВЕРЖДЕНИЯ
// ============================================================================
$string['confirm_delete_row'] = 'Удалить эту строку?';
$string['confirm_overwrite_data'] = 'Перезаписать данные в выделенных ячейках?';
$string['confirm_discard_changes'] = 'У вас есть несохранённые изменения. Продолжить без сохранения?';

$string['enrolment_success'] = 'Пользователь успешно зачислен';
$string['user_creation_failed'] = 'Не удалось создать пользователя';
$string['enrolment_results'] = 'Результаты зачисления';
$string['download_report'] = 'Скачать отчёт';
$string['enrolment_in_progress'] = 'Зачисление выполняется...';
$string['enrolment_complete'] = 'Зачисление завершено';
// Добавьте следующие строки в файл /lang/ru/local_massenrol.php

$string['passwordspecialchars_desc'] = 'Набор специальных символов, которые могут использоваться в пароле. Например: .,;:!?_-+/*@#&$';
$string['passwordrequireupper_desc'] = 'Если включено, пароль должен содержать хотя бы одну заглавную букву.';
$string['passwordrequiredigits_desc'] = 'Если включено, пароль должен содержать хотя бы одну цифру.';
$string['passwordrequirespecial_desc'] = 'Если включено, пароль должен содержать хотя бы один специальный символ из набора, указанного выше.';
$string['maxexecutiontime'] = 'Максимальное время выполнения';
$string['maxexecutiontime_desc'] = 'Максимальное время в секундах, отведённое на выполнение скрипта массового зачисления.';
$string['requireemailconfirmation'] = 'Требовать подтверждение email';
$string['requireemailconfirmation_desc'] = 'Если включено, новые пользователи должны подтвердить свой email перед входом.';
$string['defaultlanguage'] = 'Язык по умолчанию';
$string['defaultlanguage_desc'] = 'Язык интерфейса, который будет установлен для новых создаваемых пользователей.';
$string['defaultrowcount'] = 'Количество строк по умолчанию';
$string['defaultrowcount_desc'] = 'Количество пустых строк, отображаемых при загрузке таблицы.';
$string['autogenerateusername_desc'] = 'Если логин не указан, автоматически генерировать его из ФИО.';
$string['usernameformat'] = 'Формат генерации логина';
$string['usernameformat_desc'] = 'Шаблон для создания логина из фамилии, имени и отчества.';
$string['username_format_firstname_lastname'] = 'имя.фамилия';
$string['username_format_lastname_firstname'] = 'фамилия.имя';
$string['username_format_firstname_lastname_'] = 'имя_фамилия';
$string['username_format_lastname_firstname_'] = 'фамилия_имя';
$string['username_format_firstletter_lastname'] = 'первая_буква_имени + фамилия';
$string['logoperations'] = 'Логирование операций';
$string['logoperations_desc'] = 'Вести журнал действий плагина (зачисление, создание групп и т.д.).';
$string['loglevel'] = 'Уровень логирования';
$string['loglevel_desc'] = 'Какой уровень детализации записывать в лог.';
$string['loglevel_info'] = 'Информационный';
$string['loglevel_warning'] = 'Предупреждения';
$string['loglevel_error'] = 'Только ошибки';