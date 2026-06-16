/* eslint-disable no-console */
const logger = {
  log: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(...args);
    }
  },
  info: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.info(...args);
    }
  },
  warn: (...args) => {
    // Warnings are kept in production for remote monitoring or local logs
    console.warn(...args);
  },
  error: (...args) => {
    // Errors are kept in production. Custom detailed stringification is only for development.
    if (process.env.NODE_ENV !== 'production') {
      const formattedArgs = args.map((arg) => {
        if (arg && typeof arg === 'object') {
          try {
            return JSON.stringify(
              {
                message: arg.message,
                code: arg.code,
                details: arg.details,
                hint: arg.hint,
                stack: arg.stack,
                ...arg,
              },
              null,
              2
            );
          } catch (e) {
            return String(arg);
          }
        }
        return arg;
      });
      console.error(...formattedArgs);
    } else {
      console.error(...args);
    }
  },
};

export default logger;
