import { FingerprintResultComponent, FingerprintParameter } from "../types";
export interface AcceptHeaders extends FingerprintResultComponent {
    acceptHeaders: {
        accept: string;
        language: string;
    };
}
export declare const acceptHeaders: FingerprintParameter<AcceptHeaders>;
