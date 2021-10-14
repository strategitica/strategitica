import $ from 'jquery';
import * as Utils from './utils.js';
import { Task } from './task.js';
import md from 'habitica-markdown';

/**
 * Uses the Habitica API to complete a task.
 * 
 * @param {string} taskId - The task ID
 * @param {User} user - The user the task belongs to
 * @see {@link https://habitica.com/apidoc/#api-Task-ScoreTask|Task - Score a task}
 */
export function complete(taskId, user, onComplete) {
    var task = null;
    if (taskId in user.tasks) {
        task = new Task(user.tasks[taskId], user);
        task.create();
    }

    if (task !== null) {
        try {
            $.ajax({
                url: 'https://habitica.com/api/v3/tasks/' + taskId + '/score/up',
                type: 'POST',
                dataType: 'json',
                contentType: 'application/json',
                cache: false,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('x-client', Utils.appClient);
                    xhr.setRequestHeader('x-api-user', user.id);
                    xhr.setRequestHeader('x-api-key', user.token);
                }
            })
                .done(function (data) {
                    let result = data.data;
                    
                    if ('_tmp' in result) {
                        if ('drop' in result._tmp) {
                            if ('dialog' in result._tmp.drop) {
                                $('body').append('<div id="task-' + taskId + '-completed-message">' + result._tmp.drop.dialog + '</div>');
                            }
                        }
                    }

                    if (onComplete) {
                        onComplete();
                    }
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    $('#strategitica-task-progress').addClass('d-none');
                    $('#modal-task').modal('hide');
                    
                    let message = 'Couldn\'t complete ' + task.text + ': <br>' + jqXHR.status + ' Error';

                    if ('responseJSON' in jqXHR) {
                        if ('message' in jqXHR.responseJSON) {
                            message += ' - ' + jqXHR.responseJSON.message;
                        }
                    }
                    
                    Utils.updateLogs('Error: ' + message, true);
                    Utils.updateToast('error', 'Error', message);
                });
        }
        catch (error) {
            $('#strategitica-task-progress').addClass('d-none');
            $('#modal-task').modal('hide');
            
            var message = 'Couldn\'t complete ' + task.text + ': <br>' + error.responseText;
            Utils.updateLogs('Error: ' + message, true);
            Utils.updateToast('error', 'Error', message);
        }
    }
    else {
        $('#strategitica-task-progress').addClass('d-none');
        $('#modal-task').modal('hide');
        
        var message = 'Error completing task: Couldn\'t find a task with ID ' + taskId + ', or that task ID isn\'t unique';
        Utils.updateLogs(message, true);
        Utils.updateToast('error', 'Error', message);
    }
}

/**
 * Hides the non-editing parts of the task modal and shows the editing parts.
 */
export function edit() {
    $('#task-controls1').addClass('d-none');
    $('#task-controls2').removeClass('d-none');

    $('#modal-task .task-param-editable-js').removeClass('d-none');
    $('#modal-task .task-param-static-js').addClass('d-none');
}

/**
 * Basically, the opposite of {@link edit}.
 */
export function editCancel() {
    $('#task-controls1').removeClass('d-none');
    $('#task-controls2').addClass('d-none');

    $('#modal-task .task-param-editable-js').addClass('d-none');
    $('#modal-task .task-param-static-js').removeClass('d-none');
}

/**
 * Uses the Habitica API to delete a task.
 * 
 * @param {string} taskId - The task ID
 * @param {User} user - The user the task belongs to
 * @see {@link https://habitica.com/apidoc/#api-Task-DeleteTask|Task - Delete a task}
 */
export function remove(taskId, user, onComplete) {
    if (confirm('Are you sure you want to delete this task?')) {
        var task = null;
        if (taskId in user.tasks) {
            task = new Task(user.tasks[taskId], user);
            task.create();
        }

        if (task !== null) {
            try {
                $.ajax({
                    url: 'https://habitica.com/api/v3/tasks/' + taskId,
                    method: 'DELETE',
                    dataType: 'json',
                    contentType: 'application/json',
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader('x-client', Utils.appClient);
                        xhr.setRequestHeader('x-api-user', user.id);
                        xhr.setRequestHeader('x-api-key', user.token);
                    }
                })
                    .done(function (data) {    
                        if (onComplete) {
                            onComplete();
                        }
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        $('#strategitica-task-progress').addClass('d-none');
                        $('#modal-task').modal('hide');

                        let message = 'Couldn\'t delete task: <br>' + jqXHR.status + ' Error';
    
                        if ('responseJSON' in jqXHR) {
                            if ('message' in jqXHR.responseJSON) {
                                message += ' - ' + jqXHR.responseJSON.message;
                            }
                        }
    
                        $('#modal-task').modal('hide');
    
                        Utils.updateLogs('Error: ' + message, true);
                        Utils.updateToast('error', task.text, message);
                    });
            }
            catch (error) {
                $('#strategitica-task-progress').addClass('d-none');
                $('#modal-task').modal('hide');
    
                var message = 'Couldn\'t delete task: <br>' + error.responseText;
                Utils.updateLogs('Error: ' + message, true);
                Utils.updateToast('error', task.text, message);
            }
        }
        else {
            var message = 'Error deleting task: Couldn\'t find a task with ID ' + taskId + ', or that task ID isn\'t unique';
            Utils.updateLogs(message, true);
            Utils.updateToast('error', 'Error', message);
        }
    }
}

