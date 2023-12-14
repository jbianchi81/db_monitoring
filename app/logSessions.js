const program = require('commander');
const internal = {}
const {Pool} = require('pg')
const config = require('config')
const pool = new Pool(config.database)

internal.getSessionCount = async (to_string=false) => {
  try {
    var result =  await pool.query("select state,waiting,count(*) from pg_stat_activity group by state,waiting")
  } catch (e) {
    throw(e)
  }
  const o = {
    "idle": 0,
    "active": 0,
    "active (waiting)": 0,
    "idle in transaction": 0,
    "idle in transaction (aborted)": 0,
    "fastpath function call": 0,
    "disabled": 0
  }
  result.rows.forEach(r=>{
    if(r.state == "active") {
      if(r.waiting) {
        o["active (waiting)"] = r.count
      } else {
        o["active"] = r.count
      }
    } else {
      o[r.state]  = r.count
    }
  })
  if(to_string) {
    var session_count = "Sessions: "
    Object.keys(o).forEach(key=>{
      if(o[key] > 0) {
        session_count += `${key}: ${o[key]} `
      }
    })
    return session_count
  }
  return o
}

internal.logSessions = function () {
    internal.getSessionCount(true)
    .then(session_count=>{ 
      console.log(new Date().toISOString() + " " + session_count)
    })
  }

const default_interval = (config.log_sessions && config.log_sessions.interval) ? config.log_sessions.interval : 5000

program
.version('0.0.1')
.description('log database usage (number of sessions) at interval')

program.command('run')
  .argument('[interval]','time interval in milliseconds')
  .action((interval) => {
      interval = interval ?? default_interval
      setInterval(internal.logSessions,interval)  
  })

program.parse()

module.exports = internal
