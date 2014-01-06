var COOKIE_CURRENT_LAP = "currentLap";
var HOUR = 3600;
var MILLISECONDS = 1000;
var UPDATE_INTERVAL = 500;
var currentGoalLength = 0;
var currentDailyProgress = 0;

/*
 Parse.com constants
 */
var WEEKLY_GOAL_TYPE = "WEEKLY";
var MONTHLY_GOAL_TYPE = "MONTHLY";
var DAILY_GOAL_TYPE = "DAILY";

// TODO: wrap in a cookie Handler object - when I learn OO!
/*
 ================
 Cookie functions
 ================
 */
function createCookie(name, value) {
    var exdays = 365;
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + exdays);
    value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
    document.cookie = name + "=" + value;
}
function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}
function eraseCookie(name) {
    createCookie(name, "", -1);
}

/*
 ================
 Stopwatch class
 ================
 */
var clsStopwatch = function () {
    // Private vars
    var startAt = 0;	// Time of last start / resume. (0 if not running)
    var lapTime = 0;	// Time on the clock when last stopped in milliseconds

    var now = function () {
        return (new Date()).getTime();
    };

    // Public methods
    // Start or resume
    this.start = function () {
        startAt = startAt ? startAt : now();
    };

    // Stop or pause
    this.stop = function () {
        // If running, update elapsed time otherwise keep it
        lapTime = startAt ? lapTime + now() - startAt : lapTime;
        startAt = 0; // Paused
    };

    // Reset
    this.reset = function () {
        lapTime = startAt = 0;
    };

    // Duration
    this.time = function () {
        return lapTime + (startAt ? now() - startAt : 0);
    };

    this.setLapTime = function (newLap) {
        //startAt=now();
        lapTime = parseInt(newLap);
    }
};

var x = new clsStopwatch();
var time;
var clocktimer;
/*
 ===========================
 Stopwatch related functions
 ===========================
 */
function stop() {


    x.stop();

    clearInterval(clocktimer);

    eraseCookie(COOKIE_CURRENT_LAP);

    reset();


}
function reset() {
    x.reset();
    update();
}
function update() {
    time.innerHTML = formatTime(x.time());
    currentDailyProgress += (UPDATE_INTERVAL / 1000);
    updateProgressBar();
    createCookie(COOKIE_CURRENT_LAP, x.time());
}

function updateProgressBar() {

    var percentage = ((currentDailyProgress / currentGoalLength) * 100);
    percentage = Math.ceil(percentage * 10) / 10;
    percentage = (!isNaN(percentage) && percentage != Infinity) ? percentage : 0;
    //percentage = percentage > 100 ? 100 : percentage;

    $("#timerProgressBar").progressbar("option", "value", percentage);
    //  $( "#progressLabel").text( $( "#timerProgressBar").progressbar( "option","value" ) + "%" );
}

function start() {

    var button = document.getElementById("startButton");

    if (button.innerHTML == "Start") {
        clocktimer = setInterval("update()", UPDATE_INTERVAL);
        x.start();
    }
    else {
        var howLong = document.getElementById("time").innerHTML;

        saveLap(timeStringToSeconds($('#time').text()), '#startButton');

        stop();
    }

    var newVal = button.innerHTML == "Start" ? "Stop" : "Start";
    button.innerHTML = newVal;
}

function saveLap(value, jqueryPressedElement, callback, isManual) {

    if (value > 0) {
        toggleLoading(jqueryPressedElement);
        var TestObject = Parse.Object.extend("Laps");
        var testObject = new TestObject();
        isManual = isManual ? isManual : false;
        testObject.save({length: value, date: getShortDate(), isManualLap: isManual}).then(function () {
            toggleLoading(jqueryPressedElement);
            updateAllObjects();
            if (callback) {
                callback()
            }
            ;
        });
    }
}

function updateAllObjects() {
    //buildWeekTable();
    //updateProgressBar();
    updateDashboard();
    areAllGoalsSet().then(function (value) {
        if (value === true) {
            $("#center_section").slideDown();
        }
    })
    chart();
}

