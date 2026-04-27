<?php
// lang/en/local_massenrol.php
// English language pack for local_massenrol plugin
// @package    local_massenrol
// @copyright  2026 Your Institution
// @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later

defined('MOODLE_INTERNAL') || die();

// ============================================================================
// CORE PLUGIN STRINGS
// ============================================================================
$string['pluginname'] = 'Mass Enrolment';
$string['massenrol:manage'] = 'Manage mass enrolment';
$string['privacy:metadata'] = 'The Mass Enrolment plugin does not store any personal user data.';

// ============================================================================
// PLUGIN SETTINGS
// ============================================================================
$string['settings'] = 'Mass enrolment settings';
$string['defaultrole'] = 'Default role';
$string['defaultrole_desc'] = 'The role that will be assigned to users when enrolling them in courses.';
$string['autogeneratepassword'] = 'Auto-generate password';
$string['autogeneratepassword_desc'] = 'If the password field is empty, automatically generate a random password.';
$string['passwordlength'] = 'Password length';
$string['passwordlength_desc'] = 'Number of characters in the auto-generated password (min. 8).';
$string['maxrows'] = 'Maximum number of rows';
$string['maxrows_desc'] = 'Limit on the number of rows processed at once (protection against overload).';
$string['allowedemaildomains'] = 'Allowed email domains';
$string['allowedemaildomains_desc'] = 'Comma-separated list of allowed email domains. Leave empty to allow any domain.';
$string['debugajax'] = 'Debug AJAX requests';
$string['debugajax_desc'] = 'Log AJAX request details to error_log for debugging purposes.';

// ============================================================================
// STEP 1: DATA ENTRY
// ============================================================================
$string['step1'] = 'Step 1: Enter data';
$string['step1_desc'] = 'Copy rows from Excel and paste them into the table (Ctrl+V). After pasting, you can edit any cell.';
$string['edit_hint'] = '💡 Tip: Select cells in Excel, copy (Ctrl+C), click any cell in the table, and paste (Ctrl+V). Data will automatically distribute across columns.';

// Table column headers
$string['lastname'] = 'Last name';
$string['firstname'] = 'First name';
$string['middlename'] = 'Middle name';
$string['username'] = 'Username';
$string['email'] = 'Email';
$string['password'] = 'Password';
$string['courseshortname'] = 'Course (shortname)';
$string['groupname'] = 'Group';
$string['status'] = 'Status';

// Step 1 buttons and actions
$string['addrows'] = 'Add rows';
$string['number'] = 'Number';
$string['add'] = 'Add';
$string['cleartable'] = 'Clear table';
$string['resetall'] = 'New enrolment';
$string['confirmclear'] = 'Are you sure you want to clear the table? All unsaved data will be lost.';
$string['check'] = 'Check';
$string['undo'] = 'Undo';
$string['undo_title'] = 'Undo last action (Ctrl+Z)';
$string['insertrow'] = 'Insert row';
$string['deleterow'] = 'Delete row';

// FIO validation (Actions 10–12)
$string['missing_lastname'] = 'Last name is required';
$string['missing_firstname'] = 'First name is required';
$string['missing_middlename'] = 'Middle name is required';
$string['invalid_lastname'] = 'Invalid characters in last name';
$string['invalid_firstname'] = 'Invalid characters in first name';
$string['invalid_middlename'] = 'Invalid characters in middle name';
$string['name_chars_allowed'] = 'Only Cyrillic letters, spaces, and hyphens are allowed';
$string['fixpassword'] = '🔑 Fix password';
$string['password_simple'] = 'Password is too simple';

// Validation buttons
$string['addwithoutmiddlename'] = 'Add without middle name';
$string['fixedruncheck'] = 'Fixed, run check again';
$string['proceedcheck'] = 'Proceed to user verification';
$string['nousersforenrol'] = 'No users to enrol';
$string['errorsfound'] = 'Errors found in {$a} rows';

