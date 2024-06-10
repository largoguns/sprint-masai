const path = require('path');
const moment = require('moment-timezone');

function getCallerInfo() {
  const originalFunc = Error.prepareStackTrace;

  let callerInfo;
  try {
    const err = new Error();
    Error.prepareStackTrace = (err, stack) => stack;
    const currentFile = err.stack.shift().getFileName();

    // Obtener la tercera entrada en la pila (la primera es este mismo método, la segunda es log/error, la tercera es el método llamante)
    while (err.stack.length) {
      const callSite = err.stack.shift();
      if (callSite.getFileName() !== currentFile) {
        callerInfo = callSite;
        break;
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    Error.prepareStackTrace = originalFunc;
  }

  return callerInfo;
}

function logMessage(type, ...messages) {
  const callerInfo = getCallerInfo();
  if (!callerInfo) {
    console[type](...messages);
    return;
  }

  const callerMethod = callerInfo.getFunctionName() || 'anonymous';
  const fileName = path.basename(callerInfo.getFileName());
  const lineNumber = callerInfo.getLineNumber();
  const date = moment().tz('Europe/Madrid').format('YYYY-MM-DD HH:mm:ss');

  console[type](`${date} [${fileName}:${lineNumber}] [${callerMethod}] -`, ...messages);
}

function log(...messages) {
  logMessage('log', ...messages);
}

function error(...messages) {
  logMessage('error', ...messages);
}

module.exports = {
  log,
  error
};


//CAMBIOS SONOMASAI-002