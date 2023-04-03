export interface AccountRequest {
    account: number;
    zones: boolean;
    partitions: boolean;
    users: boolean;
    contacts: boolean;
    panel: boolean;
    security: boolean;
    generalData: boolean;
    deviceZone: boolean;
}