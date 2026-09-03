import { LogPort } from "../lib/ports";
import { LogEntry } from "../lib/types";

export class ConsoleLogAdapter implements LogPort {
  log(entry: LogEntry): void {
    const formatted = `[Timeframe ${entry.level.toUpperCase()}] ${entry.message}`;
    if (entry.level === "error") {
      console.error(formatted, entry.context || "");
    } else if (entry.level === "warn") {
      console.warn(formatted, entry.context || "");
    } else {
      console.log(formatted, entry.context || "");
    }
  }
}
