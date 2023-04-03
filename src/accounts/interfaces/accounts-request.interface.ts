export interface AccountsRequest {
    zones?: boolean;
    partitions?: boolean;
    users?: boolean;
    contacts?: boolean;
    panel?: boolean;
    security?: boolean;
    generalData?: boolean;
    deviceZone?: boolean;
    state?: number;
}