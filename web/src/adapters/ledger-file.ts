import { LedgerSource } from "../lib/ports";
import { Envelope } from "../lib/types";
import demoData from "../../data/demo-sessions.json";

export class FileLedgerSource implements LedgerSource {
  async load(): Promise<Envelope> {
    return demoData as unknown as Envelope;
  }
}
