<?php
defined('MOODLE_INTERNAL') || die();

$capabilities = array(
    'local/massenrol:manage' => array(
        'captype' => 'write',
        'contextlevel' => CONTEXT_SYSTEM,
        'archetypes' => array(
            'manager' => CAP_ALLOW,
        ),
        'clonepermissionsfrom' => 'moodle/user:update',
    ),
);