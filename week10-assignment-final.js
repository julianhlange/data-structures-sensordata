var express = require('express'),
    app = express();
const { Pool } = require('pg');

// AWS RDS POSTGRESQL INSTANCE
var db_credentials = new Object();
db_credentials.user = 'julianhlange';
db_credentials.host = process.env.AWSRDS_EP;
db_credentials.database = 'hallandfsrdb';
db_credentials.password = process.env.AWSRDS_PW;
db_credentials.port = 5432;

app.get('/', function(req, res) {
    // Connect to the AWS RDS Postgres database
    const client = new Pool(db_credentials);

    // SQL query
    var q = `SELECT EXTRACT(DAY FROM lastheard AT TIME ZONE 'America/New_York') as sensorday,
             EXTRACT(MONTH FROM lastheard AT TIME ZONE 'America/New_York') as sensormonth,
             COUNT (*) as total_obs,
             SUM (CASE WHEN hallsensor = false THEN 1 ELSE 0 END) as hallsensor_fridgeopen,
             SUM (CASE WHEN fsrsensor <= 10 THEN 1 ELSE 0 END) as fsrsensor_fridgeopen,
             SUM (CASE WHEN hallsensor = false AND fsrsensor <= 10 THEN 1 ELSE 0 END) as bothsensors_fridgeopen
             FROM sensordata
             GROUP BY sensormonth, sensorday;`;
             
    client.connect();
    client.query(q, (qerr, qres) => {
        res.send(qres.rows);
        console.log('responded to request');
    });
    client.end();
});

app.listen(3000, function() {
    console.log('Server listening...');
});