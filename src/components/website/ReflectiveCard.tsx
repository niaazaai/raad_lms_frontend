import { useId, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ReflectiveCardProps {
  blurStrength?: number;
  color?: string;
  metalness?: number;
  roughness?: number;
  overlayColor?: string;
  displacementStrength?: number;
  noiseScale?: number;
  specularConstant?: number;
  grayscale?: number;
  glassDistortion?: number;
  className?: string;
  style?: CSSProperties;
  /** Course thumbnail — reflective treatment is applied to this layer */
  imageSrc: string | null;
  imageAlt: string;
  /** Shown when there is no image */
  placeholder?: ReactNode;
  /** Content below the media (title, subtitle, etc.) */
  children: ReactNode;
}

const ReflectiveCard = ({
  blurStrength = 12,
  color = "white",
  metalness = 1,
  roughness = 0.4,
  overlayColor = "rgba(255, 255, 255, 0.1)",
  displacementStrength = 20,
  noiseScale = 1,
  specularConstant = 1.2,
  grayscale = 0.35,
  glassDistortion = 8,
  className = "",
  style = {},
  imageSrc,
  imageAlt,
  placeholder,
  children,
}: ReflectiveCardProps) => {
  const filterId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const filterRef = `metallic-${filterId}`;

  const baseFrequency = 0.03 / Math.max(0.1, noiseScale);
  const saturation = 1 - Math.max(0, Math.min(1, grayscale));

  const cssVariables = {
    "--blur-strength": `${blurStrength}px`,
    "--metalness": String(metalness),
    "--roughness": String(roughness),
    "--overlay-color": overlayColor,
    "--text-color": color,
    "--saturation": String(saturation),
  } as CSSProperties;

  return (
    <div
      className={cn(
        "group relative isolate flex h-full w-full flex-col overflow-hidden rounded-[1.25rem] border border-border bg-[#0c1422] font-sans shadow-sm",
        className,
      )}
      style={{ ...style, ...cssVariables }}
    >
      <svg className="pointer-events-none absolute h-0 w-0 opacity-0" aria-hidden>
        <defs>
          <filter id={filterRef} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="turbulence" baseFrequency={baseFrequency} numOctaves="2" result="noise" />
            <feColorMatrix in="noise" type="luminanceToAlpha" result="noiseAlpha" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={displacementStrength}
              xChannelSelector="R"
              yChannelSelector="G"
              result="rippled"
            />
            <feSpecularLighting
              in="noiseAlpha"
              surfaceScale={displacementStrength}
              specularConstant={specularConstant}
              specularExponent="20"
              lightingColor="#ffffff"
              result="light"
            >
              <fePointLight x="0" y="0" z="300" />
            </feSpecularLighting>
            <feComposite in="light" in2="rippled" operator="in" result="light-effect" />
            <feBlend in="light-effect" in2="rippled" mode="screen" result="metallic-result" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="solidAlpha"
            />
            <feMorphology in="solidAlpha" operator="erode" radius="45" result="erodedAlpha" />
            <feGaussianBlur in="erodedAlpha" stdDeviation="10" result="blurredMap" />
            <feComponentTransfer in="blurredMap" result="glassMap">
              <feFuncA type="linear" slope="0.5" intercept="0" />
            </feComponentTransfer>
            <feDisplacementMap
              in="metallic-result"
              in2="glassMap"
              scale={glassDistortion}
              xChannelSelector="A"
              yChannelSelector="A"
              result="final"
            />
          </filter>
        </defs>
      </svg>

      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-gradient-to-br from-primary/30 via-[#1a3a5c] to-auxiliary/40">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={imageAlt}
            loading="lazy"
            className="absolute inset-0 h-full w-full scale-[1.02] object-cover transition-transform duration-300 group-hover:scale-105"
            style={{
              filter: `saturate(${saturation}) contrast(115%) brightness(108%) blur(${blurStrength}px) url(#${filterRef})`,
            }}
          />
        ) : (
          <div className="flex h-full min-h-[140px] w-full items-center justify-center text-white/50">
            {placeholder}
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 z-[1] opacity-[var(--roughness,0.4)] mix-blend-overlay bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%270%200%20200%20200%27%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%3E%3Cfilter%20id%3D%27noiseFilter%27%3E%3CfeTurbulence%20type%3D%27fractalNoise%27%20baseFrequency%3D%270.8%27%20numOctaves%3D%273%27%20stitchTiles%3D%27stitch%27%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%27100%25%27%20height%3D%27100%25%27%20filter%3D%27url(%23noiseFilter)%27%2F%3E%3C%2Fsvg%3E')]" />

        <div className="pointer-events-none absolute inset-0 z-[2] mix-blend-overlay opacity-[var(--metalness,1)] bg-[linear-gradient(135deg,rgba(255,255,255,0.35)_0%,rgba(255,255,255,0.08)_40%,rgba(255,255,255,0)_50%,rgba(255,255,255,0.06)_62%,rgba(255,255,255,0.25)_100%)]" />

        <div className="pointer-events-none absolute inset-0 z-[3] rounded-t-[1.25rem] bg-[linear-gradient(to_top,rgba(6,20,40,0.85)_0%,rgba(6,20,40,0.2)_45%,transparent_100%)]" />

        <div className="pointer-events-none absolute inset-0 z-[4] rounded-t-[1.25rem] p-px bg-border/80 [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask-composite:exclude]" />
      </div>

      <div
        className="relative z-10 flex flex-1 flex-col border-t border-border bg-[var(--overlay-color)] text-[var(--text-color)]"
        style={{ color }}
      >
        {children}
      </div>
    </div>
  );
};

export default ReflectiveCard;
