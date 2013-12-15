var COOKIE_CURRENT_LAP = "currentLap";

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
    createCookie(COOKIE_CURRENT_LAP, x.time());
}
function start() {

    var button = document.getElementById("startButton");

    if (button.innerHTML == "Start") {
        document.getElementById("why_stop").style.display = "none";
        clocktimer = setInterval("update()", 500);
        x.start();
    }
    else {

        var TestObject = Parse.Object.extend("Laps");
        var testObject = new TestObject();
        var howLong = document.getElementById("time").innerHTML;
        howLong = timeStringToSeconds(howLong);
        testObject.save({length: howLong, date: getShortDate()}).then(function () {
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
                }
            );
        });

        stop();
        //  document.getElementById("why_stop").style.display = "block";
    }

    var newVal = button.innerHTML == "Start" ? "Stop" : "Start";
    button.innerHTML = newVal;
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

function initParse(){
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

    time = document.getElementById('time');
    document.getElementById('todayDate').innerHTML += getShortDate();

    // Restore unsaved lap if browser exited unexpectedly
    var unsavedLap = readCookie(COOKIE_CURRENT_LAP);
    if (unsavedLap > 0) {
        x.setLapTime(unsavedLap);
    }

    time.innerHTML = formatTime(x.time()); // set the timer initial time

    isDailyGoalSet();
    queryDaysDataForTable();
}

/*
 ================
 Weekly table
 ================
 */
function queryDaysDataForTable() {

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
            }).always(function () {
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
    var i, row, date, length, dayCell, lengthCell, goalCell, percentageCell;

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

        row.appendChild(dayCell);
        row.appendChild(lengthCell);
        row.appendChild(goalCell);
        row.appendChild(percentageCell);

        table.appendChild(row);
    }
}

/*
 ================
 Daily Goal
 ================
 */
function updateGoalTime(value) {
    document.getElementById("goalTime").innerHTML = secondsToString(value).substr(0, 5);
}
function isDailyGoalSet(dayToCheck) {
    var date = dayToCheck || getShortDate();

    var DailyGoals = Parse.Object.extend("DailyGoals");
    var query = new Parse.Query(DailyGoals);

    query.equalTo("date", date);

    query.find().then(callbackIsDailyGoalSet);
}

function callbackIsDailyGoalSet(results){
    if (results[0]) {
        toggleGoalElementsVisibility(false);
        updateGoalTime(results[0].get("goal"));
    }
}

function toggleGoalElementsVisibility(show){
    document.getElementById('goalInput').style.display = show == true ? "" : "none";
    document.getElementById('setDayGoal').style.display = show == true ? "" : "none";
    document.getElementById('center_section').style.display = show == true ?  "none" :"" ;
    document.getElementById('updateDayGoal').style.display = show == true ?  "none" :"" ;
    document.getElementById('goalTitle').innerHTML = show == true ? "Set your goal for today: ":"The daily goal is: " ;
}

function setDayGoal() {

    var howLong = document.getElementById('goalTime').innerHTML;
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
               toggleGoalElementsVisibility(false);
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

