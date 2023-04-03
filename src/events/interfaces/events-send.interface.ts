export interface EventSend{
    Nombre?: string;
    Direccion?: string;
    CodigoAbonado?: string;
    CodigoCte: string;
    FechaOriginal: string
    Hora: string
    CodigoEvento: string
    CodigoAlarma: string
    DescripcionAlarm: string
    CodigoZona: string
    DescripcionZona: string
    CodigoUsuario: string
    NombreUsuario: string
    DescripcionEvent: string
    Particion: number
    ClaveMonitorista: string
    NomCalifEvento: string
    FechaPrimeraToma: string
    HoraPrimeraToma: string
    FechaFinalizo: string
    HoraFinalizo: string
}
export interface EventTopSend {
    CodigoZona: string;
    DescripcionZona: string;
    CodigoUsuario: string;
    NombreUsuario: string;
    FechaOriginal: string;
    Hora: string;
    CodigoAbonado: string;
    CodigoReceptora: number;
    CodigoEvento: string;
    Particion: number;
    DescipcionAlarm: string;
    CodigoAlarma: string;
    DescripcionEvent: string;
}