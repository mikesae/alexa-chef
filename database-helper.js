'use strict';
module.change_code = 1;
const DATA_TABLE_NAME = 'chefData';
const _ = require('lodash');

const credentials = {
    region: 'us-east-1',
    accessKeyId: 'fake',
    secretAccessKey: 'fake'
};
const dynasty = require('dynasty')(credentials, 'http://localhost:4000');

// const credentials = {
//     region:'us-east-1',
//     accessKeyId:'AKIAJB5CK4ANR4XCE7VA',
//     secretAccessKey:'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'
// };
// const dynasty = require('dynasty')(credentials, null);

function DatabaseHelper() {
    const dataTable = dynasty.table(DATA_TABLE_NAME);

    this.createTable = () => {
        return dynasty.describe(DATA_TABLE_NAME)
            .catch(function (error) {
                return dynasty.create(DATA_TABLE_NAME, {
                    key_schema: {
                        hash: ['userId', 'string'],
                        range: ['itemDate', 'string']
                    }
                });
            });
    };

    this.save = (userId, date, item) => {
        return dataTable.insert({
            userId: userId,
            itemDate: date,
            item: item
        }).then(response => console.log('Insert response: ' + JSON.stringify(response))
        ).catch(error => console.log(error));
    };

    this.load = (userId, date) => {
        console.log('Looking for userId:' + userId + ', date: ' + date);
        return dataTable.findAll(userId)
            .then(function (result) {
                console.log('table found: ' + JSON.stringify(result));
                if (result.length > 0) {
                    return _.find(result, x => x.itemDate === date);
                } else {
                    return { item: 'nothing' };
                }
            })
            .catch(function (error) {
                console.log('load error: ' + JSON.stringify(error));
                return { item: 'nothing' };
            });
    };
}

module.exports = DatabaseHelper;
