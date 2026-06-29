interface AiIconProps {
  size?: number;
  className?: string;
}

// Brand AI logo from /public/ai_icon.svg. Used for the AI Agent nav item and
// throughout the agent chat. Rendered as a plain <img> so the optimizer doesn't
// need dangerouslyAllowSVG.
export default function AiIcon({ size = 18, className = "" }: AiIconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/ai_icon.svg"
      alt="AI"
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