/*
 ================
 Util functions
 ================
 */

function dividedValueToPercentage(val) {
    var percentage = val * 100;
    percentage = Math.ceil(percentage * 10) / 10;
    percentage = (!isNaN(percentage) && percentage != Infinity) ? percentage + "%" : "0%";
    return percentage;
}

function pad(num, size) {
    var s = "0000" + num;
    return s.substr(s.length - size);
}

function formatTime(time) {
    var h = m = s = ms = 0;
    var newTime = '';

    h = Math.floor(time / (60 * 60 * 1000));
    time = time % (60 * 60 * 1000);
    m = Math.floor(time / (60 * 1000));
    time = time % (60 * 1000);
    s = Math.floor(time / 1000);

    newTime = pad(h, 2) + ':' + pad(m, 2) + ':' + pad(s, 2);
    return newTime;
}

function getShortDate(date) {

    if (!date) {
        date = new Date();
    }

    var dd = date.getDate();
    var mm = date.getMonth() + 1; //January is 0!
    var yyyy = date.getFullYear();
    if (dd < 10) {
        dd = '0' + dd
    }
    if (mm < 10) {
        mm = '0' + mm
    }
    date = mm + '/' + dd + '/' + yyyy;
    return date;
}

function timeStringToSeconds(string) {
    var number;

    var hours = parseInt(string.split(":")[0]);
    var minutes = parseInt(string.split(":")[1]);
    var seconds = parseInt(string.split(":")[2]);
    seconds = seconds || 0;

    number = (hours * 3600) + (minutes * 60) + seconds;

    return parseInt(number);

}

function secondsToString(time) {
    var h = m = s = ms = 0;
    var newTime = '';

    h = Math.floor(time / (60 * 60));
    time = time % (60 * 60);
    m = Math.floor(time / (60));
    time = time % (60 );
    s = Math.floor(time);

    newTime = pad(h, 2) + ':' + pad(m, 2) + ':' + pad(s, 2);
    return newTime;
}
// date - a Date object
// offset - an amount in seconds to subtract or add to the time
function dateObjectToHHMM(date, offset) {
    date = offset ? (new Date(date - offset * 1000)) : date;
    var hours = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
    var minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
    return hours + ":" + minutes;
}

function initParse() {
    if (document.title == "Test") {
        Parse.initialize("75yStvvNmep3ZhsC5VAtMBSUGjoECMmmNI7aHxTK", "BZxsbuz6tYffL4Ld09pO5tswvBVrvVLoROezGlpR");
    }
    else {
        Parse.initialize("vnkcS0pKaV0JYhW37n7DI2JPpiAftf5b6WmXM0Kw", "bzqGddUaGZc7cjsp7RxJfsOVMQVFXGCMiKzxbZz5");
    }
}

function test(string) {
    document.getElementById('todayDate').innerHTML += ";" + string;
}

function findFirstDateInTheWeek(date) {

    date = new Date(date);

    while (date.getDay() != 0) {
        date.setDate(date.getDate() - 1);
    }

    return date;
}

function findFirstDateInMonth(date) {

    date = new Date(date);

    while (date.getDate() != 1) {
        date.setDate(date.getDate() - 1);
    }

    return date;
}

/*
 ================
 OnLoad
 ================
 */
function show() {


    initParse();
    chart();

    initDailyProgress();

    time = document.getElementById('time');

    // Restore unsaved lap if browser exited unexpectedly
    var unsavedLap = readCookie(COOKIE_CURRENT_LAP);
    if (unsavedLap > 0) {
        x.setLapTime(unsavedLap);
    }

    time.innerHTML = formatTime(x.time()); // set the timer initial time


    updateAllObjects();
}

function initDailyProgress() {

    var Laps = Parse.Object.extend("Laps");
    var query = new Parse.Query(Laps);
    query.equalTo("date", getShortDate());
    query.find().then(function (results) {
        var totalLength = 0;
        for (var i = 0; i < results.length; i++) {
            var object = results[i];
            totalLength += parseInt(object.get('length'));
        }

        currentDailyProgress = parseInt(totalLength);
    });
}

