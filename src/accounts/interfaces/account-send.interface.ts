export interface AccountSend {
    CodigoCte: string;
    CodigoAbonado: string;
    Nombre: string;
    Direccion: string;
    CodigoReceptora: number;
    Status: string;
    panel?: {
      modelo: string;
      AccesoPorLinea: boolean;
      AccesoPorIP: boolean;
      AccesoPorGPRS: boolean;
      SinEnlace: boolean;
      CoordGPS: string;
    };
    datosGeneralesDetallados?: {
      Ubicacion: string;
      Municipio: string;
      Estado: string;
    }
    seguridad?: {
      PalabraDeSeg: string;
      PalabraDeSegTA: string;
      Amago: string;
    }
  }