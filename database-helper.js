'use strict';
module.change_code = 1;
const DATA_TABLE_NAME = 'chefData';
const util = require('util');


const credentials = {
    region: 'us-east-1',
    accessKeyId: 'fake',
    secretAccessKey: 'fake'
};
const dynasty = require('dynasty')(credentials, 'http://localhost:4000');

// const credentials = {
//     region:'us-east-1',
//     accessKeyId:'',
//     secretAccessKey:''
// };
// const dynasty = require('dynasty')(credentials, null);

function DatabaseHelper() {
    const dataTable = dynasty.table(DATA_TABLE_NAME);

    this.createTable = () => {
        return dynasty.describe(DATA_TABLE_NAME)
            .catch(function (error) {
                return dynasty.create(DATA_TABLE_NAME, {
                    key_schema: {
                        hash: ['userId', 'string']
                    }
                });
            });
    };

    function makeKey(id, date) {
        return util.format("%s | %s", id, date.format('LL'));
    };

    this.save = (userId, date, item) => {
        // combine user id and date to form the key
        return dataTable.insert({
                userId: makeKey(userId, date),
                item: item
            }
        ).catch(error => console.log(error));
    };

    this.load = (userId, date) => {
        return dataTable.find(makeKey(userId, date))
            .then(function (result) {
                console.log('table found: ' + JSON.stringify(result));
                return result ? result.item : 'nothing';
            })
            .catch(function (error) {
                console.log('load error: ' + JSON.stringify(error));
                return 'nothing';
            });
    };
}

module.exports = DatabaseHelper;
