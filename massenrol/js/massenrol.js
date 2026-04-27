// local/massenrol/js/massenrol.js
(function() {
    // Проверяем, что validation.js уже загружен
    if (!window.Massenrol) {
        console.error('Ошибка: validation.js должен быть загружен до massenrol.js');
        return;
    }

    // Жёсткая проверка наличия jQuery
    if (typeof jQuery === 'undefined') {
        console.error('jQuery не загружен! Модальные окна не будут работать.');
        alert('Ошибка: jQuery не загружен. Обновите страницу или обратитесь к администратору.');
        return;
    } else {
        console.log('jQuery загружен, версия:', jQuery.fn.jquery);
    }

    var config = window.Massenrol.config;
    var spreadsheet = window.Massenrol.spreadsheet;
    var STATUS_CELL_INDEX = window.Massenrol.STATUS_CELL_INDEX;

    console.log('Massenrol основной загружен');

    // ========================================================================
    // Добавляем функцию генерации пароля
    // ========================================================================
    window.Massenrol.generatePassword = function() {
        var length = config.config.passwordlength || 8;
        length = Math.max(8, length);

        var upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var lower = 'abcdefghijklmnopqrstuvwxyz';
        var digits = '0123456789';
        var special = config.config.passwordspecialchars || '.,;:!?_-+/*@#&$';

        var password = '';
        password += upper.charAt(Math.floor(Math.random() * upper.length));
        password += lower.charAt(Math.floor(Math.random() * lower.length));
        password += digits.charAt(Math.floor(Math.random() * digits.length));
        password += special.charAt(Math.floor(Math.random() * special.length));

        var allChars = upper + lower + digits + special;
        for (var i = password.length; i < length; i++) {
            password += allChars.charAt(Math.floor(Math.random() * allChars.length));
        }

        return password.split('').sort(function() { return 0.5 - Math.random(); }).join('');
    };

    // ========================================================================
    // Функция проверки формата логина (допустимые символы + нижний регистр)
    // ========================================================================
    function validateLoginFormat(username) {
        if (!username) return false;
        var regex = /^[a-z0-9_.-]+$/;
        return regex.test(username);
    }

    // ========================================================================
    // Глобальные переменные для этого файла
    // ========================================================================
    var userCheckResults = {};
    var loginCheckResults = {};
    var emailCheckResults = {};
    var pendingRequests = 0;
    var loginFormatErrors = {};
    window.Massenrol.userCheckResults = userCheckResults;

    // Режим массового назначения: 'both' (курсы+группы) или 'groups_only'
    window.Massenrol.massAssignMode = 'both';

    function updateHint(message) {
        window.Massenrol.updateHint(message);
    }

    var DATA_OFFSET = 1;


    // ========================================================================
    // Переменные и функции для массового назначения курсов (ИСПРАВЛЕННАЯ ВЕРСИЯ)
    // ========================================================================
    var selectedRows = [];

    function updateMassAssignButton() {
        var btn = document.getElementById('mass-assign-btn');
        if (!btn) return;

        selectedRows = [];

        if (spreadsheet && typeof spreadsheet.getSelectedRows === 'function') {
            try {
                var apiSelected = spreadsheet.getSelectedRows();
                if (apiSelected && Array.isArray(apiSelected) && apiSelected.length > 0) {
                    for (var i = 0; i < apiSelected.length; i++) {
                        var rowEl = apiSelected[i];
                        var index = -1;
                        for (var j = 0; j < spreadsheet.rows.length; j++) {
                            if (spreadsheet.rows[j] === rowEl) {
                                index = j;
                                break;
                            }
                        }
                        if (index !== -1) selectedRows.push(index);
                    }
                }
            } catch (e) {}
        }

        if (selectedRows.length === 0 && spreadsheet && spreadsheet.rows) {
            var possibleClasses = ['jexcel_selected', 'selected', 'jexcel_row_selected', 'highlight', 'jexcel_highlight', 'jexcel_cursor'];
            for (var i = 0; i < spreadsheet.rows.length; i++) {
                var tr = spreadsheet.rows[i];
                for (var c = 0; c < possibleClasses.length; c++) {
                    if (tr.classList.contains(possibleClasses[c])) {
                        selectedRows.push(i);
                        break;
                    }
                }
            }
        }

        if (selectedRows.length > 0) {
            btn.removeAttribute('disabled');
        } else {
            btn.setAttribute('disabled', 'disabled');
        }
    }

    var spreadsheetElement = document.getElementById('spreadsheet');
    if (spreadsheetElement) {
        spreadsheetElement.addEventListener('click', function() {
            setTimeout(updateMassAssignButton, 50);
        });
    }

    var massAssignBtn = document.getElementById('mass-assign-btn');
    if (massAssignBtn) {
        massAssignBtn.addEventListener('click', function() {
            if (selectedRows.length === 0) {
                alert('Выделите хотя бы одну строку.');
                return;
            }

            var coursesStr, groupsStr;

            if (window.Massenrol.massAssignMode === 'groups_only') {
                // Режим только групп: запрашиваем только группы, курсы не трогаем
                groupsStr = prompt('Введите список групп (через точку с запятой):', '');
                if (groupsStr === null) return;
                groupsStr = groupsStr.trim();
                if (!groupsStr) {
                    alert('Список групп не может быть пустым.');
                    return;
                }
                coursesStr = null; // не меняем курсы
            } else {
                // Режим по умолчанию: и курсы, и группы
                coursesStr = prompt('Введите список курсов (через точку с запятой):', '');
                if (coursesStr === null) return;
                coursesStr = coursesStr.trim();
                if (!coursesStr) {
                    alert('Список курсов не может быть пустым.');
                    return;
                }
                groupsStr = prompt('Введите список групп (через точку с запятой, можно оставить пустым):', '');
                if (groupsStr === null) groupsStr = '';
                else groupsStr = groupsStr.trim();
            }

            // Обновляем данные через setData
            var tableData = spreadsheet.getData();
            selectedRows.forEach(function(rowIndex) {
                if (tableData[rowIndex]) {
                    if (coursesStr !== null) {
                        tableData[rowIndex][6] = coursesStr; // меняем курсы
                    }
                    tableData[rowIndex][7] = groupsStr; // всегда меняем группы (в groups_only только их)
                }
            });
            spreadsheet.setData(tableData);

            // Сбрасываем результаты проверок: в режиме groups_only не трогаем курсы
            if (window.Massenrol.groupCheckResults) window.Massenrol.groupCheckResults = {};
            if (window.Massenrol.massAssignMode === 'both') {
                if (window.Massenrol.courseCheckResults) window.Massenrol.courseCheckResults = {};
            }

            // Очищаем статусные ячейки
            for (var i = 0; i < spreadsheet.rows.length; i++) {
                var tr = spreadsheet.rows[i];
                if (tr) {
                    tr.style.backgroundColor = '';
                    var statusCell = tr.cells[window.Massenrol.STATUS_CELL_INDEX];
                    if (statusCell) statusCell.innerHTML = '';
                }
            }

            if (window.Massenrol.massAssignMode === 'groups_only') {
                window.Massenrol.updateHint('🔄 Группы изменены. Запущена проверка групп...');
                if (window.Massenrol.runGroupsCheck) {
                    window.Massenrol.runGroupsCheck();
                }
            } else {
                window.Massenrol.updateHint('🔄 Курсы и группы назначены. Запущена проверка курсов...');
                if (window.Massenrol.runCoursesCheck) {
                    window.Massenrol.runCoursesCheck();
                }
            }

            setTimeout(updateMassAssignButton, 100);
        });
    }

    window.Massenrol.updateMassAssignButton = updateMassAssignButton;

    // ========================================================================
    // Запоминаем последнюю выбранную строку
    // ========================================================================
    document.addEventListener('click', function(e) {
        var target = e.target;
        if (target.tagName === 'TD' && spreadsheet && spreadsheet.rows) {
            for (var i = 0; i < spreadsheet.rows.length; i++) {
                var cells = Array.from(spreadsheet.rows[i].cells);
                if (cells.indexOf(target) !== -1) {
                    window.Massenrol.lastSelectedRow = i;
                    console.log('Выбрана строка', i);
                    break;
                }
            }
        }
    });

    // ========================================================================
    // Делегирование событий для динамических кнопок
    // ========================================================================
    document.addEventListener('click', function(e) {
        var target = e.target;
        var rowIndex = target.getAttribute('data-row');

        if (target.classList.contains('select-course-btn') && rowIndex !== null) {
            openCourseSearchModal(parseInt(rowIndex));
        }
        else if (target.classList.contains('generate-password-btn') && rowIndex !== null) {
            generateNewPassword(parseInt(rowIndex));
        }
        else if (target.classList.contains('generate-login-btn') && rowIndex !== null) {
            generateNewLogin(parseInt(rowIndex));
        }
        else if (target.classList.contains('select-user-btn') && rowIndex !== null) {
            var res = userCheckResults[parseInt(rowIndex)];
            if (res && res.users) {
                openUserSelectionModal(parseInt(rowIndex), res.users);
            }
        }
        else if (target.id === 'show-all-courses-btn') {
            var modal = jQuery('#courseSearchModal');
            var rowIdx = modal.data('rowIndex');
            if (rowIdx !== undefined) {
                loadAllCourses(rowIdx);
            }
        }
        else if (target.id === 'show-all-courses-main-btn') {
            window.open('courses_list.php', '_blank');
        }
        else if (target.classList.contains('create-group-btn') && rowIndex !== null) {
            var courseid = target.getAttribute('data-courseid');
            var groupname = target.getAttribute('data-groupname');
            createGroup(parseInt(rowIndex), courseid, groupname);
        }
    });

    document.addEventListener('change', function(e) {
        var target = e.target;
        if (target.classList.contains('user-action-select')) {
            var rowIndex = target.getAttribute('data-row');
            var action = target.value;
            var res = userCheckResults[parseInt(rowIndex)];
            if (res && res.user) {
                onUserActionSelect(parseInt(rowIndex), action, res.user);
            }
        }
    });

    // ========================================================================
    // Этап 3: Проверка пользователей
    // ========================================================================
    var userProblemRows = {};

    function checkUser(rowIndex, lastname, firstname, middlename) {
        console.log(`🔍 checkUser: строка ${rowIndex}, ФИО: ${lastname} ${firstname} ${middlename}`);
        pendingRequests++;
        var url = 'ajax.php?action=check_user&sesskey=' + encodeURIComponent(config.sesskey);
        var formData = new URLSearchParams();
        formData.append('lastname', lastname);
        formData.append('firstname', firstname);
        formData.append('middlename', middlename);

        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData,
            credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(data => {
            console.log(`✅ checkUser ответ для строки ${rowIndex}:`, data);
            userCheckResults[rowIndex] = data;
            window.Massenrol.userCheckResults = userCheckResults;
            updateRowAfterUserCheck(rowIndex, data);
        })
        .catch(error => {
            console.error('❌ Ошибка при проверке пользователя (строка ' + (rowIndex+1) + '):', error);
            userCheckResults[rowIndex] = { status: 'error', message: 'Ошибка соединения' };
            window.Massenrol.userCheckResults = userCheckResults;
            updateRowAfterUserCheck(rowIndex, { status: 'error', message: 'Ошибка соединения' });
        })
        .finally(() => {
            pendingRequests--;
            if (pendingRequests === 0) onAllUsersChecked();
        });
    }

    function updateRowAfterUserCheck(rowIndex, result) {
        if (!spreadsheet || !spreadsheet.rows || rowIndex >= spreadsheet.rows.length) return;
        var tr = spreadsheet.rows[rowIndex];
        if (!tr) return;
        var statusCell = tr.cells[STATUS_CELL_INDEX];
        if (!statusCell) return;

        for (var i = 0; i < tr.cells.length; i++) {
            tr.cells[i].style.backgroundColor = '';
        }
        statusCell.innerHTML = '';

        switch (result.status) {
            case 'not_found':
                tr.style.backgroundColor = '#fff3cd';
                statusCell.innerHTML = '<span style="color:#856404;">🆕 Новый пользователь</span>';
                break;
            case 'found':
                tr.style.backgroundColor = '#f8d7da';
                var fullname = result.fullname || (result.lastname + ' ' + result.firstname + ' ' + (result.middlename || '')).trim();
                statusCell.innerHTML = '<span style="color:#721c24;">⚠️ Найден пользователь: ' + fullname + '</span>';
                break;
            case 'multiple':
                tr.style.backgroundColor = '#f8d7da';
                statusCell.innerHTML = '<span style="color:#721c24;">⚠️ Найдено несколько пользователей</span>';
                break;
            default:
                tr.style.backgroundColor = '#f8d7da';
                statusCell.innerHTML = '<span style="color:red;">❌ ' + (result.message || 'Ошибка проверки') + '</span>';
        }
    }

    function onAllUsersChecked() {
        console.log('✅ Все пользователи проверены');
        var totalRows = spreadsheet.getData().length;

        userProblemRows = {};
        for (var i = 0; i < totalRows; i++) {
            var res = userCheckResults[i];
            if (!res) continue;
            if (res.status === 'found' && !res.actionTaken) {
                var userData = res.data || {};
                userProblemRows[i] = { 
                    type: 'found', 
                    user: {
                        id: userData.id,
                        username: userData.username,
                        email: userData.email,
                        fullname: userData.fullname || (userData.lastname + ' ' + userData.firstname + ' ' + (userData.middlename || '')).trim()
                    }
                };
            } else if (res.status === 'multiple' && !res.actionTaken) {
                userProblemRows[i] = { type: 'multiple', users: res.data || [] };
            }
        }
        console.log('📋 userProblemRows после сбора:', userProblemRows);
        renderUserProblemPanel();
    }

    function renderUserProblemPanel() {
        console.log('🎨 renderUserProblemPanel, проблемных строк:', Object.keys(userProblemRows).length);
        var buttonsDiv = document.getElementById('validation-buttons');
        var hint = document.getElementById('info-hint');
        var problemCount = Object.keys(userProblemRows).length;

        if (problemCount === 0) {
            hint.innerHTML = '✅ Все пользователи определены. Автоматически переходим к проверке логинов...';
            setTimeout(function() { runLoginCheck(); }, 500);
            return;
        }

        var rowsDetails = [];
        for (var idx in userProblemRows) {
            var rowNum = parseInt(idx) + 1;
            var rowData = spreadsheet.getData()[idx];
            var fullname = (rowData[0] || '') + ' ' + (rowData[1] || '') + ' ' + (rowData[2] || '');
            rowsDetails.push(`<strong>Строка ${rowNum}</strong> (${fullname.trim()}) – ${userProblemRows[idx].type === 'found' ? 'найден один пользователь' : 'несколько пользователей'}`);
        }

        var hintMessage = '⚠️ Обнаружены проблемы с пользователями:<br>' + rowsDetails.join('<br>') +
            '<br><strong>Выберите действие для каждой строки ниже.</strong> ' +
            'При выборе «Использовать данные из ЭОС» логин, email и пароль в таблице будут заменены на данные из системы.';
        hint.innerHTML = hintMessage;

        var actionButtonsHtml = `
            <div class="mt-3 d-flex gap-2">
                <button type="button" id="apply-eos-to-all" class="btn btn-outline-primary">Всем "Использовать данные из ЭОС"</button>
                <button type="button" id="enrol-all-as-new-btn" class="btn btn-warning">Зачислить всех как новых</button>
            </div>
        `;

        var rowsPanelHtml = '<div class="user-problems-panel" style="margin-top:15px;">';
        rowsPanelHtml += '<h5>Необходимо выбрать действие для каждой строки:</h5>';

        for (var idx in userProblemRows) {
            var rowNum = parseInt(idx) + 1;
            var problem = userProblemRows[idx];
            var rowData = spreadsheet.getData()[idx];
            var fullname = (rowData[0] || '') + ' ' + (rowData[1] || '') + ' ' + (rowData[2] || '');

            rowsPanelHtml += `<div class="problem-row card mb-2 p-2" data-row="${idx}" style="background:#f8f9fa;">`;
            rowsPanelHtml += `<div class="d-flex align-items-center flex-wrap gap-2">`;
            rowsPanelHtml += `<span style="min-width:120px;"><strong>Строка ${rowNum}</strong> (${fullname.trim()}):</span>`;

            if (problem.type === 'found') {
                rowsPanelHtml += `<select class="form-control form-control-sm user-action-select" data-row="${idx}" style="width:250px;">`;
                rowsPanelHtml += `<option value="">-- Выберите действие --</option>`;
                rowsPanelHtml += `<option value="keep">Оставить данные из таблицы</option>`;
                rowsPanelHtml += `<option value="use_eos">Использовать данные из ЭОС</option>`;
                rowsPanelHtml += `</select>`;
            } else if (problem.type === 'multiple') {
                rowsPanelHtml += `<button type="button" class="btn btn-sm btn-warning select-user-btn" data-row="${idx}">Выбрать пользователя</button>`;
            }

            rowsPanelHtml += `</div></div>`;
        }
        rowsPanelHtml += '</div>';

        buttonsDiv.innerHTML = actionButtonsHtml + rowsPanelHtml;

        document.getElementById('apply-eos-to-all').addEventListener('click', function() {
            console.log('🖱️ Нажата кнопка "Всем Использовать данные из ЭОС"');
            applyActionToAll('use_eos');
        });

        document.getElementById('enrol-all-as-new-btn').addEventListener('click', function() {
            console.log('🖱️ Нажата кнопка "Зачислить всех как новых"');
            enrolAllAsNew();
        });

        document.querySelectorAll('.user-action-select').forEach(select => {
            select.addEventListener('change', function(e) {
                var rowIndex = this.dataset.row;
                var action = this.value;
                console.log(`🖱️ Выбран action=${action} для строки ${rowIndex}`);
                if (!action) return;
                var problem = userProblemRows[rowIndex];
                if (problem && problem.type === 'found') {
                    console.log('✅ Вызов onUserActionSelect с пользователем:', problem.user);
                    onUserActionSelect(parseInt(rowIndex), action, problem.user);
                } else {
                    console.warn('⚠️ Проблема не найдена или неверный тип', problem);
                }
            });
        });

        document.querySelectorAll('.select-user-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                var rowIndex = this.dataset.row;
                console.log(`🖱️ Нажата кнопка выбора пользователя для строки ${rowIndex}`);
                var problem = userProblemRows[rowIndex];
                if (problem && problem.type === 'multiple') {
                    openUserSelectionModal(parseInt(rowIndex), problem.users);
                } else {
                    console.warn('⚠️ Проблема не найдена или неверный тип', problem);
                }
            });
        });
    }

    function onUserActionSelect(rowIndex, action, userData) {
        console.log('🎯 onUserActionSelect вызван:', { rowIndex, action, userData });
        if (!userData) {
            console.error('❌ Нет userData!');
            return;
        }
        if (action === 'use_eos') {
            var lowerUsername = userData.username ? userData.username.toLowerCase() : null;
            console.log(`✏️ Замена данных в строке ${rowIndex} на данные из ЭОС:`, userData, 'логин после приведения:', lowerUsername);
            if (lowerUsername) {
                spreadsheet.setValue(rowIndex, 3, lowerUsername);
            }
            spreadsheet.setValue(rowIndex, 4, userData.email);
            spreadsheet.setValue(rowIndex, 5, '********');
            
            var tr = spreadsheet.rows[rowIndex];
            if (tr) {
                if (lowerUsername) {
                    tr.cells[3 + DATA_OFFSET].innerHTML = lowerUsername;
                }
                tr.cells[4 + DATA_OFFSET].innerHTML = userData.email;
                tr.cells[5 + DATA_OFFSET].innerHTML = '********';
                for (var i = 0; i < tr.cells.length; i++) {
                    tr.cells[i].style.backgroundColor = '#d4edda';
                }
                var statusCell = tr.cells[STATUS_CELL_INDEX];
                if (statusCell) statusCell.innerHTML = '<span style="color:#155724;">✅ Данные заменены (из ЭОС)</span>';
            }

            var newUsername = spreadsheet.getData()[rowIndex][3];
            var newEmail = spreadsheet.getData()[rowIndex][4];
            console.log(`🔍 После setValue: логин='${newUsername}', email='${newEmail}'`);

            userCheckResults[rowIndex].selectedUserId = userData.id;
            userCheckResults[rowIndex].actionTaken = 'use_eos';
            window.Massenrol.userCheckResults = userCheckResults;
        } else if (action === 'keep') {
            console.log(`✏️ Строка ${rowIndex} оставлена без изменений (новый пользователь)`);
            var tr = spreadsheet.rows[rowIndex];
            if (tr) {
                var statusCell = tr.cells[STATUS_CELL_INDEX];
                if (statusCell) statusCell.innerHTML = '<span style="color:#856404;">🆕 Будет создан новый пользователь (данные из таблицы)</span>';
            }
            userCheckResults[rowIndex].actionTaken = 'keep';
            window.Massenrol.userCheckResults = userCheckResults;
        }

        delete userProblemRows[rowIndex];
        renderUserProblemPanel();
    }

    function openUserSelectionModal(rowIndex, users) {
        console.log('📋 openUserSelectionModal для строки', rowIndex, 'пользователи:', users);
        
        var modal = jQuery('#userSelectionModal');
        console.log('🔍 jQuery-объект для #userSelectionModal:', modal);
        console.log('   - длина (количество элементов):', modal.length);
        console.log('   - тип modal.modal:', typeof modal.modal);
        
        if (!modal.length || typeof modal.modal !== 'function') {
            console.warn('⚠️ Модальное окно недоступно, автоматически выбираем первого пользователя');
            if (users && users.length > 0) {
                var firstUser = users[0];
                var lowerUsername = firstUser.username ? firstUser.username.toLowerCase() : null;
                
                console.log(`✅ Автовыбор: id=${firstUser.id}, username=${lowerUsername}, email=${firstUser.email}`);
                
                if (lowerUsername) {
                    spreadsheet.setValue(rowIndex, 3, lowerUsername);
                }
                spreadsheet.setValue(rowIndex, 4, firstUser.email);
                spreadsheet.setValue(rowIndex, 5, '********');
                
                var tr = spreadsheet.rows[rowIndex];
                if (tr) {
                    if (lowerUsername) {
                        tr.cells[3 + DATA_OFFSET].innerHTML = lowerUsername;
                    }
                    tr.cells[4 + DATA_OFFSET].innerHTML = firstUser.email;
                    tr.cells[5 + DATA_OFFSET].innerHTML = '********';
                    for (var i = 0; i < tr.cells.length; i++) {
                        tr.cells[i].style.backgroundColor = '#d4edda';
                    }
                    var statusCell = tr.cells[STATUS_CELL_INDEX];
                    if (statusCell) {
                        statusCell.innerHTML = '<span style="color:#155724;">✅ Данные заменены (выбран первый пользователь)</span>';
                    }
                }
                
                userCheckResults[rowIndex].selectedUserId = firstUser.id;
                userCheckResults[rowIndex].actionTaken = 'use_eos';
                window.Massenrol.userCheckResults = userCheckResults;
                
                delete userProblemRows[rowIndex];
                renderUserProblemPanel();
            } else {
                console.warn('⚠️ Нет пользователей для выбора');
                alert('Нет пользователей для выбора');
            }
            return;
        }
        
        var listContainer = document.getElementById('userSelectionList');
        var emptyMessage = document.getElementById('userSelectionEmpty');
        if (!listContainer) {
            console.error('❌ #userSelectionList не найден');
            return;
        }

        listContainer.innerHTML = '';
        if (emptyMessage) emptyMessage.style.display = 'none';

        if (!users || users.length === 0) {
            if (emptyMessage) emptyMessage.style.display = 'block';
        } else {
            users.forEach(function(user) {
                var div = document.createElement('div');
                div.className = 'radio mb-2 p-2 border rounded';
                div.innerHTML = '<label>' +
                    '<input type="radio" name="selectedUser" value="' + user.id + '" data-username="' + user.username + '" data-email="' + user.email + '"> ' +
                    user.fullname + ' (' + user.username + ', ' + user.email + ')' +
                    '</label>';
                listContainer.appendChild(div);
            });

            var footer = modal.find('.modal-footer');
            footer.html('');
            footer.append('<button type="button" class="btn btn-secondary" data-dismiss="modal">Отмена</button>');
            var selectBtn = jQuery('<button type="button" class="btn btn-primary">Выбрать</button>');
            selectBtn.on('click', function() {
                var selected = document.querySelector('input[name="selectedUser"]:checked');
                if (!selected) {
                    alert('Пожалуйста, выберите пользователя');
                    return;
                }
                var userId = selected.value;
                var username = selected.dataset.username;
                var email = selected.dataset.email;
                var lowerUsername = username ? username.toLowerCase() : null;
                console.log(`✅ Выбран пользователь: id=${userId}, username=${lowerUsername}, email=${email}`);
                if (lowerUsername) {
                    spreadsheet.setValue(rowIndex, 3, lowerUsername);
                }
                spreadsheet.setValue(rowIndex, 4, email);
                spreadsheet.setValue(rowIndex, 5, '********');
                
                var tr = spreadsheet.rows[rowIndex];
                if (tr) {
                    if (lowerUsername) {
                        tr.cells[3 + DATA_OFFSET].innerHTML = lowerUsername;
                    }
                    tr.cells[4 + DATA_OFFSET].innerHTML = email;
                    tr.cells[5 + DATA_OFFSET].innerHTML = '********';
                    for (var i = 0; i < tr.cells.length; i++) {
                        tr.cells[i].style.backgroundColor = '#d4edda';
                    }
                    var statusCell = tr.cells[STATUS_CELL_INDEX];
                    if (statusCell) statusCell.innerHTML = '<span style="color:#155724;">✅ Данные заменены (выбран пользователь)</span>';
                }
                
                var newUsername = spreadsheet.getData()[rowIndex][3];
                var newEmail = spreadsheet.getData()[rowIndex][4];
                console.log(`🔍 После модального выбора: логин='${newUsername}', email='${newEmail}'`);

                userCheckResults[rowIndex].selectedUserId = userId;
                userCheckResults[rowIndex].actionTaken = 'use_eos';
                window.Massenrol.userCheckResults = userCheckResults;
                modal.modal('hide');

                delete userProblemRows[rowIndex];
                renderUserProblemPanel();
            });
            footer.append(selectBtn);
        }
        modal.modal('show');
    }

    function applyActionToAll(action) {
        console.log('⚡ applyActionToAll, действие:', action);
        var rowsToProcess = Object.keys(userProblemRows);
        console.log('Строки для обработки:', rowsToProcess);
        for (var idx of rowsToProcess) {
            var problem = userProblemRows[idx];
            if (!problem) {
                console.warn(`⚠️ Проблема для строки ${idx} не найдена (уже удалена?)`);
                continue;
            }
            var rowIndex = parseInt(idx);
            if (problem.type === 'found') {
                console.log(`➡️ Обработка строки ${rowIndex} (found) с действием ${action}`);
                onUserActionSelect(rowIndex, action, problem.user);
            } else if (problem.type === 'multiple') {
                var firstUser = problem.users && problem.users[0];
                if (firstUser) {
                    console.log(`➡️ Обработка строки ${rowIndex} (multiple) с действием ${action}, берём первого пользователя:`, firstUser);
                    onUserActionSelect(rowIndex, action, firstUser);
                } else {
                    console.warn(`⚠️ В строке ${rowIndex} нет пользователей для выбора`);
                }
            }
        }
    }

    function enrolAllAsNew() {
        console.log('⚡ enrolAllAsNew');
        for (var idx in userProblemRows) {
            var rowIndex = parseInt(idx);
            var tr = spreadsheet.rows[rowIndex];
            if (tr) {
                for (var j = 0; j < tr.cells.length; j++) {
                    tr.cells[j].style.backgroundColor = '#fff3cd';
                }
                var statusCell = tr.cells[STATUS_CELL_INDEX];
                if (statusCell) statusCell.innerHTML = '<span style="color:#856404;">🆕 Будет создан новый пользователь</span>';
            }
            userCheckResults[rowIndex].actionTaken = 'force_new';
            window.Massenrol.userCheckResults = userCheckResults;
        }
        userProblemRows = {};
        renderUserProblemPanel();
    }

    function runUsersCheck() {
        console.log('🔍 Проверка пользователей...');
        var buttonsDiv = document.getElementById('validation-buttons');
        buttonsDiv.innerHTML = '<button type="button" class="btn btn-info btn-lg" disabled>⏳ Проверка пользователей...</button>';
        updateHint('⏳ Выполняется проверка пользователей в системе...');

        var data = spreadsheet.getData();
        userCheckResults = {};
        userProblemRows = {};
        pendingRequests = 0;

        for (var i = 0; i < data.length; i++) {
            var row = data[i];
            var lastname = row[0] ? row[0].trim() : '';
            var firstname = row[1] ? row[1].trim() : '';
            var middlename = row[2] ? row[2].trim() : '';
            if (!lastname && !firstname) continue;
            checkUser(i, lastname, firstname, middlename);
        }
        if (pendingRequests === 0) onAllUsersChecked();
    }

    // ========================================================================
    // Этап 4: Проверка логинов
    // ========================================================================
    function checkLogin(rowIndex, username) {
        pendingRequests++;
        var url = 'ajax.php?action=check_login&sesskey=' + encodeURIComponent(config.sesskey);
        var formData = new URLSearchParams();
        formData.append('username', username);
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: formData, credentials: 'same-origin' })
        .then(response => response.json())
        .then(data => {
            loginCheckResults[rowIndex] = data;
            loginFormatErrors[rowIndex] = false;
            updateRowAfterLoginCheck(rowIndex, data);
        })
        .catch(error => {
            console.error('Ошибка при проверке логина (строка ' + (rowIndex+1) + '):', error);
            loginCheckResults[rowIndex] = { available: false, error: 'Ошибка соединения' };
            loginFormatErrors[rowIndex] = false;
            updateRowAfterLoginCheck(rowIndex, { available: false, error: 'Ошибка соединения' });
        })
        .finally(() => { pendingRequests--; if (pendingRequests === 0) onAllLoginsChecked(); });
    }

    function updateRowAfterLoginCheck(rowIndex, result) {
        if (!spreadsheet || !spreadsheet.rows || rowIndex >= spreadsheet.rows.length) return;
        var tr = spreadsheet.rows[rowIndex];
        if (!tr) return;
        var statusCell = tr.cells[STATUS_CELL_INDEX];
        if (!statusCell) return;
        statusCell.innerHTML = '';
        if (result.available === true) {
            statusCell.innerHTML = '<div style="color:green;">✅ Логин свободен</div>';
        } else {
            tr.style.backgroundColor = '#f8d7da';
            var buttonHtml = '<button type="button" class="btn btn-sm btn-warning generate-login-btn" data-row="' + rowIndex + '" style="margin-top:5px;">Сгенерировать новый логин</button>';
            statusCell.innerHTML = '<div style="color:red;">❌ Логин занят</div>' + buttonHtml;
        }
    }

    function generateNewLogin(rowIndex) {
        var newLogin = window.Massenrol.generateUsername(rowIndex) + Math.floor(Math.random() * 100);
        newLogin = newLogin.toLowerCase();
        spreadsheet.setValue(rowIndex, 3, newLogin);
        var tr = spreadsheet.rows[rowIndex];
        if (tr && tr.cells[3 + DATA_OFFSET]) {
            tr.cells[3 + DATA_OFFSET].innerHTML = newLogin;
        }
        console.log('Генерация нового логина для строки', rowIndex, newLogin);
        pendingRequests++;
        var username = spreadsheet.getData()[rowIndex][3] ? spreadsheet.getData()[rowIndex][3].trim() : '';
        if (username) {
            checkLogin(rowIndex, username);
        } else {
            pendingRequests--;
        }
    }

    function onAllLoginsChecked() {
        console.log('Все логины проверены');
        var totalRows = spreadsheet.getData().length;
        var errorCount = 0;
        var loginErrors = {};

        for (var i = 0; i < totalRows; i++) {
            var username = spreadsheet.getData()[i][3] ? spreadsheet.getData()[i][3].toString().trim() : '';

            if (loginFormatErrors[i]) {
                if (!username) {
                    errorCount++;
                    if (!loginErrors['Логин не заполнен']) loginErrors['Логин не заполнен'] = [];
                    loginErrors['Логин не заполнен'].push(i + 1);
                } else {
                    errorCount++;
                    if (!loginErrors['Недопустимые символы в логине']) loginErrors['Недопустимые символы в логине'] = [];
                    loginErrors['Недопустимые символы в логине'].push(i + 1);
                }
            } else if (loginCheckResults[i] && loginCheckResults[i].available === false) {
                errorCount++;
                if (!loginErrors['Логин занят']) loginErrors['Логин занят'] = [];
                loginErrors['Логин занят'].push(i + 1);
            }
        }

        var buttonsDiv = document.getElementById('validation-buttons');
        var hint = document.getElementById('info-hint');

        if (errorCount > 0) {
            var warningList = [];
            for (var errType in loginErrors) {
                var rowsStr = loginErrors[errType].join(', ');
                warningList.push(errType + ' (строки: ' + rowsStr + ')');
            }

            var hintMessage = '⚠️ Обнаружены ошибки в логинах:<br>' + warningList.join('<br>') +
                '<br><strong>Логин должен быть заполнен и может содержать только строчные латинские буквы, цифры, дефис, подчеркивание, точку. Заглавные буквы не допускаются.</strong><br>' +
                'Исправьте вручную или нажмите кнопку для автоматической генерации.';

            buttonsDiv.innerHTML = '<button type="button" id="fix-all-logins-btn" class="btn btn-warning btn-lg">Сгенерировать новые логины для всех проблемных</button>';
            document.getElementById('fix-all-logins-btn').onclick = function() { fixAllProblemLogins(); };
            hint.innerHTML = hintMessage;
        } else {
            hint.innerHTML = '✅ Все логины корректны и свободны. Автоматически переходим к проверке email...';
            setTimeout(function() {
                runEmailCheck();
            }, 500);
        }
    }

    function fixAllProblemLogins() {
        console.log('fixAllProblemLogins запущена');
        var data = spreadsheet.getData();
        var updatedData = [];
        var generatedCount = 0;

        for (var i = 0; i < data.length; i++) {
            var row = data[i].slice();
            var username = row[3] ? row[3].toString().trim() : '';

            var isProblem = false;
            if (!username) {
                isProblem = true;
            } else if (!validateLoginFormat(username)) {
                isProblem = true;
            } else {
                var res = loginCheckResults[i];
                if (res && res.available === false) {
                    isProblem = true;
                }
            }

            if (isProblem) {
                var newLogin = window.Massenrol.generateUsername(i) + Math.floor(Math.random() * 100);
                newLogin = newLogin.toLowerCase();
                console.log('Строка', i, 'генерируем новый логин:', newLogin);
                row[3] = newLogin;
                var tr = spreadsheet.rows[i];
                if (tr && tr.cells[3 + DATA_OFFSET]) {
                    tr.cells[3 + DATA_OFFSET].innerHTML = newLogin;
                }
                generatedCount++;
            }
            updatedData.push(row);
        }

        console.log('Сгенерировано новых логинов:', generatedCount);
        spreadsheet.setData(updatedData);

        setTimeout(function() {
            runLoginCheck();
        }, 200);
    }

    function runLoginCheck() {
        console.log('🔍 Проверка логинов...');
        var buttonsDiv = document.getElementById('validation-buttons');
        buttonsDiv.innerHTML = '<button type="button" class="btn btn-info btn-lg" disabled>⏳ Проверка логинов...</button>';
        updateHint('⏳ Выполняется проверка уникальности и формата логинов...');

        var data = spreadsheet.getData();
        console.log('📋 Логины из таблицы:', data.map(row => row[3] ? row[3].toString().trim() : ''));

        loginCheckResults = {};
        loginFormatErrors = {};
        pendingRequests = 0;

        for (var i = 0; i < data.length; i++) {
            var username = data[i][3] ? data[i][3].toString().trim() : '';
            console.log(`  строка ${i}: username='${username}'`);

            if (window.Massenrol.userCheckResults[i] && window.Massenrol.userCheckResults[i].actionTaken === 'use_eos') {
                if (username && username !== username.toLowerCase()) {
                    console.log(`    🔄 приведение к нижнему регистру для существующего пользователя: '${username}' -> '${username.toLowerCase()}'`);
                    username = username.toLowerCase();
                    spreadsheet.setValue(i, 3, username);
                    var tr = spreadsheet.rows[i];
                    if (tr && tr.cells[3 + DATA_OFFSET]) {
                        tr.cells[3 + DATA_OFFSET].innerHTML = username;
                    }
                }
                console.log(`    ✅ строка использует существующего пользователя, проверка логина пропущена`);
                loginCheckResults[i] = { available: true };
                var tr = spreadsheet.rows[i];
                if (tr) {
                    var statusCell = tr.cells[STATUS_CELL_INDEX];
                    if (statusCell) {
                        statusCell.innerHTML = '<div style="color:green;">✅ Логин (существующий пользователь)</div>';
                    }
                }
                continue;
            }

            if (!username) {
                if (config.config.autogenerateusername) {
                    var newLogin = window.Massenrol.generateUsername(i);
                    newLogin = newLogin.toLowerCase();
                    spreadsheet.setValue(i, 3, newLogin);
                    var tr = spreadsheet.rows[i];
                    if (tr && tr.cells[3 + DATA_OFFSET]) {
                        tr.cells[3 + DATA_OFFSET].innerHTML = newLogin;
                    }
                    username = newLogin;
                    console.log(`    автогенерация: новый логин='${username}'`);
                } else {
                    console.log(`    ❌ логин не заполнен`);
                    loginFormatErrors[i] = true;
                    var tr = spreadsheet.rows[i];
                    if (tr) {
                        tr.style.backgroundColor = '#f8d7da';
                        var statusCell = tr.cells[STATUS_CELL_INDEX];
                        if (statusCell) {
                            statusCell.innerHTML = '<div style="color:red;">❌ Логин не заполнен</div>';
                        }
                    }
                    continue;
                }
            }

            var lowerUsername = username.toLowerCase();
            if (lowerUsername !== username) {
                console.log(`    🔄 приведение к нижнему регистру: '${username}' -> '${lowerUsername}'`);
                username = lowerUsername;
                spreadsheet.setValue(i, 3, username);
                var tr = spreadsheet.rows[i];
                if (tr && tr.cells[3 + DATA_OFFSET]) {
                    tr.cells[3 + DATA_OFFSET].innerHTML = username;
                }
            }

            if (!validateLoginFormat(username)) {
                console.log(`    ❌ недопустимый формат '${username}'`);
                loginFormatErrors[i] = true;
                var tr = spreadsheet.rows[i];
                if (tr) {
                    tr.style.backgroundColor = '#f8d7da';
                    var statusCell = tr.cells[STATUS_CELL_INDEX];
                    if (statusCell) {
                        statusCell.innerHTML = '<div style="color:red;">❌ Недопустимые символы в логине (только строчные латинские буквы, цифры, дефис, подчеркивание, точка). Заглавные буквы не допускаются.</div>';
                    } 
                }
                continue;
            }

            console.log(`    ✅ отправка запроса для строки ${i}`);
            checkLogin(i, username);
        }

        if (pendingRequests === 0) onAllLoginsChecked();
    }

    // ========================================================================
    // Этап 5: Проверка email
    // ========================================================================
    function checkEmail(rowIndex, email) {
        pendingRequests++;
        var url = 'ajax.php?action=check_email&sesskey=' + encodeURIComponent(config.sesskey);
        var formData = new URLSearchParams();
        formData.append('email', email);
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: formData, credentials: 'same-origin' })
        .then(response => response.json())
        .then(data => { 
            emailCheckResults[rowIndex] = data; 
            updateRowAfterEmailCheck(rowIndex, data); 
        })
        .catch(error => {
            console.error('Ошибка при проверке email (строка ' + (rowIndex+1) + '):', error);
            emailCheckResults[rowIndex] = { available: false, message: 'Ошибка соединения' };
            updateRowAfterEmailCheck(rowIndex, { available: false, message: 'Ошибка соединения' });
        })
        .finally(() => { pendingRequests--; if (pendingRequests === 0) onAllEmailsChecked(); });
    }

    function updateRowAfterEmailCheck(rowIndex, result) {
        if (!spreadsheet || !spreadsheet.rows || rowIndex >= spreadsheet.rows.length) return;
        var tr = spreadsheet.rows[rowIndex];
        if (!tr) return;
        var statusCell = tr.cells[STATUS_CELL_INDEX];
        if (!statusCell) return;
        statusCell.innerHTML = '';
        var email = spreadsheet.getData()[rowIndex][4] || '';
        if (!email) {
            tr.style.backgroundColor = '#f8d7da';
            statusCell.innerHTML = '<div style="color:red;">❌ Email не заполнен</div>';
            emailCheckResults[rowIndex] = { available: false, message: 'Email не заполнен' };
            return;
        }
        if (result.available === true) {
            statusCell.innerHTML = '<div style="color:green;">✅ Email корректен и свободен</div>';
        } else {
            tr.style.backgroundColor = '#f8d7da';
            statusCell.innerHTML = '<div style="color:red;">❌ ' + (result.message || 'Email недоступен или недопустим') + '</div>';
        }
    }

    function onAllEmailsChecked() {
        console.log('Все email проверены');
        var totalRows = spreadsheet.getData().length;
        var errorCount = 0;
        var emailErrors = {};

        for (var i = 0; i < totalRows; i++) {
            var res = emailCheckResults[i];
            if (res && res.available === false) {
                errorCount++;
                var message = res.message || 'Ошибка email';
                if (!emailErrors[message]) emailErrors[message] = [];
                emailErrors[message].push(i + 1);
            }
        }

        var buttonsDiv = document.getElementById('validation-buttons');
        var hint = document.getElementById('info-hint');

        if (errorCount > 0) {
            var warningList = [];
            for (var errType in emailErrors) {
                var rowsStr = emailErrors[errType].join(', ');
                warningList.push(errType + ' (строки: ' + rowsStr + ')');
            }

            var hintMessage = '⚠️ Обнаружены ошибки в email:<br>' + warningList.join('<br>') +
                '<br><strong>Email должен быть корректным и уникальным.</strong><br>' +
                'Исправьте вручную и нажмите «Проверить исправленные email».';

            buttonsDiv.innerHTML = '<button type="button" id="retry-email-check-btn" class="btn btn-warning btn-lg">Проверить исправленные email</button>';
            document.getElementById('retry-email-check-btn').onclick = function() { runEmailCheck(); };
            hint.innerHTML = hintMessage;
        } else {
            hint.innerHTML = '✅ Все email корректны. Автоматически переходим к проверке паролей...';
            setTimeout(function() {
                runPasswordCheck();
            }, 500);
        }
    }

    function runEmailCheck() {
        console.log('🔍 Проверка email...');
        var buttonsDiv = document.getElementById('validation-buttons');
        buttonsDiv.innerHTML = '<button type="button" class="btn btn-info btn-lg" disabled>⏳ Проверка email...</button>';
        updateHint('⏳ Выполняется проверка email...');

        var data = spreadsheet.getData();
        console.log('📋 Email из таблицы:', data.map(row => row[4] ? row[4].trim() : ''));

        emailCheckResults = {};
        pendingRequests = 0;

        for (var i = 0; i < data.length; i++) {
            var email = data[i][4] ? data[i][4].trim() : '';
            console.log(`  строка ${i}: email='${email}'`);

            if (window.Massenrol.userCheckResults[i] && window.Massenrol.userCheckResults[i].actionTaken === 'use_eos') {
                console.log(`    ✅ строка использует существующего пользователя, проверка email пропущена`);
                emailCheckResults[i] = { available: true };
                var tr = spreadsheet.rows[i];
                if (tr) {
                    var statusCell = tr.cells[STATUS_CELL_INDEX];
                    if (statusCell) {
                        statusCell.innerHTML = '<div style="color:green;">✅ Email (существующий пользователь)</div>';
                    }
                }
                continue;
            }

            if (!email) {
                console.log(`    ❌ email не заполнен`);
                var tr = spreadsheet.rows[i];
                if (tr) {
                    tr.style.backgroundColor = '#f8d7da';
                    var statusCell = tr.cells[STATUS_CELL_INDEX];
                    if (statusCell) statusCell.innerHTML = '<div style="color:red;">❌ Email не заполнен</div>';
                }
                emailCheckResults[i] = { available: false, message: 'Email не заполнен' };
                continue;
            }
            console.log(`    ✅ отправка запроса для строки ${i}`);
            checkEmail(i, email);
        }

        if (pendingRequests === 0) onAllEmailsChecked();
    }

    // ========================================================================
    // Этап 6: Проверка паролей
    // ========================================================================
    var passwordErrors = {};

    function validatePassword(password) {
        console.log('validatePassword вызван с аргументом:', password);
        var errors = [];
        if (!password || password.length < 8) errors.push('Минимальная длина 8 символов');
        if (!/[0-9]/.test(password)) errors.push('Должна быть хотя бы одна цифра');
        if (!/[a-z]/.test(password)) errors.push('Должна быть хотя бы одна строчная буква');
        if (!/[A-Z]/.test(password)) errors.push('Должна быть хотя бы одна заглавная буква');
        if (!/[^a-zA-Z0-9]/.test(password)) {
            errors.push('Поменяйте пароль');
        }
        console.log('Результат validatePassword:', errors.length === 0 ? 'валиден' : errors);
        return { valid: errors.length === 0, errors: errors };
    }

    function updateRowAfterPasswordCheck(rowIndex, password) {
        console.log('updateRowAfterPasswordCheck для строки', rowIndex, 'пароль', password);
        if (!spreadsheet || !spreadsheet.rows || rowIndex >= spreadsheet.rows.length) return;
        var tr = spreadsheet.rows[rowIndex];
        if (!tr) return;
        var statusCell = tr.cells[STATUS_CELL_INDEX];
        if (!statusCell) return;

        statusCell.innerHTML = '';

        if (password === '********') {
            console.log('Строка', rowIndex, ': пароль от существующего пользователя');
            statusCell.innerHTML = '<span style="color:green;">✅ Пароль (существующий пользователь)</span>';
            return;
        }

        if (!password) {
            console.log('Строка', rowIndex, ': пароль пустой');
            tr.style.backgroundColor = '#f8d7da';
            statusCell.innerHTML = '<div style="color:red;">❌ Пароль не заполнен</div>';
            var msg = 'Пароль не заполнен';
            if (!passwordErrors[msg]) passwordErrors[msg] = [];
            if (passwordErrors[msg].indexOf(rowIndex + 1) === -1) passwordErrors[msg].push(rowIndex + 1);
            return;
        }

        var result = validatePassword(password);
        if (result.valid) {
            console.log('Строка', rowIndex, ': пароль валиден');
            statusCell.innerHTML = '<span style="color:green;">✅ Пароль соответствует требованиям</span>';
        } else {
            console.log('Строка', rowIndex, ': пароль невалиден, ошибки:', result.errors);
            tr.style.backgroundColor = '#f8d7da';
            result.errors.forEach(function(err) {
                if (!passwordErrors[err]) passwordErrors[err] = [];
                if (passwordErrors[err].indexOf(rowIndex + 1) === -1) passwordErrors[err].push(rowIndex + 1);
            });
            var errorHtml = '<div style="color:red;">❌ ' + result.errors.join('<br>') + '</div>';
            statusCell.innerHTML = errorHtml;
        }
    }

    function generateNewPassword(rowIndex) {
        console.log('generateNewPassword для строки', rowIndex);
        var newPassword = window.Massenrol.generatePassword();
        console.log('Сгенерированный пароль:', newPassword);
        spreadsheet.setValue(rowIndex, 5, newPassword);
        updateRowAfterPasswordCheck(rowIndex, newPassword);
    }

    function runPasswordCheck() {
        console.log('🔍 Проверка паролей запущена');
        var buttonsDiv = document.getElementById('validation-buttons');
        buttonsDiv.innerHTML = '<button type="button" class="btn btn-info btn-lg" disabled>⏳ Проверка паролей...</button>';
        updateHint('⏳ Проверка паролей... Требования: минимум 8 символов, цифра, строчная, заглавная, спецсимвол из набора: .,;:!?_-+/*@#&$');

        var data = spreadsheet.getData();
        passwordErrors = {};

        for (var i = 0; i < data.length; i++) {
            var password = data[i][5] ? data[i][5].toString().trim() : '';
            console.log('Строка', i, 'исходный пароль из таблицы:', password);
            updateRowAfterPasswordCheck(i, password);
        }

        var uniqueErrorRows = {};
        for (var errMsg in passwordErrors) {
            passwordErrors[errMsg].forEach(function(row) {
                uniqueErrorRows[row] = true;
            });
        }
        var invalidCount = Object.keys(uniqueErrorRows).length;

        console.log('Невалидных паролей (уникальных строк):', invalidCount);
        onAllPasswordsChecked(invalidCount);
    }

    function onAllPasswordsChecked(invalidCount) {
        console.log('Все пароли проверены, invalidCount =', invalidCount);
        var buttonsDiv = document.getElementById('validation-buttons');
        var hint = document.getElementById('info-hint');
        if (invalidCount > 0) {
            var warningList = [];
            for (var errType in passwordErrors) {
                var rowsStr = passwordErrors[errType].join(', ');
                warningList.push(errType + ' (строки: ' + rowsStr + ')');
            }

            var hintMessage = '⚠️ Обнаружены ошибки в паролях:<br>' + warningList.join('<br>') +
                '<br><strong>Пароль должен содержать минимум 8 символов, цифру, строчную, заглавную буквы и спецсимвол из набора: .,;:!?_-+/*@#&$.</strong><br>' +
                'Исправьте вручную или нажмите кнопку для автоматической генерации.';

            buttonsDiv.innerHTML = '<button type="button" id="fix-all-passwords-btn" class="btn btn-warning btn-lg">Сгенерировать пароли для всех проблемных</button>';
            document.getElementById('fix-all-passwords-btn').onclick = function() {
                console.log('Нажата кнопка массовой генерации паролей');
                fixAllInvalidPasswords();
            };
            hint.innerHTML = hintMessage;
        } else {
            hint.innerHTML = '✅ Все пароли корректны. Автоматически переходим к проверке курсов...';

            document.getElementById('mass-assign-container').style.display = 'block';
            // Устанавливаем режим both и обновляем текст кнопки
            window.Massenrol.massAssignMode = 'both';
            var massAssignBtn = document.getElementById('mass-assign-btn');
            if (massAssignBtn) {
                massAssignBtn.innerHTML = '<i class="icon fa fa-copy"></i> Изменить курсы/группы для выделенных строк';
            }
            setTimeout(updateMassAssignButton, 100);

            setTimeout(function() {
                if (window.Massenrol.runCoursesCheck) {
                    window.Massenrol.runCoursesCheck();
                } else {
                    console.error('Функция runCoursesCheck не найдена в window.Massenrol');
                    alert('Ошибка: функция проверки курсов не загружена.');
                }
            }, 500);
        }
    }

    function fixAllInvalidPasswords() {
        console.log('fixAllInvalidPasswords запущена');
        var data = spreadsheet.getData();
        var updatedData = [];
        var generatedCount = 0;

        for (var i = 0; i < data.length; i++) {
            var row = data[i].slice();
            var password = row[5] ? row[5].toString().trim() : '';
            console.log('Строка', i, 'текущий пароль:', password);
            if (password !== '********') {
                var res = validatePassword(password);
                if (!res.valid || !password) {
                    var newPassword = window.Massenrol.generatePassword();
                    console.log('Строка', i, 'генерируем новый пароль:', newPassword);
                    row[5] = newPassword;
                    generatedCount++;
                } else {
                    console.log('Строка', i, 'пароль уже валиден');
                }
            } else {
                console.log('Строка', i, 'пароль существующего пользователя (пропускаем)');
            }
            updatedData.push(row);
        }

        console.log('Сгенерировано новых паролей:', generatedCount);
        spreadsheet.setData(updatedData);

        setTimeout(function() {
            runPasswordCheck();
        }, 200);
    }

    // ========================================================================
    // Этап 7: Функции для работы с модальным окном поиска курсов
    // ========================================================================
    function openCourseSearchModal(rowIndex) {
        console.log(`🔘 [openCourseSearchModal] Открытие модального окна для строки ${rowIndex}`);
        var modal = jQuery('#courseSearchModal');
        var input = document.getElementById('courseSearchInput');
        var resultsDiv = document.getElementById('courseSearchResults');
        var emptyDiv = document.getElementById('courseSearchEmpty');
        var loadingDiv = document.getElementById('courseSearchLoading');

        if (!modal.length || !input || !resultsDiv) {
            console.error('❌ [openCourseSearchModal] Не найдены необходимые элементы DOM');
            return;
        }

        var footer = modal.find('.modal-footer');
        if (footer.length) {
            if (!document.getElementById('show-all-courses-btn')) {
                footer.prepend('<button type="button" class="btn btn-info" id="show-all-courses-btn">Показать все курсы</button>');
                console.log('Кнопка "Показать все курсы" добавлена в футер');
            }
        } else {
            console.warn('Футер не найден, кнопка не добавлена');
            var cancelBtn = modal.find('button[data-dismiss="modal"]');
            if (cancelBtn.length && !document.getElementById('show-all-courses-btn')) {
                cancelBtn.before('<button type="button" class="btn btn-info" id="show-all-courses-btn">Показать все курсы</button>');
                console.log('Кнопка добавлена перед кнопкой "Отмена"');
            }
        }

        resultsDiv.innerHTML = '';
        if (emptyDiv) emptyDiv.style.display = 'none';
        if (loadingDiv) loadingDiv.style.display = 'none';
        input.value = '';
        input.focus();

        modal.data('rowIndex', rowIndex);
        console.log(`   Сохранён rowIndex ${rowIndex} в модальном окне`);

        var searchTimeout = null;
        input.oninput = function() {
            var query = input.value.trim();
            console.log(`   Ввод: "${query}"`);
            if (searchTimeout) clearTimeout(searchTimeout);
            if (query.length < 2) {
                resultsDiv.innerHTML = '';
                if (emptyDiv) emptyDiv.style.display = 'none';
                return;
            }
            if (loadingDiv) loadingDiv.style.display = 'block';
            searchTimeout = setTimeout(function() {
                searchCourses(query, rowIndex);
            }, 300);
        };

        modal.modal('show');
    }

    function searchCourses(query, rowIndex) {
        console.log(`🔎 [searchCourses] Поиск курсов по запросу "${query}" для строки ${rowIndex}`);
        var url = 'ajax.php?action=list_courses&sesskey=' + encodeURIComponent(config.sesskey);
        var formData = new URLSearchParams();
        formData.append('search', query);
        formData.append('limit', 20);

        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData,
            credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(data => {
            console.log(`📦 [searchCourses] Получено ${data.courses ? data.courses.length : 0} курсов`);
            displayCourses(data.courses, rowIndex);
        })
        .catch(error => {
            console.error('❌ [searchCourses] Ошибка поиска курсов:', error);
            var loadingDiv = document.getElementById('courseSearchLoading');
            if (loadingDiv) loadingDiv.style.display = 'none';
        });
    }

    function loadAllCourses(rowIndex) {
        console.log(`📚 [loadAllCourses] Загрузка всех курсов для строки ${rowIndex}`);
        var resultsDiv = document.getElementById('courseSearchResults');
        var emptyDiv = document.getElementById('courseSearchEmpty');
        var loadingDiv = document.getElementById('courseSearchLoading');

        if (loadingDiv) loadingDiv.style.display = 'block';
        resultsDiv.innerHTML = '';

        var url = 'ajax.php?action=list_courses&sesskey=' + encodeURIComponent(config.sesskey);
        var formData = new URLSearchParams();
        formData.append('search', '');
        formData.append('limit', 100);

        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData,
            credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(data => {
            if (loadingDiv) loadingDiv.style.display = 'none';
            console.log(`📦 [loadAllCourses] Получено ${data.courses ? data.courses.length : 0} курсов`);
            displayCourses(data.courses, rowIndex);
        })
        .catch(error => {
            console.error('❌ [loadAllCourses] Ошибка загрузки всех курсов:', error);
            if (loadingDiv) loadingDiv.style.display = 'none';
        });
    }

    function displayCourses(courses, rowIndex) {
        var resultsDiv = document.getElementById('courseSearchResults');
        var emptyDiv = document.getElementById('courseSearchEmpty');
        var loadingDiv = document.getElementById('courseSearchLoading');

        if (!resultsDiv) return;
        resultsDiv.innerHTML = '';

        if (!courses || courses.length === 0) {
            if (emptyDiv) emptyDiv.style.display = 'block';
            return;
        }

        if (emptyDiv) emptyDiv.style.display = 'none';

        courses.forEach(function(course) {
            var div = document.createElement('div');
            div.className = 'list-group-item list-group-item-action';
            div.style.cursor = 'pointer';
            div.innerHTML = '<strong>' + course.shortname + '</strong> — ' + course.fullname;
            div.onclick = function() {
                console.log(`   Выбран курс: ${course.shortname} для строки ${rowIndex}`);
                selectCourse(rowIndex, course.shortname);
                jQuery('#courseSearchModal').modal('hide');
            };
            resultsDiv.appendChild(div);
        });

        if (loadingDiv) loadingDiv.style.display = 'none';
    }

    function selectCourse(rowIndex, shortname) {
        console.log(`✅ [selectCourse] Установка shortname "${shortname}" для строки ${rowIndex}`);
        spreadsheet.setValue(rowIndex, 6, shortname);
        if (window.Massenrol.checkCourse) {
            window.Massenrol.checkCourse(rowIndex, shortname);
        } else {
            console.warn('Функция checkCourse не найдена, отправляем запрос самостоятельно');
            checkCourseDirect(rowIndex, shortname);
        }
    }

    function checkCourseDirect(rowIndex, shortname) {
        console.log('Отправка прямого запроса checkCourse для строки', rowIndex, shortname);
        var url = 'ajax.php?action=check_course&sesskey=' + encodeURIComponent(config.sesskey);
        var formData = new URLSearchParams();
        formData.append('shortname', shortname);

        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData,
            credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(data => {
            var tr = spreadsheet.rows[rowIndex];
            if (tr) {
                var statusCell = tr.cells[STATUS_CELL_INDEX];
                if (statusCell) {
                    if (data.exists) {
                        tr.style.backgroundColor = '#d4edda';
                        statusCell.innerHTML += '<div style="color:green;">✅ Курс найден: ' + data.fullname + '</div>';
                    } else {
                        tr.style.backgroundColor = '#f8d7da';
                        statusCell.innerHTML += '<div style="color:red;">❌ ' + (data.message || 'Курс не найден') + '</div>';
                    }
                }
            }
        })
        .catch(error => {
            console.error('Ошибка прямой проверки курса:', error);
        });
    }

    // ========================================================================
    // Функция создания группы
    // ========================================================================
    function createGroup(rowIndex, courseid, groupname) {
        console.log('Создание группы через общую функцию', rowIndex, courseid, groupname);
        if (window.Massenrol.createSingleGroup) {
            window.Massenrol.createSingleGroup(rowIndex, courseid, groupname);
        } else {
            alert('Функция создания группы не загружена');
        }
    }

    // ========================================================================
    // Управление после проверки имён
    // ========================================================================
    function handleNamesSuccess() {
        var middlenameOk = window.Massenrol.validateAllMiddlenames();
        if (middlenameOk) {
            window.Massenrol.updateHint('✅ Имена и отчества корректны. Автоматически переходим к проверке пользователей...');
            setTimeout(function() {
                runUsersCheck();
            }, 500);
        } else {
            var warnings = window.Massenrol.collectMiddlenameWarnings();
            var warningList = [];
            for (var w in warnings) {
                var rowsStr = warnings[w].join(', ');
                warningList.push(w + ' (строки: ' + rowsStr + ')');
            }
            var hintMessage = '⚠️ Обнаружены ошибки:<br>' + warningList.join('<br>') + '<br><strong>Отчества не должны быть пустыми и могут содержать только русские буквы, пробелы и дефисы.</strong><br>' +
                          'Заполните пустые ячейки. Исправьте данные и нажмите «Перепроверить» или воспользуйтесь кнопкой «Разрешить любые символы в Отчестве» или воспользуйтесь кнопкой «Разрешить без Отчества».';
            showMiddlenameErrorButtons(warnings);
            window.Massenrol.updateHint(hintMessage);
        }
    }

    function showMiddlenameErrorButtons(warnings) {
        function buildMiddlenameHintMessage(warnings, warningList) {
            var base = '⚠️ Обнаружены ошибки:<br>' + warningList.join('<br>') + '<br>';
            var instructions = [];

            var hasEmpty = false;
            var hasSymbol = false;

            for (var key in warnings) {
                if (key.indexOf('не указано') !== -1) hasEmpty = true;
                if (key.indexOf('Недопустимые символы') !== -1) hasSymbol = true;
            }

            if (hasEmpty) {
                instructions.push('Отчества не должны быть пустыми. Заполните пустые ячейки или воспользуйтесь кнопкой «Разрешить без Отчества».');
            }
            if (hasSymbol) {
                instructions.push('Отчества могут содержать только русские буквы, пробелы и дефисы. Исправьте данные или воспользуйтесь кнопкой «Разрешить любые символы в Отчестве».');
            }

            if (instructions.length === 0) {
                instructions.push('Проверьте правильность заполнения отчеств.');
            }

            return base + instructions.join('<br>') + '<br>Исправьте данные и нажмите «Перепроверить».';
        }

        var buttonsDiv = document.getElementById('validation-buttons');
        var hasSymbolIssues = window.Massenrol.hasMiddlenameSymbolErrors(warnings);
        var buttonsHtml = '';
        if (hasSymbolIssues && !window.Massenrol.ignoreMiddlenameSymbols) {
            buttonsHtml += '<button type="button" id="allow-any-symbols-mid-btn" class="btn btn-outline-warning btn-lg mr-2">Разрешить любые символы в Отчестве</button>';
        }
        var hasEmptyWarnings = false;
        for (var w in warnings) {
            if (w.indexOf('не указано') !== -1) { hasEmptyWarnings = true; break; }
        }
        if (hasEmptyWarnings) {
            buttonsHtml += '<button type="button" id="ignore-middlename-btn" class="btn btn-warning btn-lg mr-2">Разрешить без Отчества</button>';
        }
        buttonsHtml += '<button type="button" id="recheck-middlename-btn" class="btn btn-info btn-lg">Перепроверить</button>';
        buttonsDiv.innerHTML = buttonsHtml;

        if (hasSymbolIssues && !window.Massenrol.ignoreMiddlenameSymbols) {
            document.getElementById('allow-any-symbols-mid-btn').onclick = function() {
                window.Massenrol.ignoreMiddlenameSymbols = true;
                var middlenameOk = window.Massenrol.validateAllMiddlenames();
                if (middlenameOk) {
                    window.Massenrol.updateHint('✅ Имена и отчества корректны. Автоматически переходим к проверке пользователей...');
                    setTimeout(function() {
                        runUsersCheck();
                    }, 500);
                } else {
                    var newWarnings = window.Massenrol.collectMiddlenameWarnings();
                    var warningList = [];
                    for (var w in newWarnings) {
                        var rowsStr = newWarnings[w].join(', ');
                        warningList.push(w + ' (строки: ' + rowsStr + ')');
                    }
                    var hintMessage = buildMiddlenameHintMessage(newWarnings, warningList);
                    showMiddlenameErrorButtons(newWarnings);
                    window.Massenrol.updateHint(hintMessage);
                }
            };
        }
        if (hasEmptyWarnings) {
            document.getElementById('ignore-middlename-btn').onclick = function() {
                var data = spreadsheet.getData();
                for (var i = 0; i < data.length; i++) {
                    if (!data[i][2] || data[i][2].toString().trim() === '') {
                        window.Massenrol.ignoreMiddlename[i] = true;
                    }
                }
                var middlenameOk = window.Massenrol.validateAllMiddlenames();
                if (middlenameOk) {
                    window.Massenrol.updateHint('✅ Отчества проигнорированы. Автоматически переходим к проверке пользователей...');
                    setTimeout(function() {
                        runUsersCheck();
                    }, 500);
                } else {
                    var newWarnings = window.Massenrol.collectMiddlenameWarnings();
                    var warningList = [];
                    for (var w in newWarnings) {
                        var rowsStr = newWarnings[w].join(', ');
                        warningList.push(w + ' (строки: ' + rowsStr + ')');
                    }
                    var hintMessage = buildMiddlenameHintMessage(newWarnings, warningList);
                    showMiddlenameErrorButtons(newWarnings);
                    window.Massenrol.updateHint(hintMessage);
                }
            };
        }
        document.getElementById('recheck-middlename-btn').onclick = function() {
            var middlenameOk = window.Massenrol.validateAllMiddlenames();
            if (middlenameOk) {
                window.Massenrol.updateHint('✅ Имена и отчества корректны. Автоматически переходим к проверке пользователей...');
                setTimeout(function() {
                    runUsersCheck();
                }, 500);
            } else {
                var newWarnings = window.Massenrol.collectMiddlenameWarnings();
                var warningList = [];
                for (var w in newWarnings) {
                    var rowsStr = newWarnings[w].join(', ');
                    warningList.push(w + ' (строки: ' + rowsStr + ')');
                }
                var hintMessage = buildMiddlenameHintMessage(newWarnings, warningList);
                showMiddlenameErrorButtons(newWarnings);
                window.Massenrol.updateHint(hintMessage);
            }
        };
    }

    function runNamesCheck() {
        console.log('🔍 Проверка имён...');
        var namesOk = window.Massenrol.validateAllNames();
        if (namesOk) {
            handleNamesSuccess();
        } else {
            var errors = window.Massenrol.collectNameErrors();
            var errorList = [];
            for (var err in errors) {
                var rowsStr = errors[err].join(', ');
                errorList.push(err + ' (строки: ' + rowsStr + ')');
            }
            var hasSymbolIssues = window.Massenrol.hasSymbolErrors(errors);
            var hintMessage = '❌ Ошибки:<br>' + errorList.join('<br>') + '<br><strong>Фамилия и имя не должны быть пустыми и могут содержать только русские буквы, пробелы и дефисы.</strong><br>' +
    'Заполните пустые ячейки. Исправьте данные и нажмите «Перепроверить» или воспользуйтесь кнопкой «Разрешить любые символы».';
            var buttonsHtml = '';
            if (hasSymbolIssues && !window.Massenrol.ignoreNameSymbols) {
                buttonsHtml += '<button type="button" id="allow-any-symbols-btn" class="btn btn-outline-warning btn-lg mr-2">Разрешить любые символы</button>';
            }
            buttonsHtml += '<button type="button" id="recheck-names-btn" class="btn btn-danger btn-lg">Перепроверить</button>';
            document.getElementById('validation-buttons').innerHTML = buttonsHtml;
            if (hasSymbolIssues && !window.Massenrol.ignoreNameSymbols) {
                document.getElementById('allow-any-symbols-btn').onclick = function() {
                    window.Massenrol.ignoreNameSymbols = true;
                    runNamesCheck();
                };
            }
            document.getElementById('recheck-names-btn').onclick = function() { runNamesCheck(); };
            window.Massenrol.updateHint(hintMessage);
        }
    }

    // ========================================================================
    // Обработчики статических кнопок
    // ========================================================================
    document.getElementById('check-btn').addEventListener('click', function() {
        console.log('🔍 Проверка данных нажата');
        window.Massenrol.ignoreNameSymbols = false;
        window.Massenrol.ignoreMiddlenameSymbols = false;
        window.Massenrol.ignoreMiddlename = [];

        // Сбрасываем режим массового назначения на both и текст кнопки
        window.Massenrol.massAssignMode = 'both';
        var massAssignBtn = document.getElementById('mass-assign-btn');
        if (massAssignBtn) {
            massAssignBtn.innerHTML = '<i class="icon fa fa-copy"></i> Изменить курсы/группы для выделенных строк';
        }

        if (!window.Massenrol.removeEmptyRows()) return;

        // Проверка на дубликаты (функция должна быть в validation.js)
        if (window.Massenrol.checkDuplicatesInTable && !window.Massenrol.checkDuplicatesInTable()) {
            return;
        }

        var addRowsPanel = document.getElementById('add-rows-panel');
        if (addRowsPanel) { addRowsPanel.style.cssText = 'display: none !important'; addRowsPanel.classList.add('d-none'); }
        var addRowsPanelX = document.getElementById('add-rows-panel-x');
        if (addRowsPanelX) { addRowsPanelX.style.cssText = 'display: none !important'; addRowsPanelX.classList.add('d-none'); }
        var checkBtnContainer = document.getElementById('check-btn-container');
        if (checkBtnContainer) { checkBtnContainer.style.cssText = 'display: none !important'; checkBtnContainer.classList.add('d-none'); }
        
        runNamesCheck();
    });

    document.getElementById('add-rows-btn').addEventListener('click', function() {
        var num = parseInt(document.getElementById('rows-to-add').value, 10) || 1;
        spreadsheet.insertRow(num);
    });

    document.getElementById('clear-table').addEventListener('click', function() {
        if (confirm(config.strings.confirmclear)) {
            var rowCount = spreadsheet.getData().length;
            var emptyData = [];
            for (var i = 0; i < rowCount; i++) {
                emptyData.push(['', '', '', '', '', '', '', '', '']);
            }
            spreadsheet.setData(emptyData);

            userCheckResults = {};
            loginCheckResults = {};
            emailCheckResults = {};
            window.Massenrol.userCheckResults = {};
            window.Massenrol.courseCheckResults = {};
            window.Massenrol.ignoreMiddlename = [];
            window.Massenrol.ignoreNameSymbols = false;
            window.Massenrol.ignoreMiddlenameSymbols = false;

            // Сбрасываем режим массового назначения
            window.Massenrol.massAssignMode = 'both';
            var massAssignBtn = document.getElementById('mass-assign-btn');
            if (massAssignBtn) {
                massAssignBtn.innerHTML = '<i class="icon fa fa-copy"></i> Изменить курсы/группы для выделенных строк';
            }

            var url = 'save_step.php?action=save_draft&sesskey=' + encodeURIComponent(config.sesskey);
            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emptyData),
                credentials: 'same-origin'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.href = window.location.pathname + '?reset=' + Date.now();
                } else {
                    alert('Ошибка при очистке: ' + (data.error || 'Неизвестная ошибка'));
                    window.location.reload();
                }
            })
            .catch(error => {
                console.error('Ошибка при очистке:', error);
                alert('Ошибка соединения при очистке. Страница будет перезагружена.');
                window.location.reload();
            });
        }
    });

    document.getElementById('undo-btn').addEventListener('click', function() {
        if (spreadsheet) spreadsheet.undo();
    });

    window.fixPassword = function(rowIndex) {
        if (spreadsheet) {
            var newPassword = window.Massenrol.generatePassword();
            spreadsheet.setValue(rowIndex, 5, newPassword);
        }
    };

    if (config.savedData && config.savedData.step) {
        var containers = document.querySelectorAll('.step-container');
        for (var i = 0; i < containers.length; i++) {
            containers[i].style.display = 'none';
        }
        document.getElementById('step' + config.savedData.step + '-container').style.display = 'block';
    }

    console.log('Massenrol основной готов');
})();