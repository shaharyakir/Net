var COOKIE_CURRENT_LAP = "currentLap";
var UPDATE_INTERVAL=500;
var currentGoalLength=0;
var currentDailyProgress=0;

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
        console.log("LAPTIME: " + lapTime);
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

function updateProgressBar(){

    var percentage = ((currentDailyProgress / currentGoalLength) * 100);
    percentage = Math.ceil(percentage * 10) / 10;
    percentage = (!isNaN(percentage) && percentage != Infinity) ? percentage : 0;
    //percentage = percentage > 100 ? 100 : percentage;

    $( "#timerProgressBar").progressbar("option","value",percentage);
  //  $( "#progressLabel").text( $( "#timerProgressBar").progressbar( "option","value" ) + "%" );
}

function start() {

    var button = document.getElementById("startButton");

    if (button.innerHTML == "Start") {
        document.getElementById("why_stop").style.display = "none";
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

function saveLap(value, jqueryPressedElement, callback) {
    toggleLoading(jqueryPressedElement);
    var TestObject = Parse.Object.extend("Laps");
    var testObject = new TestObject();

    testObject.save({length: value, date: getShortDate()}).then(function () {
        var totalLength = 0;

        var Laps = Parse.Object.extend("Laps");
        var query = new Parse.Query(Laps);
        query.equalTo("date", getShortDate());
        query.find().then(function (results) {

                for (var i = 0; i < results.length; i++) {
                    var object = results[i];
                    totalLength += parseInt(object.get('length'));
                }
                document.getElementById("today_so_far").innerHTML = "Time spent: " + secondsToString(totalLength);
                toggleLoading(jqueryPressedElement);
                if (callback) callback();
                updateAllObjects();
            }
        );
    });
}

function updateAllObjects(){
    buildWeekTable();
    updateProgressBar();
}

/*
 ================
 Util functions
 ================
 */

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

function getShortDate(offset) {

    offset = offset || 0;

    var today = new Date();
    today.setDate(today.getDate() + offset);
    var dd = today.getDate();
    var mm = today.getMonth() + 1; //January is 0!
    var yyyy = today.getFullYear();
    if (dd < 10) {
        dd = '0' + dd
    }
    if (mm < 10) {
        mm = '0' + mm
    }
    today = mm + '/' + dd + '/' + yyyy;
    return today;
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
function dateObjectToHHMM(date,offset){
    date = offset ? (new Date(date - offset*1000)) : date;
    var hours = date.getHours()<10 ?  '0'+date.getHours() : date.getHours();
    var minutes = date.getMinutes()<10 ? '0'+date.getMinutes() : date.getMinutes();
    return hours+":"+minutes;
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

/*
 ================
 OnLoad
 ================
 */
function show() {

    initParse();

    initDailyProgress();

    time = document.getElementById('time');
    document.getElementById('todayDate').innerHTML += getShortDate();

    // Restore unsaved lap if browser exited unexpectedly
    var unsavedLap = readCookie(COOKIE_CURRENT_LAP);
    if (unsavedLap > 0) {
        x.setLapTime(unsavedLap);
    }

    time.innerHTML = formatTime(x.time()); // set the timer initial time

    isDailyGoalSet();
    updateAllObjects();
}

function initDailyProgress(){

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
 */
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
                day.firstLap = object ? dateObjectToHHMM(object.createdAt,(object.get("length"))) : "00:00";
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

/*
 ================
 Daily Goal
 ================
 */

function getGoalTime(value) {
    return secondsToString(value).substr(0, 5);
}

function isDailyGoalSet(dayToCheck) {
    var date = dayToCheck || getShortDate();

    var DailyGoals = Parse.Object.extend("DailyGoals");
    var query = new Parse.Query(DailyGoals);

    query.equalTo("date", date);
    toggleLoading("#goalTime");
    query.find().then(callbackIsDailyGoalSet);
}

function callbackIsDailyGoalSet(results) {
    toggleLoading('#goalTime');
    if (results[0]) {
        // toggleGoalElementsVisibility(false);
        //document.getElementById("goalTime").innerHTML = secondsToString(results[0].get("goal")).substr(0, 5);
        currentGoalLength = parseInt(results[0].get("goal"));
        updateProgressBar(); //TODO:SYNC the daily goal and daily progress methods to update the progress bar
        $("#goalTime").text(secondsToString(results[0].get("goal")).substr(0, 5));
        $("#goalTimeToSet").text(secondsToString(results[0].get("goal")).substr(0, 5));
        $('#center_section').show();
    }
    else {
        $('#updateDayGoal').click();
    }
}

function toggleGoalElementsVisibility(show) {
    /*document.getElementById('goalInput').style.display = show == true ? "" : "none";
     document.getElementById('setDayGoal').style.display = show == true ? "" : "none";
     document.getElementById('center_section').style.display = show == true ? "none" : "";
     document.getElementById('updateDayGoal').style.display = show == true ? "none" : "";
     document.getElementById('goalTitle').innerHTML = show == true ? "Set your goal for today: " : "The daily goal is: ";*/
}

function setDayGoal() {

    toggleLoading('#setDayGoal');
    var howLong = document.getElementById('goalTimeToSet').innerHTML;
    howLong = timeStringToSeconds(howLong);
    var dayParseInstance;

    var date = getShortDate();

    var DailyGoals = Parse.Object.extend("DailyGoals");
    var query = new Parse.Query(DailyGoals);

    query.equalTo("date", date);
    query.find({
        success: function (results) {

            if (results[0]) {
                dayParseInstance = results[0];
                dayParseInstance.set("goal", howLong);
            }
            else {

                var dayParseObject = Parse.Object.extend("DailyGoals");
                dayParseInstance = new dayParseObject();
                dayParseInstance.set("date", date);
                dayParseInstance.set("goal", howLong);
            }
            dayParseInstance.save({success: function () {
                /*$('#goalTime').animate({color:'red'},"fast")
                 .animate({'font-size':'1.5em'},2000)
                 .animate({'font-size':'1em',color:'black'},"fast");*/
                $('#goalTime').text($('#goalTimeToSet').text());
                $('#updateDayGoal').click();
                $('#center_section').show();
                currentGoalLength=howLong;
                toggleLoading('#setDayGoal');
                updateAllObjects();
            }});

        },
        error: function (error) {
            alert("Error: " + error.code + " " + error.message);
        }
    });
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
    console.log("dd");
    var Laps = Parse.Object.extend("Laps");
    var query = new Parse.Query(Laps);
    query.equalTo("date", "12/16/2013");
    query.descending("createdAt");
    query.first().then(function (object) {
        console.log(object.createdAt);
    });
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
        currentDailyProgress+=manualLapLength;
        saveLap(manualLapLength, this, function () {
            $('#addManualLapButton').click()
        });
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

// jQueryUI
$(function () {
    $("#manualLapSlider").slider({
        max: 36000,
        step: 300,
        change: function (event, ui) {
            $('#addManualLap_Length').text(getGoalTime(ui.value));
        }
    });

    $("#goalSlider").slider({
        max: 36000,
        step: 1800,
        change: function (event, ui) {
            $('#goalTimeToSet').text(getGoalTime(ui.value));
        }
    });

    var progressbar = $( "#progressbar" ),
        progressLabel = $( "#progressLabel" );

    $("#timerProgressBar").progressbar({

        /*change: function() {
            progressLabel.text( progressbar.progressbar( "value" ) + "%" );
        },*/
        complete: function() {
         //   progressLabel.text( "Complete!" );
        }
    });

});

