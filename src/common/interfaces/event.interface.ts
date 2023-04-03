export interface Event {
    CodigoCte: string,
    CodigoReceptora: number;
    FechaHora: string;
    CodigoEvento: string;
    CodigoZona: string;
    Particion: number;
    DescripcionAlarm: string;
    CodigoAlarma: string;
    NombreUsuario: string;
    DescripcionEvent: string;
    Descripcion: string;
    ClaveMonitorista: string;
    NomCalifEvento: string;
    FechaHoraPrimeraToma: string;
    FechaHoraFinalizo: string;
}

export interface EventSimple extends Event {
    CodigoAbonado: string;
    Nombre: string;
    Direccion: string;
}