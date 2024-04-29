/** Generated form ESMF JS SDK Angular Schematics - PLEASE DO NOT CHANGE IT **/

export interface MultiLanguageText {
    /** key defines the locale. Value is the translated text for that locale. */
    [key: string]: string;
}

export interface ComplaintCodeTestAspect {
    /**
     * Mode of complaint
     */
    complaintMode: ComplaintModes;
    aboutComplaintModeInfo: string;
}

/**
 * The collection of known complaint modes
 */
export enum ComplaintModes {
    Complaint10 = '10 : 0-mlg, provisional rework/accept. back',
    Complaint20 = '20 : 0-km, uninstalled',
    someNewEntityInstance = '97 : romanian',
}

/**
 * Complaint mode with code and description
 */
export interface ComplaintMode {
    /**
     * Code for complaint mode
     */
    complaintModeCode: ComplaintModeCode;
    /**
     * Description of complaint mode
     */
    complaintModeDescription: string;
}

/**
 * Code of complaint mode
 */
export enum ComplaintModeCode {
    NUMBER_10 = 10,
    NUMBER_20 = 20,
    NUMBER_21 = 21,
    NUMBER_30 = 30,
    NUMBER_35 = 35,
    NUMBER_40 = 40,
    NUMBER_41 = 41,
    NUMBER_42 = 42,
    NUMBER_43 = 43,
    NUMBER_50 = 50,
    NUMBER_60 = 60,
    NUMBER_61 = 61,
    NUMBER_70 = 70,
    NUMBER_75 = 75,
}
