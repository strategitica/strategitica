import $ from 'jquery';

export const appClient = '88aa06bb-ec69-43d8-b58a-e6df4aa608ac-Strategitica';

export const monthNames = [
    ['January', 'Jan'],
    ['February', 'Feb'],
    ['March', 'Mar'],
    ['April', 'Apr'],
    ['May', 'May'],
    ['June', 'Jun'],
    ['July', 'Jul'],
    ['August', 'Aug'],
    ['September', 'Sep'],
    ['October', 'Oct'],
    ['November', 'Nov'],
    ['December', 'Dec']
];

export const frequencyPlurals = {
    'daily': 'day(s)',
    'weekly': 'week(s)',
    'monthly': 'month(s)',
    'yearly': 'year(s)'
};

// debulked onresize handler
export function onResize(c,t){onresize=function(){clearTimeout(t);t=setTimeout(c,100)};return c};

/**
 * Gets a URL parameter by its name.
 * @param {string} name - The parameter name
 */
export function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

export const showLogs = getUrlParameter('logs') === 'true';

let calendarDaysLimitFromParam = parseInt(getUrlParameter('days'));
let calendarDaysLimitMax = 180;
let calendarDaysLimitTemp = 90; // [1]

if (!isNaN(calendarDaysLimitFromParam)) {
    if (calendarDaysLimitFromParam > calendarDaysLimitMax) {
        updateLogs('Custom days limit (' + calendarDaysLimitFromParam + ') exceeds the maximum allowed (' + calendarDaysLimitMax + '); the default days limit will be used (' + calendarDaysLimitTemp + ')');
    }
    else {
        if (calendarDaysLimitFromParam < 0) {
            updateLogs('Custom days limit (' + calendarDaysLimitFromParam + ') cannot be less than zero; the default days limit will be used (' + calendarDaysLimitTemp + ')');
        }
        else {
            updateLogs('Custom days limit recognized (' + calendarDaysLimitFromParam + ')');
            calendarDaysLimitTemp = calendarDaysLimitFromParam; // [1]
        }
    }
}

export const calendarDaysLimit = calendarDaysLimitTemp;

export function escapeQuotes(string) {
    return string.replace(/'/g, '&apos;').replace(/"/g, '&quot;');
}

export function escapeHtmlBrackets(string) {
    return string.replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

/**
 * You can't just output a Date variable in JS and expect it to look readable,
 * and for debugging purposes, I want things to be readable. So this is here to
 * create understandable keys for the big fat date/task object in
 * {@link loadCalendar}. Also, I needed dates to be formatted in a way that an
 * input element with type="date" could work with.
 * @param {Date} date 
 * @returns {string} A readable version of a given date
 */
export function getDateKey(date) {
    return date.getUTCFullYear() + '-' + (date.getUTCMonth() <= 8 ? '0' : '') + (date.getUTCMonth() + 1) + '-' + (date.getUTCDate() <= 9 ? '0' : '') + date.getUTCDate();
}

/**
 * Gets the ordinal of a given number, e.g. the ordinal for 1 is "st", the
 * ordinal for 12 is "th", etc.
 * @param {number} number 
 * @returns {string} The ordinal
 */
export function getNumberOrdinal(number) {
    var numberAsString = number.toString();
    var ordinal = '';

    if (numberAsString.endsWith('11') || numberAsString.endsWith('12') || numberAsString.endsWith('13')) {
        ordinal = 'th';
    }
    else if (numberAsString.endsWith('1')) {
        ordinal = 'st';
    }
    else if (numberAsString.endsWith('2')) {
        ordinal = 'nd';
    }
    else if (numberAsString.endsWith('3')) {
        ordinal = 'rd';
    }
    else {
        ordinal = 'th';
    }

    return ordinal;
}

/**
 * Ahem, uh, in case you didn't know, some months have 30 days, some have 31...
 * some even have 28 or 29! This determines what the last day of the month is
 * for a given month and year.
 * @param {number} year - The year, i.e. 2020
 * @param {number} month - The month, e.g. 0 for January, 1 for February, etc.
 * @returns {number} The last day of the given month and year, e.g. 31
 */
export function getLastDayOfMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

export function formatDuration(durationInMinutes) {
    var durationFormatted = '';

    if (durationInMinutes >= 60) {
        var durationInHours = durationInMinutes / 60;

        durationFormatted = (durationInHours % 1 === 0 ? durationInHours : durationInHours.toFixed(1)) + 'h';
    }
    else {
        durationFormatted = durationInMinutes + 'm';
    }

    return durationFormatted;
}

export function updateToast(type, title, body, toastToHide) {
    var el = $('#strategitica-toast-' + type);
    el.find('.toast-title-js').html(escapeHtmlBrackets(escapeQuotes(title)));
    el.find('.toast-body-js').html(escapeHtmlBrackets(escapeQuotes(body)));

    el.toast('show');

    if (toastToHide) {
        var el2 = $('#strategitica-toast-' + toastToHide);
        el2.toast('hide');
    }
}

export function updateLogs(text, isError) {
    if (showLogs || isError) {
        var contextClasses = '';

        if (isError) {
            contextClasses += 'bg-danger text-light';
        }
        else  {
            contextClasses += 'bg-dark text-light'
        }
    
        var now = new Date();
        var timestamp = $('<span class="pr-1">[' + (now.getHours() < 10 ? '0' : '') + now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes() + ':' + (now.getSeconds() < 10 ? '0' : '') + now.getSeconds() + ']</span> ');
        
        var textContainer = $('<code class="media px-1 ' + contextClasses + '" />')
        var mediaBody = $('<div class="media-body" />');
    
        mediaBody.append(text);
        textContainer.append(timestamp);
        textContainer.append(mediaBody);
        $('.strategitica-logs-js').append(textContainer);
    }
}