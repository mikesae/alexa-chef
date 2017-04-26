'use strict';
module.change_code = 1;
const DATA_TABLE_NAME = 'chefData';

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
                        range: ['date', 'string']
                    }
                });
            });
    };

    this.save = (userId, date, item) => {
        return dataTable.insert({
            userId: userId,
            date: date,
            item: item
        }).then(response => console.log('Insert response: ' + JSON.stringify(response))
        ).catch(error => console.log(error));
    };

    this.load = (userId, date) => {
        console.log('Looking for userId:' + userId + ' on ' + date);
        return dataTable.find({hash: userId, range: date})
            .then(function (result) {
                console.log('table found: ' + JSON.stringify(result));
                return result;
            })
            .catch(function (error) {
                console.log('load error: ' + JSON.stringify(error));
            });
    };
}

module.exports = DatabaseHelper;
