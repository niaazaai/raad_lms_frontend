import { useEffect, useRef, useState, createElement, type CSSProperties } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string | ((t: number) => number);
  splitType?: "chars" | "words" | "lines" | "words, chars";
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  threshold?: number;
  rootMargin?: string;
  tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
  textAlign?: CSSProperties["textAlign"];
  onLetterAnimationComplete?: () => void;
  /** When false, runs the stagger animation on mount (for above-the-fold heroes). Default true (ScrollTrigger). */
  triggerOnScroll?: boolean;
}

function buildCharSpans(root: HTMLElement, source: string): HTMLElement[] {
  const spans: HTMLElement[] = [];
  const segmenter =
    typeof Intl !== "undefined" && "Segmenter" in Intl
      ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
      : null;
  const units = segmenter ? [...segmenter.segment(source)].map((s) => s.segment) : [...source];

  for (const unit of units) {
    const span = document.createElement("span");
    span.className = "split-char inline-block";
    span.textContent = unit === " " ? "\u00A0" : unit;
    span.style.willChange = "transform, opacity";
    root.appendChild(span);
    if (unit.trim() !== "" || unit === " ") {
      spans.push(span);
    }
  }
  return spans;
}

function buildWordSpans(root: HTMLElement, source: string): HTMLElement[] {
  const spans: HTMLElement[] = [];
  const words = source.trim().split(/\s+/).filter(Boolean);
  words.forEach((word, i) => {
    const span = document.createElement("span");
    span.className = "split-word inline-block whitespace-nowrap";
    span.style.willChange = "transform, opacity";
    if (i < words.length - 1) {
      span.style.marginRight = "0.3em";
    }
    span.textContent = word;
    root.appendChild(span);
    spans.push(span);
  });
  return spans;
}

function buildLineSpans(root: HTMLElement, source: string): HTMLElement[] {
  const lines = source.split("\n");
  const spans: HTMLElement[] = [];
  lines.forEach((line, i) => {
    const span = document.createElement("span");
    span.className = "split-line block";
    span.style.willChange = "transform, opacity";
    span.textContent = line;
    root.appendChild(span);
    spans.push(span);
    if (i < lines.length - 1) {
      root.appendChild(document.createElement("br"));
    }
  });
  return spans;
}

function buildWordsThenChars(root: HTMLElement, source: string): HTMLElement[] {
  const out: HTMLElement[] = [];
  const words = source.split(/(\s+)/);
  for (const part of words) {
    if (/^\s+$/.test(part)) {
      root.appendChild(document.createTextNode(part));
      continue;
    }
    if (part === "") continue;
    const wordWrap = document.createElement("span");
    wordWrap.className = "split-word inline-block whitespace-nowrap";
    const segmenter =
      typeof Intl !== "undefined" && "Segmenter" in Intl
        ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
        : null;
    const units = segmenter ? [...segmenter.segment(part)].map((s) => s.segment) : [...part];
    for (const unit of units) {
      const span = document.createElement("span");
      span.className = "split-char inline-block";
      span.textContent = unit === " " ? "\u00A0" : unit;
      span.style.willChange = "transform, opacity";
      wordWrap.appendChild(span);
      if (unit.trim() !== "" || unit === " ") {
        out.push(span);
      }
    }
    root.appendChild(wordWrap);
  }
  return out;
}

function assignTargets(splitType: SplitTextProps["splitType"], root: HTMLElement, text: string): HTMLElement[] {
  root.replaceChildren();
  if (!text) return [];

  const type = splitType ?? "chars";
  if (type === "words") return buildWordSpans(root, text);
  if (type === "lines") return buildLineSpans(root, text);
  if (type === "words, chars") return buildWordsThenChars(root, text);
  return buildCharSpans(root, text);
}

function scrollStart(threshold: number, rootMargin: string): string {
  const startPct = (1 - threshold) * 100;
  const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
  const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
  const marginUnit = marginMatch ? marginMatch[2] || "px" : "px";
  const sign =
    marginValue === 0 ? "" : marginValue < 0 ? `-=${Math.abs(marginValue)}${marginUnit}` : `+=${marginValue}${marginUnit}`;
  return `top ${startPct}%${sign}`;
}

const SplitText = ({
  text,
  className = "",
  delay = 50,
  duration = 1.25,
  ease = "power3.out",
  splitType = "chars",
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = "-100px",
  tag = "p",
  textAlign = "center",
  onLetterAnimationComplete,
  triggerOnScroll = true,
}: SplitTextProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const animationCompletedRef = useRef(false);
  const onCompleteRef = useRef(onLetterAnimationComplete);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    onCompleteRef.current = onLetterAnimationComplete;
  }, [onLetterAnimationComplete]);

  useEffect(() => {
    animationCompletedRef.current = false;
  }, [text, splitType]);

  useEffect(() => {
    if (document.fonts.status === "loaded") {
      setFontsLoaded(true);
    } else {
      void document.fonts.ready.then(() => {
        setFontsLoaded(true);
      });
    }
  }, []);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !text || !fontsLoaded) return;
      if (animationCompletedRef.current) return;

      const targets = assignTargets(splitType, el, text);
      if (targets.length === 0) return;

      const start = scrollStart(threshold, rootMargin);

      const tweenVars: gsap.TweenVars = {
        ...to,
        duration,
        ease,
        stagger: delay / 1000,
        onComplete: () => {
          animationCompletedRef.current = true;
          onCompleteRef.current?.();
        },
        force3D: true,
      };

      const tween = triggerOnScroll
        ? gsap.fromTo(targets, { ...from }, {
          ...tweenVars,
          scrollTrigger: {
            trigger: el,
            start,
            once: true,
            fastScrollEnd: true,
            anticipatePin: 0.4,
          },
        })
        : gsap.fromTo(targets, { ...from }, tweenVars);

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        if (triggerOnScroll) {
          ScrollTrigger.getAll().forEach((st: { trigger?: Element | null; kill: () => void }) => {
            if (st.trigger === el) st.kill();
          });
        }
        animationCompletedRef.current = false;
        el.replaceChildren();
      };
    },
    {
      dependencies: [
        text,
        delay,
        duration,
        ease,
        splitType,
        JSON.stringify(from),
        JSON.stringify(to),
        threshold,
        rootMargin,
        fontsLoaded,
        triggerOnScroll,
      ],
      scope: ref,
    },
  );

  const outerStyle: CSSProperties = {
    textAlign,
    wordWrap: "break-word",
  };

  return createElement(
    tag,
    { className, style: outerStyle },
    createElement("span", { className: "sr-only" }, text),
    createElement("span", {
      ref,
      "aria-hidden": true,
      className: cn(
        "split-parent inline-block max-w-full overflow-hidden whitespace-normal align-top",
        textAlign === "center" && "text-center",
        textAlign === "left" && "text-left",
        textAlign === "right" && "text-right",
      ),
    }),
  );
};

export default SplitText;