// ============================================================================
// ACTION 13: USER EXISTENCE CHECK
// ============================================================================
$string['user_not_found'] = 'User not found — new user will be created';
$string['user_found'] = 'User already exists in the system';
$string['multiple_users_found'] = 'Multiple users found with this name';
$string['choose_action'] = 'Choose an action:';
$string['use_table_data'] = 'Keep data from table';
$string['use_eos_data'] = 'Use data from Moodle';
$string['create_new_user'] = 'Create new user';
$string['btn_enrol_all_new'] = 'Enrol all users as new';
$string['select_user'] = 'Select user';
$string['select_user_desc'] = 'Find and select the correct user from the list:';
$string['no_users_selected'] = 'No user selected';

// User statuses
$string['status_new'] = '🆕 New user';
$string['status_existing'] = '👤 Existing user';
$string['status_conflict'] = '⚠️ Action required';
$string['status_ready'] = '✅ Ready for enrolment';

// ============================================================================
// ACTIONS 17–18: USERNAME VALIDATION
// ============================================================================
$string['login_check'] = 'Username check';
$string['login_available'] = 'Username is available';
$string['login_taken'] = 'Username is already taken';
$string['login_invalid_format'] = 'Username must contain only Latin letters, numbers, and symbols _ . -';
$string['login_empty'] = 'Username cannot be empty';
$string['login_unique'] = 'Username must be unique';
$string['fix_login'] = 'Fix username';
$string['proceedlogincheck'] = 'Proceed to email check';

// ============================================================================
// ACTIONS 19–20: EMAIL VALIDATION
// ============================================================================
$string['email_check'] = 'Email check';
$string['email_available'] = 'Email is available';
$string['email_taken'] = 'Email is already registered';
$string['email_invalid_format'] = 'Invalid email format';
$string['email_domain_not_allowed'] = 'Email domain is not allowed by plugin settings';
$string['email_empty'] = 'Email cannot be empty';
$string['fix_email'] = 'Fix email';
$string['proceedcoursecheck'] = 'Proceed to course check';

// ============================================================================
// ACTIONS 21–24: COURSE VALIDATION
// ============================================================================
$string['step3'] = 'Step 3: Course verification';
$string['step3_desc'] = 'Verify that all specified courses exist in the system. For non-existent courses, select an alternative from the list or create the course manually.';
$string['course_exists'] = 'Course found';
$string['course_not_found'] = 'Course not found';
$string['course_invalid'] = 'Invalid course shortname';
$string['course_empty'] = 'Course not specified';
$string['search_course'] = '🔍 Select course';
$string['search_course_placeholder'] = 'Enter course name or shortname...';
$string['no_courses_found'] = 'No courses found';
$string['select_course'] = 'Select this course';
$string['course_selected'] = 'Course selected: {$a}';
$string['proceedgroupcheck'] = 'Proceed to group check';

// ============================================================================
// ACTIONS 25–29: GROUP VALIDATION AND CREATION
// ============================================================================
$string['step4'] = 'Step 4: Group verification';
$string['step4_desc'] = 'Verify that all specified groups exist in their respective courses. Create missing groups if necessary.';
$string['group_exists'] = 'Group found';
$string['group_not_found'] = 'Group not found';
$string['group_invalid'] = 'Invalid group name';
$string['group_empty'] = 'Group not specified';
$string['group_created'] = 'Group successfully created';
$string['group_already_exists'] = 'A group with this name already exists in this course';
$string['create_group'] = 'Create group';
$string['create_all_groups'] = 'Create all missing groups';
$string['confirm_create_groups'] = 'Create {$a} missing groups? This action cannot be undone.';
$string['creating_groups'] = 'Creating groups...';
$string['groups_created'] = 'Groups created: {$a}';
$string['show_course_groups'] = 'Show course groups';
$string['course_groups_title'] = 'Groups in course: {$a}';
$string['no_groups_in_course'] = 'No groups in this course';
$string['proceedenrol'] = 'Proceed to enrolment';

