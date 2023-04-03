export interface Horario{
    CodigoCte: string;
    HorarioApertura: string;
    HorarioCierre: string;
    Torerancia: string;
    SeUsaHorarios: string;
}

export interface HorarioSend {
    CodigoCte: string;
    VerificaApertura: boolean;
    VerificaCierre: boolean;
    HorariosApertura: Array<string>;
    HorariosCierre: Array<string>;
    CheckAntesApertura: boolean;
    CheckdespuesApertura: boolean;
    CheckAntesCierre: boolean;
    CheckDespuesCierre: boolean;
    ToleranciaAperturaAntes: string;
    ToleranciaAperturaDespues: string;
    ToleranciaCierreAntes: string;
    ToleranciaCierreDespues: string;
}