/**
 * Uses the Habitica API to update a task.
 * 
 * @param {Object} button - The button that called this function
 * @param {User} user - The user the task belongs to
 * @see {@link https://habitica.com/apidoc/#api-Task-UpdateTask|Task - Update a task}
 */
export function save(taskId, user, onComplete) {
    var isNewTask = taskId === 'new';
    var taskText = $('#task-text').val();

    if (taskText.trim() === '') {
        alert('The task title is required.');
    }
    else {
        var taskType = $('#task-type').val();
        var taskNotes = $('#task-notes').val();
        var taskDifficulty = parseFloat($('#task-difficulty').val());

        var taskParameters = {
            'text': taskText, // task title; required
            'notes': taskNotes,
            'priority': taskDifficulty,
            //'reminders': '', // will add this later
            //'streak: '', // will add this later
        };

        if (isNewTask) {
            taskParameters['type'] = taskType;
        }

        if (taskType === 'daily') {
            var taskStartDate = new Date($('#task-startdate').val() + 'T00:00:00');
            taskParameters['startDate'] = taskStartDate;

            var taskFrequency = $('#task-frequency').val();
            taskParameters['frequency'] = taskFrequency;

            var taskEveryX = Math.floor($('#task-everyx').val());
            taskParameters['everyX'] = taskEveryX;

            var isMonthlyDayOfMonth = taskFrequency === 'monthly' && $('#task-dayofmonth').is(':checked') ? true : false;
            var isMonthlyWeekOfMonth = taskFrequency === 'monthly' && $('#task-weekofmonth').is(':checked') ? true : false;

            var taskRepeat = {};

            if (isMonthlyDayOfMonth || isMonthlyWeekOfMonth) {
                taskRepeat = {
                    'm': taskStartDate.getDay() === 1 ? true : false,
                    't': taskStartDate.getDay() === 2 ? true : false,
                    'w': taskStartDate.getDay() === 3 ? true : false,
                    'th': taskStartDate.getDay() === 4 ? true : false,
                    'f': taskStartDate.getDay() === 5 ? true : false,
                    's': taskStartDate.getDay() === 6 ? true : false,
                    'su': taskStartDate.getDay() === 0 ? true : false
                };
            }
            else {
                taskRepeat = {
                    'm': $('#task-repeat-m').is(':checked') ? true : false,
                    't': $('#task-repeat-t').is(':checked') ? true : false,
                    'w': $('#task-repeat-w').is(':checked') ? true : false,
                    'th': $('#task-repeat-th').is(':checked') ? true : false,
                    'f': $('#task-repeat-f').is(':checked') ? true : false,
                    's': $('#task-repeat-s').is(':checked') ? true : false,
                    'su': $('#task-repeat-su').is(':checked') ? true : false
                };
            }

            taskParameters['repeat'] = taskRepeat;


            var taskDaysOfMonth = [];

            if (isMonthlyDayOfMonth) {
                taskDaysOfMonth[0] = taskStartDate.getDate();
            }

            taskParameters['daysOfMonth'] = taskDaysOfMonth;


            var taskWeeksOfMonth = [];

            if (isMonthlyWeekOfMonth) {
                if (taskStartDate.getDate() <= 7) {
                    taskWeeksOfMonth[0] = 0;
                }
                else if (taskStartDate.getDate() <= 14) {
                    taskWeeksOfMonth[0] = 1;
                }
                else if (taskStartDate.getDate() <= 21) {
                    taskWeeksOfMonth[0] = 2;
                }
                else if (taskStartDate.getDate() <= 28) {
                    taskWeeksOfMonth[0] = 3;
                }
                else if (taskStartDate.getDate() <= 31) {
                    taskWeeksOfMonth[0] = 4;
                }
            }

            taskParameters['weeksOfMonth'] = taskWeeksOfMonth;
        }
        else if (taskType === 'todo') {
            var taskDate = new Date($('#task-date').val() + 'T00:00:00');
            taskParameters['date'] = taskDate;
        }

        var taskTags = [];

        $('#modal-task input[type="checkbox"].task-tag-js:checked').each(function () {
            taskTags.push($(this).val());
        });

        taskParameters['tags'] = taskTags;

        try {
            $.ajax({
                url: 'https://habitica.com/api/v3/tasks/' + (isNewTask ? 'user' : taskId),
                type: isNewTask ? 'POST' : 'PUT',
                data: JSON.stringify(taskParameters),
                dataType: 'json',
                contentType: 'application/json',
                cache: false,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('x-client', Utils.appClient);
                    xhr.setRequestHeader('x-api-user', user.id);
                    xhr.setRequestHeader('x-api-key', user.token);
                }
            })
                .done(function (data) {
                    if (onComplete) {
                        onComplete();
                    }
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    $('#strategitica-task-progress').addClass('d-none');
                    $('#modal-task').modal('hide');

                    let message = 'Couldn\'t save ' + taskText + ': <br>' + jqXHR.status + ' Error';

                    if ('responseJSON' in jqXHR) {
                        if ('message' in jqXHR.responseJSON) {
                            message += ' - ' + jqXHR.responseJSON.message;
                        }
                    }

                    Utils.updateLogs('Error: ' + message, true);
                    Utils.updateToast('error', 'Error', message);
                });
        }
        catch (error) {
            $('#strategitica-task-progress').addClass('d-none');
            $('#modal-task').modal('hide');

            var message = 'Couldn\'t save ' + taskText + ': <br>' + error.responseText;
            Utils.updateLogs('Error: ' + message, true);
            Utils.updateToast('error', 'Error', message);
        }
    }
}