/*
 ================
 Weekly table
 ================

 function buildWeekTable() {

 //$('this_week_table_tbody').text('');
 toggleLoading('#this_week_table');
 var days = [];
 var counter = 0;
 var doQuery = function (currDate) {
 var day = {};
 day.date = currDate;
 day.length = 0;
 day.goal = 0;
 var Laps = Parse.Object.extend("Laps");
 var query = new Parse.Query(Laps);
 query.equalTo("date", currDate);
 query.find().then(function (results) {
 var totalLength = 0;
 for (var i = 0; i < results.length; i++) {
 var object = results[i];
 totalLength += parseInt(object.get('length'));
 }

 day.length = totalLength
 }
 ).then(function () {
 var DailyGoals = Parse.Object.extend("DailyGoals");
 var query = new Parse.Query(DailyGoals);
 query.equalTo("date", currDate);
 return query.find();

 }).then(function (results) {

 if (results[0]) {
 day.goal = parseInt(results[0].get("goal"));
 }
 else {
 day.goal = 0;
 }
 }).then(function () { // Retrieve the last and first lap date
 var Laps = Parse.Object.extend("Laps");
 var query = new Parse.Query(Laps);
 query.equalTo("date", currDate);
 query.ascending("createdAt");
 return query.first();
 })
 .then(function (object) {
 day.firstLap = object ? dateObjectToHHMM(object.createdAt, (object.get("length"))) : "00:00";
 })
 .then(function () {
 var Laps = Parse.Object.extend("Laps");
 var query = new Parse.Query(Laps);
 query.equalTo("date", currDate);
 query.descending("createdAt");
 return query.first();
 })
 .then(function (object) {
 day.lastLap = object ? dateObjectToHHMM(object.createdAt) : "00:00";
 }
 )
 .always(function () {
 counter++;
 days.push(day);
 if (counter === 7) {
 days.sort(function (a, b) {
 a = new Date(a.date);
 b = new Date(b.date);
 return a > b ? -1 : a < b ? 1 : 0;
 });
 days.sort();
 callbackBuildWeekTable(days);
 }
 });
 }

 for (var i = 6; i >= 0; i--) {
 date = getShortDate(i * -1);
 doQuery(date);
 }
 }
 function callbackBuildWeekTable(days) {
 var table = document.getElementById("this_week_table_tbody");
 table.innerHTML = "";
 var i, row, date, length, dayCell, lengthCell, goalCell, percentageCell, firstLapCell, lastLapCell;

 for (i = 0; i < days.length; i++) {

 var percentage = ((days[i].length / days[i].goal) * 100);
 percentage = Math.ceil(percentage * 10) / 10;
 percentage = (!isNaN(percentage) && percentage != Infinity) ? percentage + "%" : "0%";

 row = document.createElement('tr');
 dayCell = document.createElement('td');
 dayCell.appendChild(document.createTextNode(days[i].date));
 lengthCell = document.createElement('td');
 lengthCell.appendChild(document.createTextNode(secondsToString(days[i].length)));
 goalCell = document.createElement('td');
 goalCell.appendChild(document.createTextNode(secondsToString(days[i].goal)));
 percentageCell = document.createElement('td');
 percentageCell.appendChild(document.createTextNode(percentage));
 firstLapCell = document.createElement('td');
 firstLapCell.appendChild(document.createTextNode(days[i].firstLap));
 lastLapCell = document.createElement('td');
 lastLapCell.appendChild(document.createTextNode(days[i].lastLap));

 row.appendChild(dayCell);
 row.appendChild(lengthCell);
 row.appendChild(goalCell);
 row.appendChild(percentageCell);
 row.appendChild(firstLapCell);
 row.appendChild(lastLapCell);

 table.appendChild(row);
 }
 toggleLoading('#this_week_table');
 }

 */

