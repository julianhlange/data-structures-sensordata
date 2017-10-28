var request = require('request');
const { Client } = require('pg');

// PARTICLE PHOTON
var device_id = process.env.PHOTON_ID;
var access_token = process.env.PHOTON_TOKEN;
var particle_variable = 'json';
var device_url = 'https://api.particle.io/v1/devices/' + device_id + '/' + particle_variable + '?access_token=' + access_token;

// AWS RDS POSTGRESQL INSTANCE
var db_credentials = new Object();
db_credentials.user = 'julianhlange';
db_credentials.host = process.env.AWSRDS_EP;
db_credentials.database = 'hallandfsrdb';
db_credentials.password = process.env.AWSRDS_PW;
db_credentials.port = 5432;

var getAndWriteData = function() {
    // Make request to the Particle API to get sensor values
    request(device_url, function(error, response, body) {
        // Store sensor values in variables
        var device_json_string = JSON.parse(body).result;
        var hall = JSON.parse(device_json_string).hall;
        var fsr = JSON.parse(device_json_string).fsr;
        var lastheard = body.split('"last_heard":"')[1].split('","connected"')[0].slice(0, -1);

        // Connect to the AWS RDS Postgres database
        const client = new Client(db_credentials);
        client.connect();

        // Construct a SQL statement to insert sensor values into a table
        var thisQuery = "INSERT INTO sensordata VALUES (" + hallToBoolean(hall) + "," + fsr + ",'" + lastheard + "');";
        function hallToBoolean(hall) {
            if (hall == 1) {
                return "TRUE";
            } else { return "FALSE"}
        };
        // console.log(thisQuery); // for debugging

        // Connect to the AWS RDS Postgres database and insert a new row of sensor values
        client.query(thisQuery, (err, res) => {
            console.log(err, res);
            client.end();
        });
    });
};

// // write a new row of sensor data every five seconds
setInterval(getAndWriteData, 5000);