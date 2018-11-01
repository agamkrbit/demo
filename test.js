var db = require('./db/db');


//test db 
db.query('select now()', function(err, data){
    console.log(err);
    console.log(data);
});