/*
 ================
 All Goals
 ================
 */
function areAllGoalsSet() {

    var promise = $.Deferred();

    var answer = new Boolean(true);

    isDailyGoalSet()
        .then(function (value) {

            answer = answer && (value != undefined);

        })
        .then(isWeeklyGoalSet()
            .then(function (value) {
                answer = answer && (value != undefined);
            }))
        .then(isMonthlyGoalSet()
            .then(function (value) {
                answer = answer && (value != undefined);
                promise.resolve(answer);
            }));
    return promise;
}


function getGoalTime(value) {
    return secondsToString(value).substr(0, 5);
}
function isGoalSet(date, type) {
    var promise = $.Deferred();
    var parseGoal = Parse.Object.extend("Goals");
    var query = new Parse.Query(parseGoal);
    query.equalTo("date", date);
    query.equalTo("type", type);
    query.first().then(function (result) {
        promise.resolve(result);
    });
    return promise.promise();
}

function setGoal(date, type, length) {
    var parseGoal = Parse.Object.extend("Goals");
    var parseGoalRecord;

    var promise = $.Deferred();

    $.when(isGoalSet(date, type).done(function (value) {
        if (value) {
            parseGoalRecord = value;
            parseGoalRecord.set("goal", length);
        }
        else {
            parseGoalRecord = new parseGoal();
            parseGoalRecord.set("date", date);
            parseGoalRecord.set("goal", length);
            parseGoalRecord.set("type", type);
        }

        parseGoalRecord.save().then(function () {
            promise.resolve();
            updateAllObjects();
        });
    }));

    return promise.promise();
}


/*
 ================
 Daily Goal
 ================
 */

function setDailyGoal() {
    var goal = timeStringToSeconds($("#goalTime_day").text());
    var date = getShortDate();
    setGoal(date, DAILY_GOAL_TYPE, goal).then(function () {
        $("#setDailyGoalSection").hide();
    });
}

function isDailyGoalSet(date) {
    var promise = $.Deferred();
    date = date ? date: getShortDate();

    isGoalSet(date, DAILY_GOAL_TYPE).then(function (value) {
        promise.resolve(value);
        if (!value) {
            $("#setDailyGoalSection").show();
        }
        else {
            $("#goalTime_day").text(getGoalTime(value.get("goal")));
        }
    });

    return promise.promise();
}

/*
 ================
 Weekly Goal
 ================
 */
function setWeeklyGoal() {
    var goal = timeStringToSeconds($("#goalTime_week").text());
    var date = getShortDate(findFirstDateInTheWeek(getShortDate()));
    setGoal(date, WEEKLY_GOAL_TYPE, goal).then(function () {
        $("#setWeeklyGoalSection").hide();
    });
}

function isWeeklyGoalSet() {
    var promise = $.Deferred();

    var date = getShortDate(findFirstDateInTheWeek(getShortDate()));
    $.when(isGoalSet(date, WEEKLY_GOAL_TYPE).done(function (value) {
        promise.resolve(value);
        if (!value) {
            $("#setWeeklyGoalSection").show();
        }
        else {
            $("#goalTime_week").text(getGoalTime(value.get("goal")));
        }
    }));

    return promise.promise();
}

/*
 ================
 Monthly Goal
 ================
 */
function setMonthlyGoal() {
    var goal = timeStringToSeconds($("#goalTime_month").text());
    var date = getShortDate(findFirstDateInMonth(getShortDate()));
    setGoal(date, MONTHLY_GOAL_TYPE, goal).then(function () {
        $("#setMonthlyGoalSection").hide();
    });
}

function isMonthlyGoalSet() {
    var promise = $.Deferred();

    var date = getShortDate(findFirstDateInMonth(getShortDate()));
    $.when(isGoalSet(date, MONTHLY_GOAL_TYPE).done(function (value) {
        promise.resolve(value);
        if (!value) {
            $("#setMonthlyGoalSection").show();
        }
        else {
            $("#goalTime_month").text(getGoalTime(value.get("goal")));
        }
    }));

    return promise.promise();
}


