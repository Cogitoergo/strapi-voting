import { FingerprintResultComponent, FingerprintParameter } from "../types";
interface Useragent extends FingerprintResultComponent {
    useragent: {
        browser: {
            family: string;
            version: string;
        };
        device: {
            family: string;
            version: string;
        };
        os: {
            family: string;
            major: string;
            minor: string;
        };
    };
}
export declare const useragent: FingerprintParameter<Useragent>;
export {};
