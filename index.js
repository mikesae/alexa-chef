'use strict';
module.change_code = 1;

const Skill = require('alexa-app');
const app = new Skill.app('Chef');
const DatabaseHelper = require('./database-helper');
const databaseHelper = new DatabaseHelper();
const moment = require('moment');
const natural = require('natural');
const _ = require('lodash');
const util = require('util');

app.pre = () => {
    databaseHelper.createTable();
};

app.launch(function (request, response) {
    let prompt = 'Welcome to Chef! To add a menu item, say add followed by the item and the day.  To review, say whats for dinner';
    response.say(prompt).shouldEndSession(false);
});

const tokenizer = new natural.WordTokenizer();

const getAddEventMessage = (request, menuItem) => {
    let result = "";
    let day = request.slot('DAY');
    let date = request.slot('DATE');

    if (day) {
        result = util.format('OK. %s will be served %s' , menuItem, day);
    } else if (date) {
        result = util.format('OK. %s will be served on %s' , menuItem, date);
    } else {
        result = util.format('OK, %s will be served tonight' , menuItem);
    }
    return result;
};

const getLoadEventMessage = (request, menuItem) => {
    let result = "";
    let day = request.slot('DAY');
    let date = request.slot('DATE');
    let words = tokenizer.tokenize(menuItem.toLowerCase());
    let isPlural = _.includes(words, "and") || _.includes(words, "leftovers");
    let pluralPresent = isPlural ? "are" : "is";
    let pluralPast = isPlural ? "were" : "was";

    switch (day) {
        case 'monday':
        case 'tuesday':
        case 'wednesday':
        case 'thursday':
        case 'friday':
        case 'saturday':
        case 'sunday':
            result = util.format("OK. %s %s being served on %s", menuItem, pluralPresent, day);
            break;
        case 'today':
        case 'tomorrow':
        case 'tonight':
            result = util.format("OK. %s %s being served %s", menuItem, pluralPresent, day);
            break;
        case 'yesterday':
            result = util.format("OK. %s %s served yesterday", menuItem, pluralPast);
            break;
        default:
            result = util.format("OK. %s %s being served on %s", menuItem, pluralPresent, date);
            break;
    }
    return result;
};

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
        'add {FOOD} {to} {DAY}s {-|dinner} menu',
        'put {FOOD} {on} {DATE}s {-|dinner} menu',
        'lets have {FOOD} {-|for dinner} on {DAY}',
        'lets have {FOOD} {-|for dinner} on {DATE}',
    ]
}, (request, response) => {
    let date = getRequestDate(request);
    let food = request.slot('FOOD');
    let userId = request['data']['session']['user']['userId'];

    if (!food) {
        response.say('I dont understand what you mean.  To add an item to the menu, say add followed by the name of the dish you want to add.').shouldEndSession(false);
        return;
    }

    databaseHelper.save(userId, date, food);
    response.say(getAddEventMessage(request, food)).shouldEndSession(false);
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
            default:
                result = now;
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
        'Whats for dinner',
        'Whats for dinner on {DAY} {-|night}',
        'Whats for dinner on {DATE}'
    ]
}, (request, response) => {
    let userId = request['data']['session']['user']['userId'];
    let date = getRequestDate(request);

    databaseHelper.load(userId, date).then(food => {
        response.say(getLoadEventMessage(request, food)).shouldEndSession(false);
    });
});

module.exports = app;