/*
 =====
 OTHER
 =====
 */
function displayOtherTextBox() {
    document.getElementById("stopReasonButtons").style.display = "none";
    document.getElementById("otherTextBox").style.display = "inline";
}

function testButton() {
    var Laps = Parse.Object.extend("Laps");
    var query = new Parse.Query(Laps);
    query.equalTo("date", "12/16/2013");
    query.descending("createdAt");
    query.first().then(function (object) {
        console.log(object.createdAt);
    });
}

function getTotalLapLengthByDate(startDate, endDate) {

    var promise = $.Deferred();

    if (endDate === undefined || endDate === startDate) {
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
    }
    ;

    var Laps = Parse.Object.extend("Laps");
    var query = new Parse.Query(Laps);
    //query.equalTo("date", startDate);

    //alert("start: " + startDate + "; end: " + endDate);
    query.greaterThanOrEqualTo("createdAt", startDate);
    query.lessThanOrEqualTo("createdAt", endDate);
    query.limit(1000);

    query.find().then(function (results) {
        var totalLength = 0;

        //alert (results.length);
        for (var i = 0; i < results.length; i++) {
            var object = results[i];
            totalLength += parseInt(object.get('length'));
        }
        //alert("startDate: " + startDate + "totalLength: " + totalLength);
        promise.resolve(totalLength);
    });

    return promise.promise();
}

/*
 *  ----------------
 *  Dashboard
 *  ----------------
 * */


function updateDashboard() {

    var today = new Date(getShortDate());
    var todayEnd = new Date(getShortDate());
    todayEnd.setHours(23);
    todayEnd.setMinutes(59);

    // Update daily
    isDailyGoalSet().then(function () {
        toggleLoading('#dashboard_today_hours');
        getTotalLapLengthByDate(today, todayEnd).then(function (value) {
            $("#dashboard_today_hours").text(secondsToString(value).split(":")[0]);
            $("#dashboard_today_minutes").text(secondsToString(value).split(":")[1]);
            var dailyGoal = timeStringToSeconds($("#goalTime_day").text());
            var dailyGoalLeft = dailyGoal - value;
            $("#daily_goal_percentage").text(dividedValueToPercentage(value / dailyGoal));
            $("#goalTime_day_left").text(secondsToString(dailyGoalLeft).substr(0, 5));
            var bestPossibleTime = new Date()
            bestPossibleTime.setTime((dailyGoalLeft * MILLISECONDS) + bestPossibleTime.getTime());
            bestPossibleTime = dateObjectToHHMM(bestPossibleTime);
            $("#goalTime_day_best_time").text(bestPossibleTime);
            toggleLoading('#dashboard_today_hours');
        });
    });

    // Update weekly
    isWeeklyGoalSet().then(function () {
        toggleLoading('#dashboard_week_hours');
        getTotalLapLengthByDate(findFirstDateInTheWeek(today), todayEnd).then(function (value) {
            $("#dashboard_week_hours").text(secondsToString(value).split(":")[0]);
            $("#dashboard_week_minutes").text(secondsToString(value).split(":")[1]);
            var weeklyGoal = timeStringToSeconds($("#goalTime_week").text());
            $("#weekly_goal_percentage").text(dividedValueToPercentage(value / weeklyGoal));
            toggleLoading('#dashboard_week_hours');
        });
    });

    // Update monthly
    isMonthlyGoalSet().then(function () {
        toggleLoading('#dashboard_month_hours');
        getTotalLapLengthByDate(findFirstDateInMonth(today), todayEnd).then(function (value) {
            $("#dashboard_month_hours").text(secondsToString(value).split(":")[0]);
            $("#dashboard_month_minutes").text(secondsToString(value).split(":")[1]);
            var monthlyGoal = timeStringToSeconds($("#goalTime_month").text());
            $("#monthly_goal_percentage").text(dividedValueToPercentage(value / monthlyGoal));
            toggleLoading('#dashboard_month_hours');
        });
    });
}

