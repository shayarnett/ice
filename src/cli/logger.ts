const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
};

export const logger = {
  info(msg: string) {
    console.log(`${COLORS.blue}[ice]${COLORS.reset} ${msg}`);
  },
  success(msg: string) {
    console.log(`${COLORS.green}[ice]${COLORS.reset} ${msg}`);
  },
  warn(msg: string) {
    console.log(`${COLORS.yellow}[ice]${COLORS.reset} ${msg}`);
  },
  error(msg: string) {
    console.error(`${COLORS.red}[ice]${COLORS.reset} ${msg}`);
  },
  debug(msg: string) {
    if (process.env.ICE_DEBUG) {
      console.log(`${COLORS.gray}[ice:debug]${COLORS.reset} ${msg}`);
    }
  },
  time(label: string) {
    const start = performance.now();
    return () => {
      const ms = (performance.now() - start).toFixed(1);
      logger.info(`${label} ${COLORS.gray}(${ms}ms)${COLORS.reset}`);
    };
  },
};