/**
 * Uses the Habitica API to check or uncheck a checklist item. Must be called
 * from a checkbox (or probably any interactive node really) with
 * data-taskid="[the task ID]", data-itemtitle="[the checklist item title]" and
 * data-itemid="[the checklist item ID]".
 * 
 * @param {Object} checkbox - The checkbox that called this function
 * @param {User} user - The user the task belongs to
 * @see {@link https://habitica.com/apidoc/#api-Task-ScoreChecklistItem|Task - Score a checklist item}
 */
export function scoreChecklistItem(checkbox, user, onComplete) {
    var taskId = checkbox.data('taskid');
    var itemTitle = checkbox.data('itemtitle');
    var itemId = checkbox.data('itemid');

    try {
        $.ajax({
            url: 'https://habitica.com/api/v3/tasks/' + taskId + '/checklist/' + itemId + '/score',
            method: 'POST',
            dataType: 'json',
            contentType: 'application/json',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('x-client', Utils.appClient);
                xhr.setRequestHeader('x-api-user', user.id);
                xhr.setRequestHeader('x-api-key', user.token);
            }
        })
            .done(function (data) {
                if (onComplete) {
                    onComplete();
                }
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                $('#strategitica-task-progress').addClass('d-none');
                $('#modal-task').modal('hide');

                let message = 'Couldn\'t score checklist item: <br>' + jqXHR.status + ' Error';

                if ('responseJSON' in jqXHR) {
                    if ('message' in jqXHR.responseJSON) {
                        message += ' - ' + jqXHR.responseJSON.message;
                    }
                }

                Utils.updateLogs('Error: ' + message, true);
                Utils.updateToast('error', itemTitle, message);
            });
    }
    catch (error) {
        $('#strategitica-task-progress').addClass('d-none');
        $('#modal-task').modal('hide');

        var message = 'Couldn\'t score checklist item: <br>' + error.responseText;
        Utils.updateLogs('Error: ' + message, true);
        Utils.updateToast('error', itemTitle, message);
    }
}