function updateDashboardCallback(length) {

}

/*
 *  ----------------
 *  jQuery Functions
 *  ----------------
 * */

$(document).ready(function () {


    $("#updateDayGoal").click(function () {
        $('#updateDayGoalDiv').slideToggle();
        $(this).toggleClass("grayButton-sel").toggleClass('grayButton');
    });

    $('#addManualLap_Date').text(getShortDate());

    $('#addManualLapButton').click(function () {
        $('#addManualLapSection').slideToggle();
        $(this).toggleClass("button-sel").toggleClass('button');
    });

    $('#addManualLap_Save').click(function () {
        var manualLapLength = $('#manualLapSlider').slider("value");
        currentDailyProgress += manualLapLength;
        saveLap(manualLapLength, this, function () {
            $('#addManualLapButton').click()
        }, true);
    });

    $('.expandCollapseTitle').click(function () {
        $(this).next().slideToggle();
    });

    $(".goalTime").click(function () {
        $(this).next().toggle();
    });

    // Calls the setGoal function (d/w/m) respectively by the calling element
    $(".setGoalButton").click(function () {
        var fn = $(this).attr('id');
        fn = fn.replace('Button', '');
        window[fn]();
    });

    $(".chartButton").click(function () {
        $('.chartButton').removeClass('chartButtonSelected');
        $(this).addClass('chartButtonSelected');
    });

});

function toggleLoading(jqueryElementName) {

    var URL_LOADING = 'url(loading.gif)';

    if ($(jqueryElementName).css('background-image') != 'none') {
        $(jqueryElementName).css('background', '');
    }
    else {
        if ($(jqueryElementName).text() === "") {
            $(jqueryElementName).text('\xa0\xa0\xa0\xa0\xa0');
        }
        $(jqueryElementName).css('background-image', 'url(loading.gif)')
            .css('background-repeat', 'no-repeat')
            .css('background-position', 'center');
    }
}

// ********
// jQueryUI
// ********
$(function () {
    $("#manualLapSlider").slider({
        max: 36000,
        step: 300,
        change: function (event, ui) {
            $('#addManualLap_Length').text(getGoalTime(ui.value));
        }
    });


    $("#dailyGoalSlider").slider({
        max: 10 * HOUR,
        step: 0.5 * HOUR,
        change: function (event, ui) {
            $('#goalTime_day').text(getGoalTime(ui.value));
        }
    });

    $("#weeklyGoalSlider").slider({
        max: 30 * HOUR,
        step: 1 * HOUR,
        change: function (event, ui) {
            $('#goalTime_week').text(getGoalTime(ui.value));
        }
    });

    $("#monthlyGoalSlider").slider({
        max: 95 * HOUR,
        step: 5 * HOUR,
        change: function (event, ui) {
            $('#goalTime_month').text(getGoalTime(ui.value));
        }
    });

    var progressbar = $("#progressbar"),
        progressLabel = $("#progressLabel");

    $("#timerProgressBar").progressbar({

        /*change: function() {
         progressLabel.text( progressbar.progressbar( "value" ) + "%" );
         },*/
        complete: function () {
            //   progressLabel.text( "Complete!" );
        }
    });

    $(function () {
        $("#datepicker").datepicker({maxDate: "+0D", onSelect: onSelect});
        $("#datepicker").datepicker("setDate", "+0");

        function onSelect(dateText, inst) {
            chart(dateText);
        }

    });

});


/* Chart

 */

function getLaps(date) {
    var promise = $.Deferred();
    var Laps = Parse.Object.extend("Laps");
    var query = new Parse.Query(Laps);
    query.equalTo("date", date);
    query.notEqualTo("isManualLap", true);
    query.ascending("createdAt");
    query.find().then(function (results) {
        promise.resolve(results);
    });
    return promise.promise();
}

