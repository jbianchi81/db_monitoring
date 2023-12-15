const logSessions = require('./app/logSessions')
const program = require('commander');

program
.version('0.0.1')
.description('log database usage (number of sessions) at interval')

program.command('run')
  .argument('[interval]','time interval in milliseconds')
  .action((interval) => {
      interval = interval ?? logSessions.default_interval
      setInterval(logSessions.logSessions,interval)  
  })

program.parse()
