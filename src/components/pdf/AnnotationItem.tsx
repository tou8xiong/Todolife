"use client";
import { Annotation, DrawAnnotation, ImageAnnotation } from "@/lib/pdfUtils";

interface Props {
    ann: Annotation;
    isSelected: boolean;
    onMouseDown: (e: React.MouseEvent, ann: Annotation) => void;
    onResizeMouseDown: (e: React.MouseEvent, ann: ImageAnnotation) => void;
    onClick: (e: React.MouseEvent, ann: Annotation) => void;
    onDelete: (id: number) => void;
}

export default function AnnotationItem({
    ann, isSelected, onMouseDown, onResizeMouseDown, onClick, onDelete,
}: Props) {
    const deleteBtn = (
        <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onDelete(ann.id); }}
            style={{
                position: "absolute", top: -10, right: -10,
                width: 18, height: 18, borderRadius: "50%",
                background: "#ef4444", color: "#fff",
                border: "none", fontSize: 10, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                lineHeight: 1, zIndex: 30,
            }}
        >✕</button>
    );

    // Draw annotation (pen strokes) — no x/y position, covers full container
    if (ann.type === "draw") {
        const pathD = ann.points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
        return (
            <svg
                style={{
                    position: "absolute", left: 0, top: 0,
                    width: "100%", height: "100%",
                    zIndex: isSelected ? 20 : 10,
                    pointerEvents: "none",
                    overflow: "visible",
                }}
                viewBox="0 0 1 1"
                preserveAspectRatio="none"
            >
                <path
                    d={pathD}
                    stroke={ann.color}
                    strokeWidth={ann.strokeWidth}
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ pointerEvents: "stroke", cursor: "pointer" }}
                    onMouseDown={(e) => onMouseDown(e as unknown as React.MouseEvent, ann)}
                    onClick={(e) => onClick(e as unknown as React.MouseEvent, ann)}
                />
                {isSelected && (
                    <foreignObject x="0" y="0" width="20" height="20" style={{ overflow: "visible" }}>
                        {deleteBtn}
                    </foreignObject>
                )}
            </svg>
        );
    }

    const sharedStyle: React.CSSProperties = {
        position: "absolute",
        left: `${ann.x * 100}%`,
        top: `${ann.y * 100}%`,
        cursor: "grab",
        zIndex: isSelected ? 20 : 10,
        userSelect: "none",
        outline: isSelected ? "2px dashed #f59e0b" : undefined,
        borderRadius: 2,
    };

    if (ann.type === "text") {
        return (
            <div
                style={{
                    ...sharedStyle,
                    color: ann.color,
                    fontSize: `${ann.fontSize * 0.75}px`,
                    fontFamily: "Helvetica, sans-serif",
                    fontWeight: ann.bold ? "bold" : "normal",
                    whiteSpace: "nowrap",
                    transform: "translateY(-50%)",
                    padding: "0 3px",
                }}
                onMouseDown={(e) => onMouseDown(e, ann)}
                onClick={(e) => onClick(e, ann)}
            >
                {ann.text}
                {isSelected && deleteBtn}
            </div>
        );
    }

    // Image annotation
    return (
        <div
            style={{
                ...sharedStyle,
                transform: "none",
                width: `${ann.width * 100}%`,
                height: `${ann.height * 100}%`,
            }}
            onMouseDown={(e) => onMouseDown(e, ann)}
            onClick={(e) => onClick(e, ann)}
        >
            <img
                src={ann.dataUrl}
                alt="img-annotation"
                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", pointerEvents: "none" }}
                draggable={false}
            />

            {isSelected && (
                <>
                    {deleteBtn}
                    {/* Resize handle — bottom-right corner */}
                    <div
                        onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onResizeMouseDown(e, ann);
                        }}
                        style={{
                            position: "absolute", bottom: -5, right: -5,
                            width: 14, height: 14,
                            background: "#f59e0b", borderRadius: 3,
                            cursor: "se-resize", zIndex: 30,
                        }}
                    />
                </>
            )}
        </div>
    );
}
