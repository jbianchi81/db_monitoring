# db_monitoring

PostgreSQL server activity monitoring

## installation

    npm install

## configuration

Create config dir

    mkdir config

Create config file

    nano config/default.json

Set database connection parameters and default log interval in milliseconds

    {
        "database":
        {
            "user": "user",
            "host": "host",
            "database": "database",
            "password": "password",
            "port": 5432
        },
        "log_sessions": {
            "interval": 10000
        }
    }


## usage

Run using default log interval

    node index.js run

Run with other log interval

    node index.js run 1000

## notes

Tested for postgresql server 9.5