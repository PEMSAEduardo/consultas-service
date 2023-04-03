export interface Comment{
    CodigoCliente: string;
    FechaHoraEvento: string; 
    FechaHoraLlamada: string; 
    TelefonoAl: string;
    Contacto: string;
    Comentario: string;
}

export interface CommentSend{
    CodigoCliente: string;
    FechaEvento: string;
    HoraEvento: string;
    FechaLlamada: string;
    HoraLlamada: string;
    TelefonoAl: string;
    Contacto: string;
    Comentario: string;
}