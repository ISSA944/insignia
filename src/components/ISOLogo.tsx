interface ISOLogoProps {
  size?: number;
  className?: string;
}

export default function ISOLogo({ size = 36, className = "" }: ISOLogoProps) {
  return (
    <div className={`flex items-center select-none ${className}`} style={{ gap: size * 0.15 }}>
      <span
        style={{
          fontSize: size,
          fontWeight: 800,
          fontStyle: "italic",
          color: "#0d6b5f",
          letterSpacing: "-0.04em",
          lineHeight: 1,
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        ISO
      </span>
      <div
        style={{
          width: size * 0.58,
          height: size * 0.58,
          borderRadius: "50%",
          background: "#c8c4e8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: size * 0.32,
            fontWeight: 700,
            color: "#3d3a9e",
            fontStyle: "italic",
            lineHeight: 1,
            fontFamily: "Georgia, 'Times New Roman', serif",
          }}
        >
          I
        </span>
      </div>
    </div>
  );
}
