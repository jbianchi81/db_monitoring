const {Pool} = require('pg')
const config = require('config')
const pool = new Pool(config.database)
const internal = {}

internal.getWaitingQueries = async (database,relname) => {
    database = database ?? config.database.database
    var filter_string = `AND pg_database.datname = '${database}'`
    var filter_string = `${filter_string}${(relname) ? ` AND pg_class.relname = '${relname}'` : ""}`
    const stmt = `WITH granted_locks AS (
        SELECT
            pg_locks.mode,
            pg_locks.relation AS relation_oid,
            pg_locks.pid,
            pg_locks.granted,
            pg_database.datname,
            pg_class.relname,
            pg_stat_activity.query_start,
            pg_stat_activity.query,
            pg_stat_activity.state
            -- pg_stat_activity.waiting
        FROM pg_locks
        JOIN pg_database
        ON pg_database.oid = pg_locks.database
        JOIN pg_class 
        ON pg_locks.relation = pg_class.oid
        JOIN pg_stat_activity
        ON pg_stat_activity.pid = pg_locks.pid
        WHERE
            -- pg_locks.mode IN ('ExclusiveLock','AccessExclusiveLock')
            -- AND 
            pg_locks.granted = true
            -- AND pg_stat_activity.query_start < now() - interval '20 seconds'
            -- AND pg_stat_activity.state = 'active'
            -- AND pg_stat_activity.waiting = 'false'
            ${filter_string}
    ), 
    not_granted_locks AS (
        SELECT 
            pg_locks.mode,
            pg_locks.relation AS relation_oid,
            pg_database.datname,
            pg_stat_activity.pid,
            pg_locks.granted,
            pg_class.relname,
            pg_stat_activity.query_start,
            pg_stat_activity.query,
            pg_stat_activity.state
            -- pg_stat_activity.waiting
        FROM pg_locks
        JOIN pg_database
        ON pg_database.oid = pg_locks.database
        JOIN pg_class 
        ON pg_locks.relation = pg_class.oid
        JOIN pg_stat_activity
        ON pg_stat_activity.pid = pg_locks.pid
        WHERE
            pg_locks.mode = 'AccessShareLock'
            AND pg_locks.granted = false
            -- AND pg_stat_activity.state = 'active'
            -- AND pg_stat_activity.waiting = true
            ${filter_string}
    )
    SELECT
        not_granted_locks.relation_oid,
        not_granted_locks.relname,
        not_granted_locks.pid AS waiting_pid,
        now() - not_granted_locks.query_start AS delay,
        not_granted_locks.query AS waiting_query,
        granted_locks.pid AS blocking_pid,
        granted_locks.query_start AS blocking_query_start,
        granted_locks.query AS blocking_query
    FROM not_granted_locks, granted_locks
    WHERE not_granted_locks.relation_oid = granted_locks.relation_oid
    ORDER by blocking_pid,delay;`
    // console.log(stmt)
    try {
        var result = await pool.query(stmt)
    } catch(e) {
        throw(e)
    }
    return result.rows
}

internal.logWaiting = async (database,relname) => {
    try {
        var waiting_queries = await internal.getWaitingQueries(database,relname)
    } catch(e) {
        throw(e)
    }
    if(!waiting_queries.length) {
        internal.log(`No waiting queries`)
    }
    waiting_queries.forEach(row=>{
        internal.log(`${row.relname} pid: ${row.waiting_pid} delay: ${row.delay.toPostgres()} query: ${row.waiting_query.slice(0,20)} blocking_pid: ${row.blocking_pid} start: ${(row.blocking_query_start) ? row.blocking_query_start.toISOString() : "null"} blocking_query: ${row.blocking_query.slice(0,20)}`)
    })
}

internal.default_interval = (config.log_waiting && config.log_waiting.interval) ? config.log_waiting.interval : 60000

internal.log = (message) => {
    console.log(`${new Date().toISOString()} - ${message}`)
}

module.exports = internal