function findFirstLap(date) {
    var promise = $.Deferred();
    var Laps = Parse.Object.extend("Laps");
    var query = new Parse.Query(Laps);
    query.equalTo("date", date);
    query.notEqualTo("isManualLap", true);
    query.ascending("createdAt");
    query.first().then(function (result) {
        var val = result ? (result.createdAt - (result.get("length") * MILLISECONDS)) : undefined;
        promise.resolve(val);
    });

    return promise.promise();
}

function getManualLapTotalLength(date) {
    var promise = $.Deferred();
    var Laps = Parse.Object.extend("Laps");
    var query = new Parse.Query(Laps);
    var val = 0;
    query.equalTo("date", date);
    query.equalTo("isManualLap", true);
    query.find().then(function (results) {
        if (results) {
            for (var i = 0; i < results.length; i++) {
                val += results[i].get("length");
            }
        }
        promise.resolve(val / 3600);
    });

    return promise.promise();
}

function chart(date) {

    var dps = [];
    var manualDps = [];
    var goalDps = [];
    var firstLap;
    var manualLapCount = 0;
    var length = 0;

    var dateToCheck = date ? date : getShortDate();

    toggleLoading("#chart");


    // TODO: handle a case when there's no first lap!!!
    findFirstLap(dateToCheck)  // Get the first lap (use it as the manual lap start time)
        .then(function (result) {
            if (result) {
                firstLap = result
            }
            ;
        })
        .then(function () {
            return getManualLapTotalLength(dateToCheck);  // Get today's total manual lap time
        })
        .then(function (result) {
            manualLapCount = result;
            if (manualLapCount > 0) {
                length = manualLapCount;
                manualDps.push({x: firstLap, y: 0, markerColor: "yellow"});
                manualDps.push({x: firstLap, y: manualLapCount, markerColor: "yellow", indexLabel: "M"});
            }
        })
        .then(function () {
            return getLaps(dateToCheck);
        })
        .then(function (results) {
            for (var i = 0; i < results.length; i++) {
                var object = results[i];
                var lapEnd = object.createdAt;
                var lapStart = new Date(lapEnd - (object.get("length") * 1000));

                var dp = {x: lapStart, y: length, markerType: "none"};

                // todo: consolidate points

                dps.push(dp);
                length += ((lapEnd - lapStart) / 1000 / 3600);
                length = Math.ceil(length * 1000) / 1000;
                dps.push({x: lapEnd, y: length, markerType: "none"});

                if ((lapStart - prevLapEnd) > (1000 * 600)) {
                    dps[dps.length - 3].indexLabel = "SB";
                    dps[dps.length - 3].markerColor = "red";
                    dps[dps.length - 3].markerType = "circle";
                    dps[dps.length - 2].indexLabel = "EB";
                    dps[dps.length - 2].markerColor = "red";
                    dps[dps.length - 2].markerType = "circle";
                }
                var prevLapEnd = lapEnd;
            }

            dps.sort(function (a, b) {
                a = new Date(a.x);
                b = new Date(b.x);
                return a > b ? -1 : a < b ? 1 : 0;
            });
        }).then(function(){return isDailyGoalSet(dateToCheck)})
        .then(function (value) {
            if (dps.length>0 && value) {
                var goal = value.get("goal") / 3600;
                goalDps.push({x: dps[0].x, y: goal});
                goalDps.push({x: dps[dps.length - 1].x, y: goal});
            }
        })
        .then(function () {

            var chartx = new CanvasJS.Chart("chartContainer",
                {
                    backgroundColor: "#f8f8f8",
                    zoomEnabled: true,

                    title: {
                    },
                    axisX: {
                        valueFormatString: "HH:mm",
                    },
                    axisY: {
                        includeZero: false,
                        gridColor: "#f8f8f8",
                        //valueFormatString: " "

                    },
                    data: [
                        {
                            type: "line",

                            dataPoints: dps
                        },
                        {
                            type: "line",
                            color: "yellow",
                            dataPoints: manualDps
                        },
                        {
                            type: "line",
                            color: "green",
                            dataPoints: goalDps
                        }
                    ]
                });


            chartx.render();

            toggleLoading("#chart");

        }
    );
}

