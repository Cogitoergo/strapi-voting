import { Request, Response, NextFunction } from "express";
import { FingerprintConfig } from "./types";
export * from "./types";
declare const Fingerprint: (setting?: FingerprintConfig) => (req: Request, res: Response, next: NextFunction) => void;
export default Fingerprint;
