// local/massenrol/js/validation.js
(function() {
    // Глобальный объект для общих данных
    window.Massenrol = window.Massenrol || {};

    var config = window.massenrolConfig || {};
    window.Massenrol.config = config;

    console.log('Validation загружен');
    console.log('sesskey:', !!config.sesskey);

    // ========================================================================
    // Общие переменные
    // ========================================================================
    window.Massenrol.spreadsheet = null;
    window.Massenrol.autoSaveTimer = null;
    window.Massenrol.lastSaveTime = null;
    window.Massenrol.ignoreMiddlename = [];
    window.Massenrol.ignoreNameSymbols = false;
    window.Massenrol.ignoreMiddlenameSymbols = false;

    // Индекс колонки статуса (9, т.к. в jSpreadsheet есть служебная колонка)
    window.Massenrol.STATUS_CELL_INDEX = 9;

    // Хранилище результатов проверки курсов (новая структура)
    window.Massenrol.courseCheckResults = {};

    // Хранилище результатов проверки групп (новая структура)
    window.Massenrol.groupCheckResults = {};

    // Хранилище результатов проверки пользователей (заполняется из massenrol.js)
    window.Massenrol.userCheckResults = {};

    // ========================================================================
    // Вспомогательные функции
    // ========================================================================

    window.Massenrol.transliterate = function(text) {
        var map = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
            'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
            'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
            'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
            'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
        };
        return text.toLowerCase().split('').map(function(c) {
            return map[c] || c;
        }).join('');
    };

    window.Massenrol.generateUsername = function(rowIndex) {
        var data = window.Massenrol.spreadsheet.getData();
        var row = data[rowIndex] || [];
        var lastname = row[0] ? row[0].trim() : '';
        var firstname = row[1] ? row[1].trim() : '';
        var middlename = row[2] ? row[2].trim() : '';

        if (!lastname && !firstname) return '';

        var format = config.config.usernameformat || 'firstname.lastname';
        var username = '';
        var translitLast = window.Massenrol.transliterate(lastname);
        var translitFirst = window.Massenrol.transliterate(firstname);
        var translitMid = window.Massenrol.transliterate(middlename);

        switch (format) {
            case 'firstname.lastname':
                username = translitFirst + '.' + translitLast;
                break;
            case 'lastname.firstname':
                username = translitLast + '.' + translitFirst;
                break;
            case 'firstname_lastname':
                username = translitFirst + '_' + translitLast;
                break;
            case 'lastname_firstname':
                username = translitLast + '_' + translitFirst;
                break;
            case 'firstletter_lastname':
                username = (translitFirst.charAt(0) || '') + translitLast;
                break;
            default:
                username = translitFirst + '.' + translitLast;
        }
        username = username.replace(/[^a-z0-9._-]/g, '');
        username = username.substring(0, 30);
        return username;
    };

    window.Massenrol.isRowEmpty = function(row) {
        for (var i = 0; i < 8; i++) {
            if (row[i] && row[i].toString().trim() !== '') return false;
        }
        return true;
    };

    window.Massenrol.removeEmptyRows = function() {
        console.log('Удаление пустых строк...');
        var data = window.Massenrol.spreadsheet.getData();
        var hasData = false;

        for (var i = data.length - 1; i >= 0; i--) {
            if (!window.Massenrol.isRowEmpty(data[i])) {
                hasData = true;
            } else {
                window.Massenrol.spreadsheet.deleteRow(i);
            }
        }

        if (!hasData) {
            alert(config.strings.nousers || 'Нет пользователей для зачисления');
            var emptyRows = [];
            for (var i = 0; i < 10; i++) {
                emptyRows.push(['', '', '', '', '', '', '', '', '']);
            }
            window.Massenrol.spreadsheet.setData(emptyRows);
            return false;
        }
        return true;
    };

    window.Massenrol.updateHint = function(message) {
        var hint = document.getElementById('info-hint');
        if (hint) hint.innerHTML = message;
    };

    window.Massenrol.updateInfoPanel = function() {
        var rowsEl = document.getElementById('info-rows');
        if (rowsEl && window.Massenrol.spreadsheet) {
            var data = window.Massenrol.spreadsheet.getData();
            var filledRows = 0;
            for (var j = 0; j < data.length; j++) {
                var hasData = false;
                for (var k = 0; k < 8; k++) {
                    if (data[j][k] && data[j][k].toString().trim() !== '') {
                        hasData = true;
                        break;
                    }
                }
                if (hasData) filledRows++;
            }
            rowsEl.textContent = filledRows;
        }

        var autosaveEl = document.getElementById('info-autosave');
        if (autosaveEl) {
            if (window.Massenrol.lastSaveTime) {
                var now = Date.now();
                var diffSeconds = (now - window.Massenrol.lastSaveTime) / 1000;
                var timeStr = new Date(window.Massenrol.lastSaveTime).toLocaleTimeString();

                if (diffSeconds <= 35) {
                    autosaveEl.innerHTML = '✅ Сохранено: ' + timeStr;
                    autosaveEl.style.color = 'green';
                } else {
                    autosaveEl.innerHTML = '⚠️ Последнее сохранение: ' + timeStr + ' (давно)';
                    autosaveEl.style.color = 'orange';
                }
            } else {
                autosaveEl.innerHTML = '⏳ Черновик не сохранялся';
                autosaveEl.style.color = '#6c757d';
            }
        }
    };

    // ========================================================================
    // Автосохранение
    // ========================================================================
    window.Massenrol.saveDraft = function() {
        console.log('Автосохранение...');
        if (!window.Massenrol.spreadsheet) return;

        var step1 = document.getElementById('step1-container');
        if (!step1 || step1.style.display === 'none') return;

        var data = [];
        for (var i = 0; i < window.Massenrol.spreadsheet.getData().length; i++) {
            var row = [];
            for (var j = 0; j < 8; j++) {
                row.push(window.Massenrol.spreadsheet.getData()[i][j] || '');
            }
            data.push(row);
        }

        var url = 'save_step.php?action=save_draft&sesskey=' + encodeURIComponent(config.sesskey);
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'same-origin'
        })
        .then(function(response) {
            return response.text();
        })
        .then(function(text) {
            console.log('Ответ сервера:', text.substring(0, 100));
            try {
                var result = JSON.parse(text);
                console.log('Сохранение:', result);
                if (result.success) {
                    window.Massenrol.lastSaveTime = Date.now();
                    window.Massenrol.updateInfoPanel();
                } else {
                    console.error('Ошибка сохранения:', result.error);
                }
            } catch(e) {
                console.error('❌ Некорректный JSON:', text.substring(0, 200));
            }
        })
        .catch(function(error) {
            console.error('Ошибка сохранения:', error);
        });
    };

    window.Massenrol.initAutoSave = function() {
        if (!config.sesskey) return;

        setTimeout(window.Massenrol.saveDraft, 3000);
        window.Massenrol.autoSaveTimer = setInterval(window.Massenrol.saveDraft, 30000);

        window.addEventListener('beforeunload', function() {
            if (window.Massenrol.spreadsheet) {
                var spreadsheetData = window.Massenrol.spreadsheet.getData();
                var data = [];
                for (var i = 0; i < spreadsheetData.length; i++) {
                    var row = [];
                    for (var j = 0; j < 8; j++) {
                        row.push(spreadsheetData[i][j] || '');
                    }
                    data.push(row);
                }
                var url = 'save_step.php?action=save_draft&sesskey=' + encodeURIComponent(config.sesskey);
                var blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
                navigator.sendBeacon(url, blob);
            }
        });
    };

    // ========================================================================
    // Инициализация таблицы Jspreadsheet
    // ========================================================================
    var columns = [
        { title: config.strings.lastname || 'Фамилия', type: 'text', width: 120 },
        { title: config.strings.firstname || 'Имя', type: 'text', width: 120 },
        { title: config.strings.middlename || 'Отчество', type: 'text', width: 120 },
        { title: config.strings.username || 'Логин', type: 'text', width: 120 },
        { title: config.strings.email || 'Email', type: 'text', width: 180 },
        { title: config.strings.password || 'Пароль', type: 'text', width: 150 },
        { title: config.strings.courseshortname || 'Курс', type: 'text', width: 150 },
        { title: config.strings.groupname || 'Группа', type: 'text', width: 150 },
        {
            title: config.strings.status || 'Статус',
            width: 350,
            readOnly: true
        }
    ];

    var initialData = [];
    if (config.savedData && config.savedData.data && Array.isArray(config.savedData.data)) {
        config.savedData.data.forEach(function(row) {
            initialData.push([
                row[0] || '', row[1] || '', row[2] || '', row[3] || '',
                row[4] || '', row[5] || '', row[6] || '', row[7] || '', ''
            ]);
        });
    } else {
        for (var i = 0; i < 10; i++) {
            initialData.push(['', '', '', '', '', '', '', '', '']);
        }
    }

    window.Massenrol.spreadsheet = jspreadsheet(document.getElementById('spreadsheet'), {
        data: initialData,
        columns: columns,
        tableHeight: '400px',
        tableWidth: '100%',
        columnDrag: false,
        rowDrag: false,
        editable: true,
        allowInsertColumn: false,
        allowDeleteColumn: false,
        allowRenameColumn: false,
        allowInsertRow: true,
        allowDeleteRow: true,
        contextMenu: function() {
            return [
                {
                    title: "✏️ Для изменения данных в ячейке дважды щёлкните по ячейке."
                }
            ];
        },
        text: {
            insertRow: config.strings.insertrow,
            deleteRow: config.strings.deleterow
        },
        oninsertrow: function(instance, rowElement, rowIndex) {
            this.setValue(rowIndex, 5, '');
            this.setValue(rowIndex, 8, '');
            window.Massenrol.updateInfoPanel();
        },
        onchange: function() {
            window.Massenrol.updateInfoPanel();
        },
        onload: function() {
            console.log('Таблица загружена');
            window.Massenrol.updateInfoPanel();
            window.Massenrol.initAutoSave();
        }
    });

    // ========================================================================
    // Проверка на дубликаты внутри таблицы с подсветкой строк
    // ========================================================================
    window.Massenrol.checkDuplicatesInTable = function() {
        var data = window.Massenrol.spreadsheet.getData();
        var duplicates = {
            fio: {},      // ФИО -> массив индексов строк
            login: {},    // логин -> массив индексов
            email: {}     // email -> массив индексов
        };

        // Сбрасываем подсветку всех строк
        for (var i = 0; i < data.length; i++) {
            var tr = window.Massenrol.spreadsheet.rows[i];
            if (tr) {
                tr.style.backgroundColor = ''; // убираем выделение
            }
        }

        // Собираем данные
        for (var i = 0; i < data.length; i++) {
            if (window.Massenrol.isRowEmpty(data[i])) continue;

            var lastname = data[i][0] ? data[i][0].toString().trim() : '';
            var firstname = data[i][1] ? data[i][1].toString().trim() : '';
            var middlename = data[i][2] ? data[i][2].toString().trim() : '';
            var login = data[i][3] ? data[i][3].toString().trim() : '';
            var email = data[i][4] ? data[i][4].toString().trim() : '';

            // ФИО
            var fio = (lastname + ' ' + firstname + ' ' + middlename).replace(/\s+/g, ' ').trim();
            if (fio) {
                if (!duplicates.fio[fio]) duplicates.fio[fio] = [];
                duplicates.fio[fio].push(i);
            }

            if (login) {
                if (!duplicates.login[login]) duplicates.login[login] = [];
                duplicates.login[login].push(i);
            }

            if (email) {
                if (!duplicates.email[email]) duplicates.email[email] = [];
                duplicates.email[email].push(i);
            }
        }

        // Фильтруем только дубликаты (больше одного)
        var duplicateRows = new Set(); // множество индексов строк с дубликатами
        var messages = [];

        for (var f in duplicates.fio) {
            if (duplicates.fio[f].length > 1) {
                duplicates.fio[f].forEach(function(idx) { duplicateRows.add(idx); });
                messages.push('Одинаковые ФИО: «' + f + '» (строки ' + duplicates.fio[f].map(i => i+1).join(', ') + ')');
            }
        }
        for (var l in duplicates.login) {
            if (duplicates.login[l].length > 1) {
                duplicates.login[l].forEach(function(idx) { duplicateRows.add(idx); });
                messages.push('Одинаковые логины: «' + l + '» (строки ' + duplicates.login[l].map(i => i+1).join(', ') + ')');
            }
        }
        for (var e in duplicates.email) {
            if (duplicates.email[e].length > 1) {
                duplicates.email[e].forEach(function(idx) { duplicateRows.add(idx); });
                messages.push('Одинаковые email: «' + e + '» (строки ' + duplicates.email[e].map(i => i+1).join(', ') + ')');
            }
        }

        if (duplicateRows.size > 0) {
            // Подсвечиваем проблемные строки жёлтым
            duplicateRows.forEach(function(idx) {
                var tr = window.Massenrol.spreadsheet.rows[idx];
                if (tr) {
                    tr.style.backgroundColor = '#fff3cd'; // светло-жёлтый
                }
            });

            // Формируем понятное сообщение
            var hintMessage = '⚠️ Обнаружены дубликаты:<br>' + messages.join('<br>') +
                '<br><strong>Исправьте или удалите выделенные строки и нажмите «Проверить данные» снова.</strong>';
            window.Massenrol.updateHint(hintMessage);

            // Очищаем область с кнопками валидации, чтобы не мешала
            document.getElementById('validation-buttons').innerHTML = '';

            return false;
        }

        // Если дубликатов нет, возвращаем стандартную подсказку (она позже обновится)
        return true;
    };

    // ========================================================================
    // Этап 1: Проверка фамилии и имени (пустые поля + допустимые символы)
    // ========================================================================
    window.Massenrol.validateNamesOnly = function(row) {
        var errors = [];
        var lastname = row[0] ? row[0].trim() : '';
        var firstname = row[1] ? row[1].trim() : '';

        if (!lastname) errors.push('Фамилия не заполнена');
        if (!firstname) errors.push('Имя не заполнено');

        if (!window.Massenrol.ignoreNameSymbols) {
            var nameRegex = /^[а-яё\s-]+$/i;
            if (lastname && !nameRegex.test(lastname)) errors.push('Недопустимые символы в Фамилии');
            if (firstname && !nameRegex.test(firstname)) errors.push('Недопустимые символы в Имени');
        }

        return { valid: errors.length === 0, errors: errors };
    };

    window.Massenrol.updateNameStatus = function(rowIndex) {
        if (!window.Massenrol.spreadsheet || !window.Massenrol.spreadsheet.rows || rowIndex >= window.Massenrol.spreadsheet.rows.length) return;

        var data = window.Massenrol.spreadsheet.getData();
        if (!data[rowIndex]) return;

        var row = data[rowIndex];
        var result = window.Massenrol.validateNamesOnly(row);
        var tr = window.Massenrol.spreadsheet.rows[rowIndex];
        if (!tr) return;

        for (var i = 0; i < tr.cells.length; i++) {
            tr.cells[i].style.backgroundColor = result.valid ? '' : '#fff0f0';
        }

        if (tr.cells[window.Massenrol.STATUS_CELL_INDEX]) {
            var content = [];
            if (!result.valid) {
                for (var j = 0; j < result.errors.length; j++) {
                    content.push('<div style="color:red;font-size:0.9em;">⚠️ ' + result.errors[j] + '</div>');
                }
                tr.cells[window.Massenrol.STATUS_CELL_INDEX].innerHTML = content.join('');
            } else {
                tr.cells[window.Massenrol.STATUS_CELL_INDEX].innerHTML = '';
            }
        }
    };

    window.Massenrol.validateAllNames = function() {
        console.log('Проверка имён...');
        var data = window.Massenrol.spreadsheet.getData();
        var hasErrors = false;

        for (var i = 0; i < data.length; i++) {
            var result = window.Massenrol.validateNamesOnly(data[i]);
            window.Massenrol.updateNameStatus(i);
            if (!result.valid) hasErrors = true;
        }
        return !hasErrors;
    };

    window.Massenrol.collectNameErrors = function() {
        var data = window.Massenrol.spreadsheet.getData();
        var errorRows = {};

        for (var i = 0; i < data.length; i++) {
            var lastname = data[i][0] ? data[i][0].toString().trim() : '';
            var firstname = data[i][1] ? data[i][1].toString().trim() : '';

            if (lastname !== '' || firstname !== '') {
                var result = window.Massenrol.validateNamesOnly(data[i]);
                if (!result.valid) {
                    result.errors.forEach(function(err) {
                        if (!errorRows[err]) errorRows[err] = [];
                        if (errorRows[err].indexOf(i + 1) === -1) {
                            errorRows[err].push(i + 1);
                        }
                    });
                }
            }
        }
        return errorRows;
    };

    window.Massenrol.hasSymbolErrors = function(errorRows) {
        for (var err in errorRows) {
            if (err.indexOf('Недопустимые символы') !== -1) {
                return true;
            }
        }
        return false;
    };

    // ========================================================================
    // Этап 2: Проверка отчества (только предупреждения)
    // ========================================================================
    window.Massenrol.validateMiddlename = function(row, rowIndex) {
        var warnings = [];
        var middlename = row[2] ? row[2].trim() : '';

        if (window.Massenrol.ignoreMiddlename[rowIndex]) {
            return { hasWarnings: false, warnings: [] };
        }

        if (!window.Massenrol.ignoreMiddlenameSymbols) {
            var nameRegex = /^[а-яё\s-]+$/i;
            if (middlename && !nameRegex.test(middlename)) {
                warnings.push('Недопустимые символы в Отчестве');
            }
        }

        if (!middlename) {
            warnings.push('Отчество не указано (можно пропустить)');
        }

        return { hasWarnings: warnings.length > 0, warnings: warnings };
    };

    window.Massenrol.updateMiddlenameStatus = function(rowIndex) {
        if (!window.Massenrol.spreadsheet || !window.Massenrol.spreadsheet.rows || rowIndex >= window.Massenrol.spreadsheet.rows.length) return;

        var data = window.Massenrol.spreadsheet.getData();
        if (!data[rowIndex]) return;

        var row = data[rowIndex];
        var result = window.Massenrol.validateMiddlename(row, rowIndex);
        var tr = window.Massenrol.spreadsheet.rows[rowIndex];
        if (!tr) return;

        var statusCell = tr.cells[window.Massenrol.STATUS_CELL_INDEX];
        if (!statusCell) return;

        statusCell.innerHTML = '';

        var nameResult = window.Massenrol.validateNamesOnly(row);
        if (!nameResult.valid) {
            for (var j = 0; j < nameResult.errors.length; j++) {
                statusCell.innerHTML += '<div style="color:red;font-size:0.9em;">⚠️ ' + nameResult.errors[j] + '</div>';
            }
        }

        if (result.hasWarnings) {
            var warningHTML = '<div style="color:orange;font-size:0.9em;">⚠️ ' + result.warnings.join('<br>') + '</div>';
            statusCell.innerHTML += warningHTML;
        }
    };

    window.Massenrol.validateAllMiddlenames = function() {
        console.log('Проверка отчеств...');
        var data = window.Massenrol.spreadsheet.getData();
        var hasWarnings = false;

        for (var i = 0; i < data.length; i++) {
            var result = window.Massenrol.validateMiddlename(data[i], i);
            if (result.hasWarnings) {
                hasWarnings = true;
            }
            window.Massenrol.updateMiddlenameStatus(i);
        }
        return !hasWarnings;
    };

    window.Massenrol.collectMiddlenameWarnings = function() {
        var data = window.Massenrol.spreadsheet.getData();
        var warningRows = {};

        for (var i = 0; i < data.length; i++) {
            var lastname = data[i][0] ? data[i][0].toString().trim() : '';
            var firstname = data[i][1] ? data[i][1].toString().trim() : '';

            if (lastname !== '' || firstname !== '') {
                var result = window.Massenrol.validateMiddlename(data[i], i);
                if (result.hasWarnings) {
                    result.warnings.forEach(function(warn) {
                        if (!warningRows[warn]) warningRows[warn] = [];
                        if (warningRows[warn].indexOf(i + 1) === -1) {
                            warningRows[warn].push(i + 1);
                        }
                    });
                }
            }
        }
        return warningRows;
    };

    window.Massenrol.hasMiddlenameSymbolErrors = function(warningRows) {
        for (var w in warningRows) {
            if (w.indexOf('Недопустимые символы') !== -1) {
                return true;
            }
        }
        return false;
    };

    // ========================================================================
    // ✅ ЭТАП 7: ПРОВЕРКА КУРСОВ (с поддержкой множественных курсов)
    // ========================================================================
    var courseCheckResults = {};       // внутреннее хранилище
    var pendingRequestsCourses = 0;
    var courseErrors = {};             // для сбора ошибок по строкам (объект: сообщение -> массив номеров строк)

    function runCoursesCheck() {
        console.log('🔍 Проверка курсов (множественные)...');
        var buttonsDiv = document.getElementById('validation-buttons');
        buttonsDiv.innerHTML = '<button type="button" class="btn btn-info btn-lg" disabled>⏳ Проверка курсов...</button>';
        window.Massenrol.updateHint('⏳ Проверка курсов... (используйте короткие имена через ";")');

        var data = window.Massenrol.spreadsheet.getData();

        // Очищаем статусные ячейки
        for (var i = 0; i < data.length; i++) {
            var tr = window.Massenrol.spreadsheet.rows[i];
            if (tr) {
                var statusCell = tr.cells[window.Massenrol.STATUS_CELL_INDEX];
                if (statusCell) statusCell.innerHTML = '';
            }
        }

        courseCheckResults = {};
        window.Massenrol.courseCheckResults = {};
        courseErrors = {};
        pendingRequestsCourses = 0;

        for (var i = 0; i < data.length; i++) {
            var coursesStr = data[i][6] ? data[i][6].toString().trim() : '';
            if (!coursesStr) {
                if (!window.Massenrol.isRowEmpty(data[i])) {
                    markCourseError(i, 'Курс не указан');
                }
                continue;
            }

            var courseList = coursesStr.split(';').map(s => s.trim()).filter(s => s !== '');
            if (courseList.length === 0) {
                markCourseError(i, 'Курс не указан');
                continue;
            }

            courseCheckResults[i] = {
                results: [],
                map: {},
                summary: { total: courseList.length, found: 0, errors: [] }
            };

            courseList.forEach(function(shortname, idx) {
                checkCourseSingle(i, shortname, idx);
            });
        }

        if (pendingRequestsCourses === 0) onAllCoursesChecked();
    }

    function markCourseError(rowIndex, message) {
        var tr = window.Massenrol.spreadsheet.rows[rowIndex];
        if (tr) {
            tr.style.backgroundColor = '#f8d7da';
            var statusCell = tr.cells[window.Massenrol.STATUS_CELL_INDEX];
            if (statusCell) {
                statusCell.innerHTML += '<div style="color:red;">❌ ' + message + '</div>';
            }
        }
        if (!courseErrors[message]) courseErrors[message] = [];
        if (courseErrors[message].indexOf(rowIndex + 1) === -1) {
            courseErrors[message].push(rowIndex + 1);
        }
    }

    function checkCourseSingle(rowIndex, shortname, courseIdx) {
        pendingRequestsCourses++;
        var url = 'ajax.php?action=check_course&sesskey=' + encodeURIComponent(config.sesskey);
        var formData = new URLSearchParams();
        formData.append('shortname', shortname);

        fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: formData,
            credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(data => {
            if (!courseCheckResults[rowIndex]) {
                courseCheckResults[rowIndex] = { results: [], map: {}, summary: { total: 0, found: 0, errors: [] } };
            }
            var resultObj = {
                shortname: shortname,
                exists: data.exists,
                courseid: data.exists ? data.courseid : null,
                fullname: data.exists ? data.fullname : null,
                message: data.message || ''
            };
            courseCheckResults[rowIndex].results[courseIdx] = resultObj;

            if (data.exists) {
                courseCheckResults[rowIndex].summary.found++;
                courseCheckResults[rowIndex].map[shortname] = data.courseid;
            } else {
                var errMsg = 'Курс "' + shortname + '" не найден';
                courseCheckResults[rowIndex].summary.errors.push(errMsg);
                if (!courseErrors[errMsg]) courseErrors[errMsg] = [];
                if (courseErrors[errMsg].indexOf(rowIndex + 1) === -1) {
                    courseErrors[errMsg].push(rowIndex + 1);
                }
            }

            var totalForRow = courseCheckResults[rowIndex].summary.total;
            if (courseCheckResults[rowIndex].results.length === totalForRow) {
                updateRowAfterCourseCheck(rowIndex, courseCheckResults[rowIndex]);
            }
        })
        .catch(error => {
            console.error('Ошибка при проверке курса (строка ' + (rowIndex+1) + '):', error);
            if (!courseCheckResults[rowIndex]) {
                courseCheckResults[rowIndex] = { results: [], map: {}, summary: { total: 0, found: 0, errors: [] } };
            }
            var errMsg = 'Ошибка соединения для курса "' + shortname + '"';
            courseCheckResults[rowIndex].summary.errors.push(errMsg);
            if (!courseErrors[errMsg]) courseErrors[errMsg] = [];
            if (courseErrors[errMsg].indexOf(rowIndex + 1) === -1) {
                courseErrors[errMsg].push(rowIndex + 1);
            }
            courseCheckResults[rowIndex].results[courseIdx] = {
                shortname: shortname,
                exists: false,
                courseid: null,
                fullname: null,
                message: error.message
            };

            var totalForRow = courseCheckResults[rowIndex].summary.total;
            if (courseCheckResults[rowIndex].results.length === totalForRow) {
                updateRowAfterCourseCheck(rowIndex, courseCheckResults[rowIndex]);
            }
        })
        .finally(() => {
            pendingRequestsCourses--;
            if (pendingRequestsCourses === 0) onAllCoursesChecked();
        });
    }

    function updateRowAfterCourseCheck(rowIndex, rowData) {
        if (!window.Massenrol.spreadsheet || !window.Massenrol.spreadsheet.rows || rowIndex >= window.Massenrol.spreadsheet.rows.length) return;

        var tr = window.Massenrol.spreadsheet.rows[rowIndex];
        if (!tr) return;

        var statusCell = tr.cells[window.Massenrol.STATUS_CELL_INDEX];
        if (!statusCell) return;

        statusCell.innerHTML = '';

        var summary = rowData.summary;
        if (summary.errors.length === 0) {
            tr.style.backgroundColor = '#d4edda';
            statusCell.innerHTML = '<div style="color:green;">✅ Все курсы найдены (' + summary.total + ')</div>';
        } else {
            tr.style.backgroundColor = '#f8d7da';
            statusCell.innerHTML = '<div style="color:red;">❌ Найдено ошибок: ' + summary.errors.length + ' из ' + summary.total + '</div>';
        }

        window.Massenrol.courseCheckResults[rowIndex] = rowData;
    }

    function onAllCoursesChecked() {
        console.log('✅ Курсы проверены');
        var totalRows = window.Massenrol.spreadsheet.getData().length;
        var errorCount = 0;

        var uniqueErrorRows = {};
        for (var errMsg in courseErrors) {
            courseErrors[errMsg].forEach(function(row) {
                uniqueErrorRows[row] = true;
            });
        }
        errorCount = Object.keys(uniqueErrorRows).length;

        var buttonsDiv = document.getElementById('validation-buttons');

        if (errorCount > 0) {
            var warningList = [];
            for (var errType in courseErrors) {
                var rowsStr = courseErrors[errType].join(', ');
                warningList.push(errType + ' (строки: ' + rowsStr + ')');
            }

            var hintMessage = '⚠️ Обнаружены ошибки в курсах:<br>' + warningList.join('<br>') +
                '<br><strong>Курс должен быть указан коротким именем и существовать в системе. Можно указывать несколько курсов через точку с запятой.</strong><br>' +
                'Исправьте вручную или нажмите «Проверить исправленные курсы». Также вы можете просмотреть список всех курсов.';

            buttonsDiv.innerHTML = '<button type="button" id="retry-courses-btn" class="btn btn-warning btn-lg mr-2">Проверить исправленные курсы</button>' +
                                   '<button type="button" id="show-all-courses-main-btn" class="btn btn-info btn-lg">Показать все курсы</button>';
            document.getElementById('retry-courses-btn').onclick = function() {
                runCoursesCheck();
            };
            window.Massenrol.updateHint(hintMessage);
        } else {
            window.Massenrol.massAssignMode = 'groups_only';
            var massAssignBtn = document.getElementById('mass-assign-btn');
            if (massAssignBtn) {
                massAssignBtn.innerHTML = '<i class="icon fa fa-copy"></i> Изменить группы для выделенных строк';
            }

            window.Massenrol.updateHint('✅ Все курсы найдены. Автоматически переходим к проверке групп...');
            if (window.Massenrol.runGroupsCheck) {
                setTimeout(function() {
                    window.Massenrol.runGroupsCheck();
                }, 500);
            } else {
                buttonsDiv.innerHTML = '<button type="button" id="go-to-groups-btn" class="btn btn-success btn-lg">Перейти к проверке групп</button>';
                document.getElementById('go-to-groups-btn').onclick = function() {
                    alert('Проверка групп будет реализована позже');
                };
            }
        }
    }

    // ========================================================================
    // ✅ ЭТАП 8: ПРОВЕРКА ГРУПП (с поддержкой множественных групп)
    // ========================================================================
    var groupCheckResults = {};
    var pendingRequestsGroups = 0;
    var groupErrors = {};

    function runGroupsCheck() {
        console.log('🔍 Проверка групп (множественные)...');
        var buttonsDiv = document.getElementById('validation-buttons');
        buttonsDiv.innerHTML = '<button type="button" class="btn btn-info btn-lg" disabled>⏳ Проверка групп...</button>';
        window.Massenrol.updateHint('⏳ Проверка групп...');

        var data = window.Massenrol.spreadsheet.getData();

        for (var i = 0; i < data.length; i++) {
            var tr = window.Massenrol.spreadsheet.rows[i];
            if (tr) {
                var statusCell = tr.cells[window.Massenrol.STATUS_CELL_INDEX];
                if (statusCell) statusCell.innerHTML = '';
            }
        }

        groupCheckResults = {};
        window.Massenrol.groupCheckResults = {};
        groupErrors = {};
        pendingRequestsGroups = 0;

        for (var i = 0; i < data.length; i++) {
            var groupsStr = data[i][7] ? data[i][7].toString().trim() : '';
            var coursesStr = data[i][6] ? data[i][6].toString().trim() : '';

            var courseList = coursesStr ? coursesStr.split(';').map(s => s.trim()).filter(s => s !== '') : [];
            var groupList = groupsStr ? groupsStr.split(';').map(s => s.trim()).filter(s => s !== '') : [];

            if (courseList.length === 0) {
                continue;
            }

            groupCheckResults[i] = {
                results: [],
                summary: { total: courseList.length, found: 0, errors: [] }
            };

            courseList.forEach(function(shortname, idx) {
                var groupname = (idx < groupList.length) ? groupList[idx] : '';

                var courseRow = window.Massenrol.courseCheckResults[i];
                var courseid = null;
                if (courseRow && courseRow.map) {
                    courseid = courseRow.map[shortname] || null;
                }

                if (!courseid) {
                    var errMsg = 'Курс "' + shortname + '" не определён';
                    groupCheckResults[i].summary.errors.push(errMsg);
                    if (!groupErrors[errMsg]) groupErrors[errMsg] = [];
                    if (groupErrors[errMsg].indexOf(i + 1) === -1) groupErrors[errMsg].push(i + 1);
                    return;
                }

                if (!groupname) {
                    groupCheckResults[i].summary.found++;
                    groupCheckResults[i].results[idx] = { exists: true, message: 'Группа не указана' };
                    return;
                }

                checkGroupSingle(i, idx, courseid, groupname);
            });
        }

        if (pendingRequestsGroups === 0) onAllGroupsChecked();
    }

    function checkGroupSingle(rowIndex, groupIdx, courseid, groupname) {
        pendingRequestsGroups++;
        var url = 'ajax.php?action=check_group&sesskey=' + encodeURIComponent(config.sesskey);
        var formData = new URLSearchParams();
        formData.append('courseid', courseid);
        formData.append('groupname', groupname);

        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData,
            credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(data => {
            if (!groupCheckResults[rowIndex]) {
                groupCheckResults[rowIndex] = { results: [], summary: { total: 0, found: 0, errors: [] } };
            }
            groupCheckResults[rowIndex].results[groupIdx] = data;
            if (data.exists) {
                groupCheckResults[rowIndex].summary.found++;
            } else {
                var errMsg = 'Группа "' + groupname + '" не найдена';
                groupCheckResults[rowIndex].summary.errors.push(errMsg);
                if (!groupErrors[errMsg]) groupErrors[errMsg] = [];
                if (groupErrors[errMsg].indexOf(rowIndex + 1) === -1) groupErrors[errMsg].push(rowIndex + 1);
            }
            updateRowAfterGroupCheck(rowIndex, groupCheckResults[rowIndex]);
        })
        .catch(error => {
            console.error('Ошибка при проверке группы (строка ' + (rowIndex + 1) + '):', error);
            if (!groupCheckResults[rowIndex]) {
                groupCheckResults[rowIndex] = { results: [], summary: { total: 0, found: 0, errors: [] } };
            }
            var errMsg = 'Ошибка соединения для группы "' + groupname + '"';
            groupCheckResults[rowIndex].summary.errors.push(errMsg);
            if (!groupErrors[errMsg]) groupErrors[errMsg] = [];
            if (groupErrors[errMsg].indexOf(rowIndex + 1) === -1) groupErrors[errMsg].push(rowIndex + 1);
            groupCheckResults[rowIndex].results[groupIdx] = { exists: false, error: error.message };
            updateRowAfterGroupCheck(rowIndex, groupCheckResults[rowIndex]);
        })
        .finally(() => {
            pendingRequestsGroups--;
            if (pendingRequestsGroups === 0) onAllGroupsChecked();
        });
    }

    function updateRowAfterGroupCheck(rowIndex, rowData) {
        if (!window.Massenrol.spreadsheet || !window.Massenrol.spreadsheet.rows || rowIndex >= window.Massenrol.spreadsheet.rows.length) return;
        var tr = window.Massenrol.spreadsheet.rows[rowIndex];
        if (!tr) return;
        var statusCell = tr.cells[window.Massenrol.STATUS_CELL_INDEX];
        if (!statusCell) return;

        var summary = rowData.summary;
        var groupInfo = '';
        if (summary.errors.length === 0) {
            tr.style.backgroundColor = '#d4edda';
            groupInfo = '<div style="color:green;">✅ Группы: все проверены</div>';
        } else {
            tr.style.backgroundColor = '#f8d7da';
            groupInfo = '<div style="color:red;">❌ Группы: ошибок ' + summary.errors.length + '</div>';
        }

        statusCell.innerHTML += groupInfo;
        window.Massenrol.groupCheckResults[rowIndex] = rowData;
    }

    function onAllGroupsChecked() {
        console.log('✅ Группы проверены');
        var totalRows = window.Massenrol.spreadsheet.getData().length;

        var uniqueErrorRows = {};
        for (var errMsg in groupErrors) {
            groupErrors[errMsg].forEach(function(row) {
                uniqueErrorRows[row] = true;
            });
        }
        var errorCount = Object.keys(uniqueErrorRows).length;

        var buttonsDiv = document.getElementById('validation-buttons');
        var massAssignContainer = document.getElementById('mass-assign-container');

        if (errorCount > 0) {
            var warningList = [];
            for (var errType in groupErrors) {
                var rowsStr = groupErrors[errType].join(', ');
                warningList.push(errType + ' (строки: ' + rowsStr + ')');
            }

            var hintMessage = '⚠️ Обнаружены ошибки в группах:<br>' + warningList.join('<br>') +
                '<br><strong>Группа должна существовать в указанном курсе. Можно указывать несколько групп через точку с запятой (соответствуют порядку курсов).</strong><br>' +
                'Исправьте вручную или создайте недостающие группы с помощью кнопок ниже.';

            var firstErrorRow = -1;
            for (var i = 0; i < totalRows; i++) {
                if (groupCheckResults[i] && groupCheckResults[i].summary.errors.length > 0) {
                    firstErrorRow = i;
                    break;
                }
            }

            var courseShortname = 'неизвестный курс';
            if (firstErrorRow !== -1) {
                var data = window.Massenrol.spreadsheet.getData();
                courseShortname = data[firstErrorRow][6] ? data[firstErrorRow][6].toString().trim() : 'неизвестный курс';
            }

            buttonsDiv.innerHTML = '<div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">' +
                '<button type="button" id="retry-groups-btn" class="btn btn-warning btn-lg">Проверить исправленные группы</button>' +
                '<input type="text" id="new-group-name" class="form-control form-control-lg" style="width: 250px;" placeholder="Название группы">' +
                '<button type="button" id="create-single-group-btn" class="btn btn-primary btn-lg">Создать группу для курса: ' + courseShortname + '</button>' +
                '<button type="button" id="create-all-groups-btn" class="btn btn-info btn-lg">Создать недостающие группы</button>' +
                '</div>';

            document.getElementById('retry-groups-btn').onclick = function() {
                runGroupsCheck();
            };

            document.getElementById('create-all-groups-btn').onclick = function() {
                createAllMissingGroups();
            };

            document.getElementById('create-single-group-btn').onclick = function() {
                var groupname = document.getElementById('new-group-name').value.trim();
                if (!groupname) {
                    alert('Введите название группы');
                    return;
                }
                if (firstErrorRow === -1) {
                    alert('Нет строк с ошибками для создания группы');
                    return;
                }
                var courseRow = window.Massenrol.courseCheckResults[firstErrorRow];
                if (!courseRow || !courseRow.map) {
                    alert('Для выбранной строки не найдены данные о курсах. Убедитесь, что курсы проверены.');
                    return;
                }
                var firstCourseShortname = Object.keys(courseRow.map)[0];
                var courseid = courseRow.map[firstCourseShortname];
                if (!courseid) {
                    alert('Не удалось определить ID курса.');
                    return;
                }
                createSingleGroup(firstErrorRow, courseid, groupname);
            };

            window.Massenrol.updateHint(hintMessage);
        } else {
            if (massAssignContainer) {
                massAssignContainer.style.display = 'none';
            }

            buttonsDiv.innerHTML = '<button type="button" id="go-to-enrolment-btn" class="btn btn-success btn-lg">Перейти к зачислению</button>';
            document.getElementById('go-to-enrolment-btn').onclick = function() {
                if (window.Massenrol.runEnrolment) {
                    window.Massenrol.runEnrolment();
                } else {
                    alert('Функция зачисления не загружена');
                }
            };
            window.Massenrol.updateHint('✅ Все курсы и группы проверены. Нажмите кнопку для зачисления.');
        }
    }

    function createSingleGroup(rowIndex, courseid, groupname) {
        console.log('Создание группы', rowIndex, courseid, groupname);
        var url = 'ajax.php?action=create_group&sesskey=' + encodeURIComponent(config.sesskey);
        var formData = new URLSearchParams();
        formData.append('courseid', courseid);
        formData.append('groupname', groupname);

        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData,
            credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                var tr = window.Massenrol.spreadsheet.rows[rowIndex];
                if (tr) {
                    var statusCell = tr.cells[window.Massenrol.STATUS_CELL_INDEX];
                    if (statusCell) {
                        statusCell.innerHTML += '<div style="color:green;">✅ Группа создана</div>';
                    }
                }
                window.Massenrol.updateHint('Группа "' + groupname + '" успешно создана. Повторная проверка...');
                document.getElementById('new-group-name').value = '';
                setTimeout(function() {
                    if (window.Massenrol.runGroupsCheck) {
                        window.Massenrol.runGroupsCheck();
                    }
                }, 500);
            } else {
                alert('Ошибка при создании группы: ' + (data.message || 'Неизвестная ошибка'));
            }
        })
        .catch(error => {
            console.error('Ошибка создания группы:', error);
            alert('Ошибка соединения при создании группы.');
        });
    }

    // Функция массового создания недостающих групп (исправленная)
    function createAllMissingGroups() {
        console.log('🔨 Массовое создание недостающих групп');
        var data = window.Massenrol.spreadsheet.getData();
        var createdCount = 0;
        var errorsCount = 0;
        var pendingCreates = 0;

        for (var i = 0; i < data.length; i++) {
            var res = groupCheckResults[i];
            if (!res) continue;

            if (res.summary.errors.length > 0) {
                var courseRow = window.Massenrol.courseCheckResults[i];
                if (!courseRow || !courseRow.map) {
                    console.warn(`Для строки ${i+1} нет данных о курсах, пропускаем`);
                    continue;
                }

                for (var j = 0; j < res.results.length; j++) {
                    var groupResult = res.results[j];
                    if (groupResult && groupResult.exists === false) {
                        var coursesStr = data[i][6] ? data[i][6].toString().trim() : '';
                        var courseList = coursesStr.split(';').map(s => s.trim()).filter(s => s !== '');
                        if (j >= courseList.length) {
                            console.warn(`Для строки ${i+1} индекс группы ${j} выходит за пределы списка курсов`);
                            continue;
                        }
                        var shortname = courseList[j];
                        var courseid = courseRow.map[shortname];
                        if (!courseid) {
                            console.warn(`Для строки ${i+1} курс ${shortname} не найден в результатах проверки`);
                            continue;
                        }

                        var groupsStr = data[i][7] ? data[i][7].toString().trim() : '';
                        var groupList = groupsStr.split(';').map(s => s.trim()).filter(s => s !== '');
                        if (j >= groupList.length) {
                            console.warn(`Для строки ${i+1} нет группы с индексом ${j}`);
                            continue;
                        }
                        var groupname = groupList[j];
                        if (!groupname) {
                            console.warn(`Для строки ${i+1} название группы пустое`);
                            continue;
                        }

                        pendingCreates++;
                        (function(rowIdx, cid, gname) {
                            var url = 'ajax.php?action=create_group&sesskey=' + encodeURIComponent(config.sesskey);
                            var formData = new URLSearchParams();
                            formData.append('courseid', cid);
                            formData.append('groupname', gname);

                            fetch(url, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                body: formData,
                                credentials: 'same-origin'
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    createdCount++;
                                    var tr = window.Massenrol.spreadsheet.rows[rowIdx];
                                    if (tr) {
                                        var statusCell = tr.cells[window.Massenrol.STATUS_CELL_INDEX];
                                        if (statusCell) {
                                            statusCell.innerHTML += '<div style="color:green;">✅ Группа создана (авто)</div>';
                                        }
                                    }
                                    console.log(`✅ Группа "${gname}" создана для строки ${rowIdx+1}`);
                                } else {
                                    errorsCount++;
                                    console.error(`Ошибка создания группы для строки ${rowIdx+1}:`, data.message || 'Неизвестная ошибка');
                                    var tr = window.Massenrol.spreadsheet.rows[rowIdx];
                                    if (tr) {
                                        var statusCell = tr.cells[window.Massenrol.STATUS_CELL_INDEX];
                                        if (statusCell) {
                                            statusCell.innerHTML += '<div style="color:red;">❌ Ошибка: ' + (data.message || 'Неизвестная ошибка') + '</div>';
                                        }
                                    }
                                }
                            })
                            .catch(error => {
                                errorsCount++;
                                console.error('Ошибка соединения при создании группы для строки', rowIdx+1, error);
                            })
                            .finally(() => {
                                pendingCreates--;
                                if (pendingCreates === 0) {
                                    setTimeout(function() {
                                        window.Massenrol.updateHint('Создано групп: ' + createdCount + ', ошибок: ' + errorsCount + '. Повторная проверка...');
                                        if (window.Massenrol.runGroupsCheck) {
                                            window.Massenrol.runGroupsCheck();
                                        }
                                    }, 1000);
                                }
                            });
                        })(i, courseid, groupname);
                    }
                }
            }
        }

        if (pendingCreates === 0) {
            window.Massenrol.updateHint('Нет групп для создания. Запускаем повторную проверку...');
            if (window.Massenrol.runGroupsCheck) {
                window.Massenrol.runGroupsCheck();
            }
        }
    }

    // ========================================================================
    // ✅ ЭТАП 9: ЗАЧИСЛЕНИЕ (с проверкой соответствия курсов и групп)
    // ========================================================================
    function runEnrolment() {
        console.log('🔍 Запуск зачисления...');

        var spreadsheet = window.Massenrol.spreadsheet;
        var data = spreadsheet.getData();
        var STATUS = window.Massenrol.STATUS_CELL_INDEX;

        // ========== ПРОВЕРКА СООТВЕТСТВИЯ КОЛИЧЕСТВА КУРСОВ И ГРУПП ==========
        var warnings = [];
        var errors = [];
        var warningRows = [];
        var errorRows = [];

        for (var i = 0; i < data.length; i++) {
            if (window.Massenrol.isRowEmpty(data[i])) continue;

            var coursesStr = data[i][6] ? data[i][6].toString().trim() : '';
            var groupsStr = data[i][7] ? data[i][7].toString().trim() : '';

            var courseList = coursesStr ? coursesStr.split(';').map(s => s.trim()).filter(s => s !== '') : [];
            var groupList = groupsStr ? groupsStr.split(';').map(s => s.trim()).filter(s => s !== '') : [];

            if (courseList.length === 0) continue;

            if (groupList.length > courseList.length) {
                errors.push('Строка ' + (i+1) + ': групп (' + groupList.length + ') больше, чем курсов (' + courseList.length + ')');
                errorRows.push(i);
            } else if (groupList.length < courseList.length) {
                warnings.push('Строка ' + (i+1) + ': курсов ' + courseList.length + ', групп ' + groupList.length + ' (часть без группы)');
                warningRows.push(i);
            }
        }

        if (errors.length > 0) {
            errorRows.forEach(function(idx) {
                var tr = spreadsheet.rows[idx];
                if (tr) {
                    tr.style.backgroundColor = '#f8d7da';
                }
            });

            var errorMsg = '❌ Невозможно выполнить зачисление из-за критических ошибок:\n' +
                          errors.join('\n') +
                          '\n\nИсправьте данные (количество групп не может превышать количество курсов) и повторите попытку.';

            alert(errorMsg);
            window.Massenrol.updateHint('❌ Зачисление заблокировано: в некоторых строках групп больше, чем курсов.');

            setTimeout(function() {
                errorRows.forEach(function(idx) {
                    var tr = spreadsheet.rows[idx];
                    if (tr) tr.style.backgroundColor = '';
                });
            }, 5000);

            return;
        }

        if (warnings.length > 0) {
            warningRows.forEach(function(idx) {
                var tr = spreadsheet.rows[idx];
                if (tr) {
                    tr.style.backgroundColor = '#fff3cd';
                }
            });

            var warningMsg = '⚠️ Обнаружено несоответствие количества курсов и групп:\n' +
                            warnings.join('\n') +
                            '\n\nЧасть пользователей будет зачислена без группы.\nПродолжить зачисление?';

            if (!confirm(warningMsg)) {
                window.Massenrol.updateHint('❌ Зачисление отменено. Исправьте данные и повторите.');
                warningRows.forEach(function(idx) {
                    var tr = spreadsheet.rows[idx];
                    if (tr) tr.style.backgroundColor = '';
                });
                return;
            } else {
                warningRows.forEach(function(idx) {
                    var tr = spreadsheet.rows[idx];
                    if (tr) tr.style.backgroundColor = '';
                });
            }
        }
        // ========== КОНЕЦ ПРОВЕРКИ ==========

        var buttonsDiv = document.getElementById('validation-buttons');
        buttonsDiv.innerHTML = '<button type="button" class="btn btn-info btn-lg" disabled>⏳ Выполняется зачисление...</button>';
        window.Massenrol.updateHint('⏳ Зачисление пользователей...');

        for (var i = 0; i < data.length; i++) {
            if (!window.Massenrol.isRowEmpty(data[i])) {
                var tr = spreadsheet.rows[i];
                if (tr && tr.cells[STATUS]) {
                    tr.cells[STATUS].innerHTML = '';
                }
            }
        }

        var rowsData = [];

        for (var i = 0; i < data.length; i++) {
            var row = data[i];
            if (window.Massenrol.isRowEmpty(row)) continue;

            var courseshortname = row[6] ? row[6].toString().trim() : '';
            var groupname = row[7] ? row[7].toString().trim() : '';

            var userResult = window.Massenrol.userCheckResults[i] || {};

            var enrolmentData = {
                lastname: row[0] ? row[0].toString().trim() : '',
                firstname: row[1] ? row[1].toString().trim() : '',
                middlename: row[2] ? row[2].toString().trim() : '',
                username: row[3] ? row[3].toString().trim().toLowerCase() : '',
                email: row[4] ? row[4].toString().trim() : '',
                password: row[5] ? row[5].toString().trim() : '',
                courseshortname: courseshortname,
                groupname: groupname,
                selectedUserId: userResult.selectedUserId || null,
                actionTaken: userResult.actionTaken || null
            };

            rowsData.push(enrolmentData);
        }

        if (rowsData.length === 0) {
            alert('Нет данных для зачисления');
            buttonsDiv.innerHTML = '<button type="button" id="go-to-enrolment-btn" class="btn btn-success btn-lg">Перейти к зачислению</button>';
            document.getElementById('go-to-enrolment-btn').onclick = function() {
                runEnrolment();
            };
            return;
        }

        var url = 'ajax.php?action=process_enrolment&sesskey=' + encodeURIComponent(config.sesskey);
        console.log('📤 Отправка данных:', rowsData);
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rowsData),
            credentials: 'same-origin'
        })
        .then(response => {
            console.log('📥 Статус ответа:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('📦 Данные ответа:', data);
            if (data.success) {
                showEnrolmentResults(data.results);
            } else {
                alert('Ошибка при зачислении: ' + (data.error || 'Неизвестная ошибка'));
                buttonsDiv.innerHTML = '<button type="button" id="go-to-enrolment-btn" class="btn btn-success btn-lg">Перейти к зачислению</button>';
                document.getElementById('go-to-enrolment-btn').onclick = function() {
                    runEnrolment();
                };
            }
        })
        .catch(error => {
            console.error('❌ Ошибка fetch:', error);
            alert('Ошибка соединения при зачислении.');
            buttonsDiv.innerHTML = '<button type="button" id="go-to-enrolment-btn" class="btn btn-success btn-lg">Перейти к зачислению</button>';
            document.getElementById('go-to-enrolment-btn').onclick = function() {
                runEnrolment();
            };
        });
    }

    // ========================================================================
    // Функция отображения результатов зачисления
    // ========================================================================
    function showEnrolmentResults(results) {
        console.log('showEnrolmentResults вызвана, results=', results);
        if (!results || !Array.isArray(results)) {
            console.error('results is not an array');
            return;
        }

        var buttonsDiv = document.getElementById('validation-buttons');
        var hint = document.getElementById('info-hint');

        var successCount = 0, failCount = 0;
        for (var idx in results) {
            if (results[idx].success) successCount++; else failCount++;
        }

        hint.innerHTML = '✅ Зачисление завершено. Успешно: ' + successCount + ', ошибок: ' + failCount;

        var spreadsheet = window.Massenrol.spreadsheet;
        var STATUS = window.Massenrol.STATUS_CELL_INDEX;

        for (var idx in results) {
            var rowIndex = parseInt(idx);
            var tr = spreadsheet.rows[rowIndex];
            if (tr && tr.cells[STATUS]) {
                var statusCell = tr.cells[STATUS];
                var message = results[idx].success ? '✅ Зачислен' : '❌ Ошибка: ' + (results[idx].message || '');
                statusCell.innerHTML = '<div style="color:' + (results[idx].success ? 'green' : 'red') + ';">' + message + '</div>';
            }
        }

        var resultsDiv = document.getElementById('results-table');
        if (!resultsDiv) {
            console.error('results-table not found');
            return;
        }
        resultsDiv.innerHTML = '';
        var table = document.createElement('table');
        table.className = 'table table-sm table-bordered';
        var thead = '<thead><tr><th>Строка</th><th>Пользователь</th><th>Статус</th><th>Сообщение</th></tr></thead>';
        table.innerHTML = thead;
        var tbody = document.createElement('tbody');
        for (var idx in results) {
            var rowNum = parseInt(idx) + 1;
            var tr = document.createElement('tr');
            tr.className = results[idx].success ? 'table-success' : 'table-danger';
            var user = results[idx].userid ? 'ID ' + results[idx].userid : '—';
            tr.innerHTML = '<td>' + rowNum + '</td><td>' + user + '</td><td>' + (results[idx].success ? '✅' : '❌') + '</td><td>' + (results[idx].message || '') + '</td>';
            tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        resultsDiv.appendChild(table);

        var panel = document.getElementById('results-panel');
        if (panel) {
            panel.style.display = 'block';
            console.log('results-panel display set to block');
        } else {
            console.error('results-panel not found');
        }

        buttonsDiv.innerHTML = '<button type="button" id="download-report-btn" class="btn btn-success btn-lg">Скачать отчёт</button>';
        document.getElementById('download-report-btn').onclick = function() {
            downloadEnrolmentReport(results);
        };
    }

    // ========================================================================
    // ✅ Детализированный отчёт (каждая пара слушатель-курс отдельной строкой)
    // ========================================================================
    function downloadEnrolmentReport(results) {
        var spreadsheet = window.Massenrol.spreadsheet;
        if (!spreadsheet) {
            alert('Ошибка: таблица не найдена');
            return;
        }

        var tableData = spreadsheet.getData();
        var csvRows = [];

        var headers = [
            '№ исх.строки',
            'Фамилия',
            'Имя',
            'Отчество',
            'Логин',
            'Email',
            'Пароль',
            'Курс',
            'Группа',
            'Статус'
        ];
        csvRows.push(headers.map(escapeCsvField).join(';'));

        for (var i = 0; i < tableData.length; i++) {
            var row = tableData[i];
            if (window.Massenrol.isRowEmpty(row)) continue;

            var baseRowNumber = i + 1;
            var lastname = row[0] ? row[0].toString().trim() : '';
            var firstname = row[1] ? row[1].toString().trim() : '';
            var middlename = row[2] ? row[2].toString().trim() : '';
            var login = row[3] ? row[3].toString().trim() : '';
            var email = row[4] ? row[4].toString().trim() : '';
            var password = row[5] ? row[5].toString().trim() : '';

            var coursesStr = row[6] ? row[6].toString().trim() : '';
            var groupsStr = row[7] ? row[7].toString().trim() : '';
            var courseList = coursesStr ? coursesStr.split(';').map(s => s.trim()).filter(s => s !== '') : [];
            var groupList = groupsStr ? groupsStr.split(';').map(s => s.trim()).filter(s => s !== '') : [];

            if (courseList.length === 0) {
                var fields = [
                    baseRowNumber,
                    lastname,
                    firstname,
                    middlename,
                    login,
                    email,
                    password,
                    '',
                    '',
                    results[i] ? (results[i].success ? '✅ Зачислен' : '❌ ' + (results[i].message || 'Ошибка')) : '—'
                ];
                csvRows.push(fields.map(escapeCsvField).join(';'));
            } else {
                for (var j = 0; j < courseList.length; j++) {
                    var course = courseList[j];
                    var group = (j < groupList.length) ? groupList[j] : '';
                    var status = results[i] ? (results[i].success ? '✅ Зачислен' : '❌ ' + (results[i].message || 'Ошибка')) : '—';
                    var fields = [
                        baseRowNumber,
                        lastname,
                        firstname,
                        middlename,
                        login,
                        email,
                        password,
                        course,
                        group,
                        status
                    ];
                    csvRows.push(fields.map(escapeCsvField).join(';'));
                }
            }
        }

        var csvString = "\uFEFF" + csvRows.join('\n');
        var blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        var link = document.createElement('a');
        var url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', 'enrolment_report.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function escapeCsvField(field) {
        if (typeof field !== 'string') {
            field = String(field);
        }
        if (field.includes(';') || field.includes('"') || field.includes('\n')) {
            field = '"' + field.replace(/"/g, '""') + '"';
        }
        return field;
    }

    // Экспортируем функции
    window.Massenrol.runCoursesCheck = runCoursesCheck;
    window.Massenrol.runGroupsCheck = runGroupsCheck;
    window.Massenrol.createSingleGroup = createSingleGroup;
    window.Massenrol.runEnrolment = runEnrolment;

    console.log('Validation готов (поддержка множественных курсов)');
})();