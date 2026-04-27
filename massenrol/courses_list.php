<?php
// local/massenrol/courses_list.php
// Страница со списком всех курсов для просмотра (только для пользователей с правом massenrol:manage)

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

$context = context_system::instance();
require_login();
require_capability('local/massenrol:manage', $context);

$PAGE->set_url('/local/massenrol/courses_list.php');
$PAGE->set_context($context);
$PAGE->set_title(get_string('pluginname', 'local_massenrol') . ' - Список курсов');
$PAGE->set_heading(get_string('pluginname', 'local_massenrol') . ' - Список курсов');
$PAGE->navbar->add(get_string('pluginname', 'local_massenrol'), new moodle_url('/local/massenrol/index.php'));
$PAGE->navbar->add('Список курсов');

echo $OUTPUT->header();

// Получаем все курсы (кроме главного)
$courses = get_courses('all', 'c.fullname ASC', 'c.id, c.shortname, c.fullname, c.category');
// Убираем главный курс (id = 1)
$courses = array_filter($courses, function($course) {
    return $course->id != SITEID;
});

echo html_writer::start_div('container-fluid');
echo html_writer::tag('h3', 'Все доступные курсы', array('class' => 'mb-4'));

if (empty($courses)) {
    echo html_writer::tag('p', 'Курсы не найдены.', array('class' => 'alert alert-info'));
} else {
    $table = new html_table();
    $table->head = array('ID', 'Короткое имя', 'Полное название', 'Категория');
    $table->data = array();
    foreach ($courses as $course) {
        $category = $DB->get_record('course_categories', array('id' => $course->category));
        $catname = $category ? $category->name : 'Без категории';
        $table->data[] = array(
            $course->id,
            s($course->shortname),
            s($course->fullname),
            s($catname)
        );
    }
    echo html_writer::table($table);
}

echo html_writer::link(new moodle_url('/local/massenrol/index.php'), 'Вернуться к массовому зачислению', array('class' => 'btn btn-primary mt-3'));
echo html_writer::end_div();

echo $OUTPUT->footer();