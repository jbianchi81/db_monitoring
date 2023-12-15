const logSessions = require('./app/logSessions')
const logWaiting = require('./app/logWaiting')
const program = require('commander');

program
.version('0.0.1')
.description('log database usage (number of sessions) at interval')

program.command('sessions')
  .alias("s")
  .argument('[interval]','time interval in milliseconds')
  .action((interval) => {
      interval = interval ?? logSessions.default_interval
      setInterval(logSessions.logSessions,interval)  
  })

program.command('waiting')
  .alias('w')
  .argument('[interval]','time interval in milliseconds')
  .option('--database','database name. Defaults to config.database.database')
  .option('--relname','relation name. Defaults to all')
  .action((interval,options) => {
      interval = interval ?? logWaiting.default_interval
      setInterval(function() {
        logWaiting.logWaiting(options.database,options.relname).catch(e=>{
            console.error(e)
            process.exit(1)

        })},
        interval)  
  })

program.parse()
