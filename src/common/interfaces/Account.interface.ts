export interface Account{
    CodigoCte: string;
    CodigoAbonado: string;
    Nombre: string;
    Direccion: string;
    CodigoReceptora: number;
    Status: string;
    Ubicacion?: string;
    Municipio?: string;
    Estado?: string;
    Panel?: string;
    AccesoPorLinea?: boolean;
    AccesoPorIP?: boolean;
    AccesoPorGPRS?: boolean;
    SinEnlace?: boolean;
    CoordGPS?: string;
    PalabraDeSeg?: string;
    PalabraDeSegTA?: string;
    Amago?: string;
}