// ============================================================================
// ACTIONS 30–32: ENROLMENT AND REPORTS
// ============================================================================
$string['step5'] = 'Step 5: Enrolment';
$string['step5_desc'] = 'Review the summary and start the mass enrolment process.';
$string['enrolment_summary'] = 'Enrolment summary';
$string['total_users'] = 'Total users: {$a}';
$string['total_courses'] = 'Total courses: {$a}';
$string['total_groups'] = 'Total groups: {$a}';
$string['new_users_count'] = 'New users to create: {$a}';
$string['existing_users_count'] = 'Existing users to use: {$a}';
$string['start_enrolment'] = 'Start enrolment';
$string['confirm_start_enrolment'] = 'Start enrolment for {$a} users? This process may take several minutes.';

// Enrolment progress
$string['enrolment_in_progress'] = 'Enrolment in progress...';
$string['processing_user'] = 'Processing: {$a->fullname} ({$a->current}/{$a->total})';
$string['creating_user'] = 'Creating user...';
$string['enrolling_user'] = 'Enrolling in course...';
$string['adding_to_group'] = 'Adding to group...';
$string['enrolment_complete'] = 'Enrolment complete';
$string['enrolment_finished'] = 'Processed: {$a->total} records. Success: {$a->success}, Errors: {$a->errors}';

// Results and reports
$string['enrolment_results'] = 'Enrolment results';
$string['result_success'] = '✅ Success';
$string['result_error'] = '❌ Error';
$string['result_warning'] = '⚠️ Warning';
$string['error_details'] = 'Error details';
$string['download_report'] = 'Download report (CSV)';
$string['report_generated'] = 'Report generated';
$string['report_filename'] = 'massenrol_report_{$a}.csv';

// Enrolment error messages
$string['error_user_create'] = 'Failed to create user: {$a}';
$string['error_user_update'] = 'Failed to update user data: {$a}';
$string['error_enrol'] = 'Failed to enrol user in course: {$a}';
$string['error_group_add'] = 'Failed to add user to group: {$a}';
$string['error_course_not_found'] = 'Course not found: {$a}';
$string['error_group_not_found'] = 'Group not found: {$a}';
$string['error_permission'] = 'Insufficient permissions to perform this operation';

// ============================================================================
// NAVIGATION AND COMMON ELEMENTS
// ============================================================================
$string['previous'] = 'Previous';
$string['next'] = 'Next';
$string['cancel'] = 'Cancel';
$string['close'] = 'Close';
$string['search'] = 'Search';
$string['loading'] = 'Loading...';
$string['saving'] = 'Saving...';
$string['saved'] = 'Saved';
$string['error'] = 'Error';
$string['warning'] = 'Warning';
$string['success'] = 'Success';
$string['yes'] = 'Yes';
$string['no'] = 'No';

// ============================================================================
// AJAX ERRORS
// ============================================================================
$string['ajax_error_unknown'] = 'Unknown server error';
$string['ajax_error_permission'] = 'Insufficient permissions to perform this action';
$string['ajax_error_session'] = 'Session expired. Please refresh the page and try again';
$string['ajax_error_network'] = 'Network connection error. Please check your internet connection';
$string['ajax_error_timeout'] = 'Server response timeout';

// ============================================================================
// TOOLTIPS AND HINTS
// ============================================================================
$string['tooltip_copy'] = 'Copy selected cells (Ctrl+C)';
$string['tooltip_paste'] = 'Paste from clipboard (Ctrl+V)';
$string['tooltip_delete_row'] = 'Delete selected row';
$string['tooltip_generate_password'] = 'Generate random password';
$string['tooltip_check_user'] = 'Check if user exists in Moodle';
$string['tooltip_select_course'] = 'Open course search';
$string['tooltip_create_group'] = 'Create new group in course';

// ============================================================================
// CONFIRMATION MESSAGES
// ============================================================================
$string['confirm_delete_row'] = 'Delete this row?';
$string['confirm_overwrite_data'] = 'Overwrite data in selected cells?';
$string['confirm_discard_changes'] = 'You have unsaved changes. Continue without saving?';