var intervalId;

function startTimer(){

    var button = document.getElementById("startButton");

    if (button.innerHTML == "Start"){button.innerHTML ="Stop";}
    else if (button.innerHTML == "Stop"){button.innerHTML ="Start";}

    var oldTime = new Date().getSeconds();
    var newTime;
    var seconds = 0;
    var minutes = new Date().getMinutes();


    if (button.innerHTML=="Stop"){
        document.getElementById("stopMessage").innerHTML="";
        intervalId=window.setInterval(function updateSeconds(){

            newTime = new Date().getSeconds();
            if (hasProgressed(oldTime,newTime)){
                oldTime=newTime;
                document.getElementById("timerSeconds").innerHTML=formatSeconds(seconds++);
            }

        },100)
    }
    else{
        window.clearInterval(intervalId);
        document.getElementById("stopMessage").innerHTML="Why did you stop?";
    }
}

/*
    Return a double digit second string
 */
function formatSeconds(seconds){

    seconds = seconds % 60;

    if (seconds.toString().length == 1){
        seconds = "0"+seconds;
    }

    return seconds;
}

/*
    Check whether a second has passed
 */
function hasProgressed(oldTime,newTime){
    if (newTime == 00 && oldTime == 59) return true;
    return newTime == oldTime + 1 ? true : false;
}