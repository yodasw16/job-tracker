// Log event names and database error codes only; never job content or credentials.
export const logger = {
  error(event: string, code?: string) {
    console.error(JSON.stringify({ level: "error", event, code }));
  },
  info(event: string) {
    console.info(JSON.stringify({ level: "info", event }));
  },
};
