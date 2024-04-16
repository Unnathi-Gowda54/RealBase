const mysql = require("mysql")

const connection = mysql.createConnection(
    {
        host : "localhost", 
        user : "root",
        password : "root",
        database : "realBase"
    }
);

connection.connect(function(error) {
    if(error)
    {
        throw error;
    }
    else 
    {
        console.log('Connected succesfully');
    }
});

connection.query('select * from users', (err, result, fields) => {
    if(err) {
        return console.log(err);
    }
    return console.log(result);
});

module.exports = connection;
