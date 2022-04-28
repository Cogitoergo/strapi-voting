/// <reference types="express-serve-static-core" />
declare global {
    namespace Express {
        interface Request {
            fingerprint?: FingerprintResult;
        }
    }
}
export interface FingerprintResultComponent {
    [key: string]: any;
}
export interface FingerprintResult {
    hash: string;
    components?: FingerprintResultComponent[];
}
export declare type FingerprintNext<T extends FingerprintResultComponent> = (err: Error, result: T) => void;
export declare type FingerprintParameter<T extends FingerprintResultComponent = any> = (next: FingerprintNext<T>, req?: Express.Request, res?: Express.Response) => void;
export interface FingerprintConfig {
    req?: Express.Request;
    parameters: FingerprintParameter<any>[];
}
