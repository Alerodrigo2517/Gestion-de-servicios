/* eslint-disable no-console */
const logger = {
  log: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(...args);
    }
  },
  error: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      const formattedArgs = args.map(arg => {
        if (arg && typeof arg === 'object') {
          try {
            return JSON.stringify({
              message: arg.message,
              code: arg.code,
              details: arg.details,
              hint: arg.hint,
              stack: arg.stack,
              ...arg
            }, null, 2);
          } catch (e) {
            return String(arg);
          }
        }
        return arg;
      });
      console.error(...formattedArgs);
    }
  },
  warn: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(...args);
    }
  }
};

export default logger;
