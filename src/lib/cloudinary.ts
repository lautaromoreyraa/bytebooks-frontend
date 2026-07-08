const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

export async function uploadImage(file: File): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary no está configurado. Agregá VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET en tu .env"
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    throw new Error("Error al subir la imagen a Cloudinary");
  }

  const data = await res.json();
  return data.secure_url as string;
}
