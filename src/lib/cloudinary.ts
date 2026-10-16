import { api } from "../api/client";

/** Lo que devuelve `POST /imagenes/firma`. El secreto nunca llega al navegador. */
interface FirmaDeSubida {
  firma: string;
  marcaDeTiempo: number;
  apiKey: string;
  nombreDeLaNube: string;
  carpeta: string;
}

/**
 * Sube una imagen directo a Cloudinary con una firma que emite la API.
 *
 * El archivo no pasa por el backend, pero tampoco hay un upload preset abierto:
 * con uno sin firma, cualquiera que leyera el bundle podía subir archivos a la
 * cuenta. La firma cubre sólo la carpeta y la hora, que son los únicos
 * parámetros que se mandan además del archivo.
 */
export async function uploadImage(file: File): Promise<string> {
  const firma = await api.post<FirmaDeSubida>("/imagenes/firma", {});

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", firma.apiKey);
  formData.append("timestamp", String(firma.marcaDeTiempo));
  formData.append("signature", firma.firma);
  formData.append("folder", firma.carpeta);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${firma.nombreDeLaNube}/image/upload`,
    { method: "POST", body: formData }
  );
  if (!res.ok) {
    throw new Error("Error al subir la imagen a Cloudinary");
  }
  const data = await res.json();
  return data.secure_url as string;
}
