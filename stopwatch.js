//	Simple example of using private variables
//
//	To start the stopwatch:
//		obj.start();
//
//	To get the duration in milliseconds without pausing / resuming:
//		var	x = obj.time();
//
//	To pause the stopwatch:
//		var	x = obj.stop();	// Result is duration in milliseconds
//
//	To resume a paused stopwatch
//		var	x = obj.start();	// Result is duration in milliseconds
//
//	To reset a paused stopwatch
//		obj.stop();
//


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
};

var x = new clsStopwatch();
var time;
var clocktimer;

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

function show() {

    Parse.initialize("75yStvvNmep3ZhsC5VAtMBSUGjoECMmmNI7aHxTK", "BZxsbuz6tYffL4Ld09pO5tswvBVrvVLoROezGlpR");

    time = document.getElementById('time');
    update();

    var todayDate = document.getElementById('todayDate');
    todayDate.innerHTML += getShortDate();
}

function update() {
    time.innerHTML = formatTime(x.time());
}

function start() {

    var button = document.getElementById("startButton");


    if (button.innerHTML == "Start") {
        document.getElementById("why_stop").style.display = "none";
        clocktimer = setInterval("update()", 1);
        x.start();
    }
    else {

        var TestObject = Parse.Object.extend("Laps");
        var testObject = new TestObject();
        var howLong = document.getElementById("time").innerHTML;
        howLong = timeStringToSeconds(howLong);
        testObject.save({length: howLong, date: getShortDate()},
            {success: function () {

                measureDay(getShortDate(), function (length) {
                    document.getElementById("today_so_far").innerHTML = "Time spent: " + secondsToString(length);
                });
            }});
        stop();
        //  document.getElementById("why_stop").style.display = "block";
    }

    var newVal = button.innerHTML == "Start" ? "Stop" : "Start";
    button.innerHTML = newVal;
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

function retrieveGoal (date) {
    var DailyGoals = Parse.Object.extend("DailyGoals");
    var query = new Parse.Query(DailyGoals);
    query.matches("date", date);
    query.find({
        success: function (results) {

            if (results[0]) {
                return results[0].get("goal");
            }
            else{
                return 0;
            }

        }});
}

function buildWeekTable() {
    var table = document.getElementById("this_week_table_tbody");
    table.innerHTML = "";
    var i, row, date, length, dayCell, lengthCell,goalCell;
    var countCallback = 0;
    var days = [];
    var day = {};

    for (i = 6; i >= 0; i--) {
        date = getShortDate(i * -1);

        measureDay(date, function (length, date) {
            countCallback++;
            length = length || "0";
            day = {};
            day.effortLength = secondsToString(length);
            day.date = date;
            day.goal = retrieveGoal(day.date) ;

            days.push(day);
            days.sort(function (a, b) {
                a = new Date(a.date);
                b = new Date(b.date);
                return a < b ? -1 : a > b ? 1 : 0;
            });
            days.sort();

            if (countCallback == 7) {

                for (var j = 0; j < days.length; j++) {
                    row = document.createElement('tr');
                    dayCell = document.createElement('td');
                    dayCell.appendChild(document.createTextNode(days[j].date));
                    lengthCell = document.createElement('td');
                    lengthCell.appendChild(document.createTextNode(days[j].effortLength));
                    goalCell = document.createElement('td');
                    goalCell.appendChild(document.createTextNode(days[j].goal));

                    row.appendChild(dayCell);
                    row.appendChild(lengthCell);
                    row.appendChild(goalCell);

                    table.appendChild(row);
                }
            }
            ;
        });
    }


}

function measureDay(day, callback) {

    var totalLength = 0;

    var Laps = Parse.Object.extend("Laps");
    var query = new Parse.Query(Laps);
    query.matches("date", day);
    query.find({
        success: function (results) {
            // Do something with the returned Parse.Object values
            for (var i = 0; i < results.length; i++) {
                var object = results[i];
                totalLength += parseInt(object.get('length'));
            }
            callback(totalLength, day);
        },
        error: function (error) {
            alert("Error: " + error.code + " " + error.message);
        }
    });

}

function stop() {


    x.stop();

    clearInterval(clocktimer);

    reset();


}

function reset() {
    x.reset();
    update();
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

function displayOtherTextBox() {
    document.getElementById("stopReasonButtons").style.display = "none";
    document.getElementById("otherTextBox").style.display = "inline";
}

function updateGoalTIme(slider) {
    document.getElementById("goalTime").innerHTML = secondsToString(slider.value).substr(0, 5);
}

function setDayGoal() {

    var howLong = document.getElementById('goalTime').innerHTML;
    howLong = timeStringToSeconds(howLong);
    var dayParseInstance;

    var date = getShortDate();

    var DailyGoals = Parse.Object.extend("DailyGoals");
    var query = new Parse.Query(DailyGoals);

    query.matches("date", date);
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
                document.getElementById('goalInput').style.display = "none";
                document.getElementById('setDayGoal').style.display = "none";
                document.getElementById('center_section').style.display = "";
            }});

        },
        error: function (error) {
            alert("Error: " + error.code + " " + error.message);
        }
    });
}

function test(string) {
    document.getElementById('todayDate').innerHTML = string;
}