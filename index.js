'use strict';
module.change_code = 1;

const Skill = require('alexa-app');
const app = new Skill.app('Chef');
const DatabaseHelper = require('./database-helper');
const databaseHelper = new DatabaseHelper();
const moment = require('moment');

app.pre = () => {
    databaseHelper.createTable();
};

app.launch(function (request, response) {
    let prompt = 'Welcome to Chef! To add a menu item, say add followed by the item and the day.  To review, say whats for dinner';
    response.say(prompt).shouldEndSession(false);
});

function getRequestDate(request) {
    let day = request.slot('DAY');
    let date = request.slot('DATE');

    if (day) {
        date = getDateFromDaySlot(day);
    } else {
        date = moment(date);
    }
    return date;
}

app.intent('addDinner', {
    slots: {
        'FOOD': 'AMAZON.Food',
        'DAY': 'AMAZON.DayOfWeek',
        'DATE': 'AMAZON.Date'
    },
    utterances: [
        '{add|put} {FOOD} {to|on} {DAY}s {-|dinner} menu',
        '{add|put} {FOOD} {to|on} {DATE}s {-|dinner} menu']
}, (request, response) => {
    let date = getRequestDate(request);
    let food = request.slot('FOOD');
    let userId = request['data']['session']['user']['userId'];

    // TODO: check for bad requests.

    databaseHelper.save(userId, date, food);
    response.say('OK, I have added ' + food + ' to your dinner menu for ' + date).shouldEndSession(false);
});

const dayMap = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
};

function getDateFromDaySlot(requestedDayName) {
    let now = moment();
    let currentDay = now.day();
    let requestedDay;
    let result;

    if (dayMap[requestedDayName] !== undefined) {
        requestedDay = dayMap[requestedDayName];
        result = now.add(requestedDay - currentDay, 'd');
    } else {
        switch (requestedDayName) {
            case 'today':
            case 'tonight':
                result = now;
                break;
            case 'tomorrow':
                result = now.add(1, 'd');
                break;
            case 'yesterday':
                result = now.add(-1, 'd');
                break;
        }
    }
    return result;
}

app.intent('loadDinner', {
    slots: {
        'DAY': 'AMAZON.DayOfWeek',
        'DATE': 'AMAZON.Date'
    },
    utterances: [
        '{Whats for dinner on} {DAY}',
        '{Whats for dinner on} {DATE}'
    ]
}, (request, response) => {
    let userId = request['data']['session']['user']['userId'];
    let date = getRequestDate(request);

    // TODO: check for bad requests.

    databaseHelper.load(userId, date).then(result => {
        response.say('OK ' + result + ' is on the menu for dinner on ' + date).shouldEndSession(true);
    });
});

module.exports = app;
