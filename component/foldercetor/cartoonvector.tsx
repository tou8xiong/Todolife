
"use client";
import Image from "next/image";

// List of image paths (images should be placed in the public/ folder)
const emogiprofile = [
    "/catemogi.png",
    "/dogemogi.png",
    "/coolemogi.png",
    "/togeremogi.png",
] as const;


type props = {
    setUserEmoji: (emoji: string) => void;
    userEmogi: string | null;
}

export default function EmojiProfiles({ setUserEmoji, userEmogi }: props) {
    return (
        <div className="flex flex-row justify-center">
            <ul
                style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "16px",
                }}
            >
                {emogiprofile.map((src, index) => (
                    <button
                        onClick={() => setUserEmoji(src)}
                        key={index}
                        className="cursor-pointer">
                        <Image
                            src={src}
                            alt={`emoji ${index + 1}`}
                            width={100}
                            height={100}
                            priority={index < 4}
                        />
                    </button>
                ))}
            </ul>
        </div>
    );
}