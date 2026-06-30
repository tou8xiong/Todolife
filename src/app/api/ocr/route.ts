import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const LAYOUT_PROMPTS: Record<string, string> = {
    auto: "Preserve the original layout including line breaks, columns, indentation, and paragraph spacing.",
    block: "Extract as a single flowing text block, ignoring visual columns or formatting.",
    sparse: "Extract each visible text element separately, one per line.",
    line: "Extract text line by line exactly as it appears top to bottom.",
};

export async function POST(req: NextRequest) {
    try {
        const { imageData, mimeType, langs, layoutMode } = await req.json();

        if (!imageData) {
            return NextResponse.json({ error: "No image data provided" }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const langNames = (langs as string[] | undefined)?.filter(Boolean).join(", ");
        const langHint = langNames ? `The document may contain text in: ${langNames}.` : "";
        const layoutHint = LAYOUT_PROMPTS[layoutMode as string] ?? LAYOUT_PROMPTS.auto;

        const prompt = `Extract all text from this image exactly as it appears. ${layoutHint} ${langHint} Return only the extracted text with no explanations, labels, or commentary.`;

        const base64 = (imageData as string).replace(/^data:image\/\w+;base64,/, "");
        const imageMime = (mimeType as string) || "image/jpeg";

        const result = await model.generateContent([
            prompt,
            { inlineData: { mimeType: imageMime, data: base64 } },
        ]);

        const text = result.response.text().trim();

        if (!text) {
            return NextResponse.json({ error: "No text detected in image" }, { status: 422 });
        }

        return NextResponse.json({ text });
    } catch (err) {
        console.error("OCR route error:", err);
        return NextResponse.json({ error: "Failed to extract text" }, { status: 500 });
    }
}
