// src/utils/UploadImage.ts
import Axios from "@/lib/Axios";

const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("image", file);

  const { data } = await Axios.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data.url;
};

export default uploadImage;
