import type { Metadata } from "next";
import ImageToText from "@/components/ocr/ImageToText";

export const metadata: Metadata = {
  title: "Image to Text - TodoLife",
  description: "Extract text from images using OCR technology",
};

export default function ImageToTextPage() {
  return <ImageToText />;
}