export function openModal(taskId, user) {
    var task = null;
    if (taskId === 'new') {
        task = new Task({
            id: taskId,
            text: 'New Task',
            type: 'daily',
            priority: 1,
            frequency: 'weekly',
            repeat: {
                'su': true,
                'm': true,
                't': true,
                'w': true,
                'th': true,
                'f': true,
                's': true
            },
            everyX: 1,
            tags: []
        }, user);
        task.create();
    }
    else {
        if (taskId in user.tasks) {
            task = new Task(user.tasks[taskId], user);
            task.create();
        }
    }

    if (task !== null) {
        var isNewTask = task.id === 'new';

        // Static changes here

        $('#modal-task-label').html(isNewTask ? 'New Task ' : $(md.render(task.text.trim())).html());
        $('#task-notes-static').html(md.render(task.notes.trim()));

        $('#task-checklist-static').empty();
        if (task.checklist != null) {
            if (task.checklist.length > 0) {
                $('#task-checklist-static').removeClass('d-none');
                task.checklist.forEach(function (value) {
                    $('#task-checklist-static').append(`
                        <li>
                            <div class="form-check">
                                <input class="form-check-input task-checklist-item-js" type="checkbox" value="" id="checklist-${value.id}"${value.completed === true ? ' checked' : ''} data-taskid="${task.id}" data-itemtitle="${value.text}" data-itemid="${value.id}">
                                <label class="form-check-label" for="checklist-${value.id}">${$(md.render(value.text.trim())).html()}</label>
                            </div>
                        </li>`);
                });
            }
            else {
                $('#task-checklist-static').addClass('d-none');
            }
        }
        else {
            $('#task-checklist-static').addClass('d-none');
        }


        $('#task-type-static').html(task.type === 'todo' ? 'To Do' : (task.type === 'daily' ? 'Daily' : ''));


        var difficultyHtml = 'Invalid';

        if (typeof task.priority === 'number') {
            var difficultyStar = '&#9733;';
            var difficultyContextClass = '';
            var difficultyStars = '';
            var difficultyName = '';

            if (task.priority < 1) {
                difficultyContextClass = 'difficulty1';
                difficultyStars = difficultyStar;
                difficultyName = 'Trivial';
            }
            else if (task.priority === 1) {
                difficultyContextClass = 'difficulty2';
                difficultyStars = difficultyStar + difficultyStar;
                difficultyName = 'Easy';
            }
            else if (task.priority === 1.5) {
                difficultyContextClass = 'difficulty3';
                difficultyStars = difficultyStar + difficultyStar + difficultyStar;
                difficultyName = 'Medium';
            }
            else if (task.priority >= 2) {
                difficultyContextClass = 'difficulty4';
                difficultyStars = difficultyStar + difficultyStar + difficultyStar + difficultyStar;
                difficultyName = 'Hard';
            }

            if (difficultyContextClass != '') {
                difficultyHtml = '<span class="badge badge-' + difficultyContextClass + '">' + difficultyStars + '</span> ' + difficultyName;
            }
        }

        $('#task-difficulty-static').html(difficultyHtml);

        var taskFrequency = task.frequencyFormatted();
        if (taskFrequency != '') {
            $('#task-frequency-static-container').removeClass('d-none');
            $('#task-frequency-static').html(taskFrequency);
        }
        else {
            $('#task-frequency-static-container').addClass('d-none');
            $('#task-frequency-static').html('');
        }
        

        $('#task-time-static').html(task.timeOfDay.charAt(0).toUpperCase() + task.timeOfDay.slice(1));


        var taskDuration = task.duration;
        if (taskDuration > 0) {
            $('#task-duration-static-container').removeClass('d-none');
            $('#task-duration-static').html(Utils.formatDuration(taskDuration));
        }
        else {
            $('#task-duration-static-container').addClass('d-none');
            $('#task-duration-static').html('');
        }


        if (Object.keys(user.tags).length > 0 && task.tags !== null && task.tags.length > 0) {
            $('#task-tags-static').empty();
            task.tags.forEach(function (value) {
                $('#task-tags-static').append('<span class="badge badge-pill badge-light badge-tag">' + $(md.render(user.tags[value].trim())).html() + '</span> ');
            });
        }
        else {
            $('#task-tags-static').html('None');
        }



        // Editable changes here

        $('#task-text').val(task.text ? task.text : '');
        $('#task-type').val(task.type);
        $('#task-notes').val(task.notes.trim());

        $('#task-difficulty option:selected').prop('selected', false);
        if (task.priority < 1) {
            $('#task-difficulty option[value="0.1"]').prop('selected', true);
        }
        else if (task.priority === 1) {
            $('#task-difficulty option[value="1"]').prop('selected', true);
        }
        else if (task.priority === 1.5) {
            $('#task-difficulty option[value="1.5"]').prop('selected', true);
        }
        else if (task.priority >= 2) {
            $('#task-difficulty option[value="2"]').prop('selected', true);
        }

        if (Object.keys(user.tags).length > 0) {
            if ($('#task-tags-container').is(':empty')) {
                Object.keys(user.tags).forEach(function (key) {
                    $('#task-tags-container').append(`
                    <div class="col-xs-12 col-sm-6">
                        <div class="form-check">
                            <input class="form-check-input task-tag-js" type="checkbox" id="task-tag-${key}" value="${key}">
                            <label class="form-check-label" for="task-tag-${key}">${$(md.render(user.tags[key].trim())).html()}</label>
                        </div>
                    </div>`);
                });
            }

            $('.task-tag-js').prop('checked', false);

            task.tags.forEach(function (value) {
                $('#task-tag-' + value).prop('checked', true);
            });
        }

        if (task.type === 'daily') {
            $('#task-startdate-container').removeClass('d-none');
            $('#task-startdate').val(task.startDate ? Utils.getDateKey(new Date(task.startDate)) : Utils.getDateKey(new Date()));

            $('#task-date-container').addClass('d-none');
            $('#task-date').val('');

            $('#task-frequency-container').removeClass('d-none');
            $('#task-frequency option:selected').prop('selected', false);
            if (task.frequency === 'daily') {
                $('#task-frequency option[value="daily"]').prop('selected', true);
            }
            else if (task.frequency === 'weekly') {
                $('#task-frequency option[value="weekly"]').prop('selected', true);
            }
            else if (task.frequency === 'monthly') {
                $('#task-frequency option[value="monthly"]').prop('selected', true);
            }
            else if (task.frequency === 'yearly') {
                $('#task-frequency option[value="yearly"]').prop('selected', true);
            }

            $('#task-everyx-container').removeClass('d-none');
            $('#task-everyx').val(task.everyX);
            $('#task-everyx-addon').html(Utils.frequencyPlurals[task.frequency]);

            $('#task-repeat-m, #task-repeat-t, #task-repeat-w, #task-repeat-th, #task-repeat-f, #task-repeat-s, #task-repeat-su').prop('checked', false);
            if (task.frequency === 'weekly') {
                $('#task-repeat-container').removeClass('d-none');

                if (task.repeat['m'] === true) {
                    $('#task-repeat-m').prop('checked', true);
                }
                if (task.repeat['t'] === true) {
                    $('#task-repeat-t').prop('checked', true);
                }
                if (task.repeat['w'] === true) {
                    $('#task-repeat-w').prop('checked', true);
                }
                if (task.repeat['th'] === true) {
                    $('#task-repeat-th').prop('checked', true);
                }
                if (task.repeat['f'] === true) {
                    $('#task-repeat-f').prop('checked', true);
                }
                if (task.repeat['s'] === true) {
                    $('#task-repeat-s').prop('checked', true);
                }
                if (task.repeat['su'] === true) {
                    $('#task-repeat-su').prop('checked', true);
                }
            }
            else {
                $('#task-repeat-container').addClass('d-none');
            }

            $('[name="task-dayofweekmonth"]').prop('checked', false);
            if (task.frequency === 'monthly') {
                $('#task-daysweeksofmonth-container').removeClass('d-none');
                if (task.daysOfMonth && task.daysOfMonth.length > 0) {
                    $('#task-dayofmonth').prop('checked', true);
                }
                if (task.weeksOfMonth && task.weeksOfMonth.length > 0) {
                    $('#task-weekofmonth').prop('checked', true);
                }
            }
            else {
                $('#task-daysweeksofmonth-container').addClass('d-none');
            }
        }
        else if (task.type === 'todo') {
            $('#task-startdate-container').addClass('d-none');
            $('#task-startdate').val('');

            $('#task-date-container').removeClass('d-none');
            $('#task-date').val(task.date ? Utils.getDateKey(new Date(task.date)) : Utils.getDateKey(new Date()));

            $('#task-frequency-container').addClass('d-none');
            $('#task-frequency option:selected').prop('selected', false);

            $('#task-everyx-container').addClass('d-none');
            $('#task-everyx').val('');

            $('#task-repeat-container').addClass('d-none');
            $('#task-repeat-m, #task-repeat-t, #task-repeat-w, #task-repeat-th, #task-repeat-f, #task-repeat-s, #task-repeat-su').prop('checked', false);

            $('#task-daysweeksofmonth-container').addClass('d-none');
            $('[name="task-dayofweekmonth"]').prop('checked', false);
        }



        // Button changes here

        $('#task-complete, #task-delete, #task-save').data('taskid', task.id);
        $('#task-save').data('new', isNewTask);
        if (isNewTask) {
            $('#task-edit-cancel').addClass('d-none');
        }
        else {
            $('#task-edit-cancel').removeClass('d-none');
        }

        $('#modal-task').modal('show');
    }
    else {
        var message = 'Error opening task modal: Couldn\'t find a task with ID ' + taskId + ', or that task ID isn\'t unique';
        Utils.updateLogs(message, true);
        Utils.updateToast('error', 'Error', message);
    }
}