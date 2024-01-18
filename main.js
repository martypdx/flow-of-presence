import './theme.js';

if(Notification) {
    if(Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        // async
        Notification.requestPermission();
    }
}

const ul = document.getElementById('sessions');
const timer = document.getElementById('timer');
const params = new URLSearchParams(location.search);
const DEFAULT = 25;
let minutes = DEFAULT;
try {
    const value = params.get('minutes') || DEFAULT;
    if(value === 'test') {
        minutes = 1 / 6;
    }
    else {
        minutes = isNaN(value) || !(value >= 1) ? DEFAULT : parseInt(value);
    }
}
catch(ignore) { }

let session = 1000 * 60 * minutes;

const format = s => s.toString().padStart(2, '0');
function updateTimeRemaining(time) {
    const ms = session - (time - start);
    const seconds = Math.round(ms / 1000);
    const minutes = Math.trunc(seconds / 60);
    const remain = seconds % 60;
    timer.textContent = `${format(minutes)}:${format(remain)}`;
}

let start = null;
function resetTimer() {
    start = new Date();
    updateTimeRemaining(start);
}
function updateTimer() {
    const time = new Date();
    updateTimeRemaining(time);
    return time;
}

startSession();

function startSession() {
    resetTimer();
    let interval = setInterval(() => {
        const time = updateTimer();

        if(time - start > session) {
            clearInterval(interval);
            ul.prepend(document.createElement('li'));
            queueMicrotask(sessionComplete);
        }
    }, 1000);
}

function sessionComplete() {
    resetTimer();
    window.focus();
    const notification = notify('session complete');
    if(!notification) next();
    else {
        notification.addEventListener('click', next, { once: true });
        notification.addEventListener('close', next, { once: true });
        document.addEventListener('click', next, { once: true });
    }

    function next() {
        window.focus();
        startSession();
        if(notification) {
            notification.close();
            notification.removeEventListener('click', next, { once: true });
            notification.removeEventListener('close', next, { once: true });
            document.removeEventListener('click', next, { once: true });
        }
    }
}

function notify(message) {
    if(Notification.permission === "granted") {
        return new Notification(message);
    }
    alert(message);
    return null;
}
