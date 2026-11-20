(function () {
  const { useState, useEffect, useRef, useMemo } = React;
  window.IFinityHub = window.IFinityHub || {};

  function BlurText({
    text = "",
    highlightWord = "",
    delay = 40,
    className = "",
    animateBy = "letters",
    direction = "bottom",
    threshold = 0.1,
    rootMargin = "0px",
    onAnimationComplete,
    stepDuration = 0.45,
    blur = 8,
    distance = 40,
    effect = "tilt",
    staggerFrom = "start",
    trigger = "view",
    loop = false,
    loopDelay = 2,
    color = "#10b981",
    fromColor = "#ffffff",
    focusOnHover = false,
  }) {
    const containerRef = useRef(null);
    const pieceRefs = useRef([]);
    const [started, setStarted] = useState(trigger === "load");
    const [focusWordIdx, setFocusWordIdx] = useState(-1);
    const completeRef = useRef(onAnimationComplete);
    completeRef.current = onAnimationComplete;

    const words = useMemo(() => text.split(" "), [text]);

    const groups = useMemo(() => {
      let globalIdx = 0;
      return words.map((word, w) => {
        const isLast = w === words.length - 1;
        const isHighlighted =
          highlightWord && word.replace(/[.,!?]/g, "") === highlightWord;
        const items = [];

        if (animateBy === "words") {
          items.push({
            key: `word-${w}`,
            content: isLast ? word : `${word}\u00A0`,
            index: globalIdx++,
            isHighlighted,
          });
        } else {
          Array.from(word).forEach((char, c) => {
            items.push({
              key: `char-${w}-${c}`,
              content: char,
              index: globalIdx++,
              isHighlighted,
            });
          });
          if (!isLast) {
            items.push({
              key: `space-${w}`,
              content: "\u00A0",
              index: globalIdx++,
              isHighlighted: false,
            });
          }
        }
        return { word, items, isHighlighted };
      });
    }, [words, animateBy, highlightWord]);

    const totalPieces = useMemo(
      () => groups.reduce((acc, g) => acc + g.items.length, 0),
      [groups]
    );

    const ranks = useMemo(() => {
      const arr = Array.from({ length: totalPieces }, (_, i) => i);
      if (staggerFrom === "end") return arr.map((i) => totalPieces - 1 - i);
      if (staggerFrom === "center") {
        const mid = (totalPieces - 1) / 2;
        const offset = totalPieces % 2 === 0 ? 0.5 : 0;
        return arr.map((i) => Math.abs(i - mid) - offset);
      }
      return arr;
    }, [totalPieces, staggerFrom]);

    useEffect(() => {
      if (trigger !== "view" || started) return;
      const el = containerRef.current;
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setStarted(true);
            observer.disconnect();
          }
        },
        { threshold, rootMargin }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, [trigger, started, threshold, rootMargin]);

    const runAnimation = () => {
      const sign = direction === "top" || direction === "left" ? -1 : 1;
      const isHorizontal = direction === "left" || direction === "right";
      const durationMs = stepDuration * 2 * 1000;
      const maxRank = ranks.reduce((m, r) => Math.max(m, r), 0);

      pieceRefs.current.forEach((el, idx) => {
        if (!el) return;
        const rank = ranks[idx] ?? idx;
        const pieceDelay = rank * Math.max(0, delay);
        const targetColor =
          el.dataset.highlighted === "true" ? color : "#ffffff";

        let keyframes;
        if (effect === "tilt") {
          const rotProp = isHorizontal ? "rotateY" : "rotateX";
          const lean = isHorizontal ? sign : -sign;
          const transProp = isHorizontal ? "translateX" : "translateY";
          keyframes = [
            {
              filter: `blur(${blur}px)`,
              opacity: 0,
              color: fromColor || "#ffffff",
              transform: `perspective(600px) ${transProp}(${sign * distance * 0.5}px) ${rotProp}(${lean * 55}deg)`,
            },
            {
              filter: `blur(${blur * 0.15}px)`,
              opacity: 0.95,
              color: targetColor,
              transform: `perspective(600px) ${transProp}(${-sign * distance * 0.04}px) ${rotProp}(${-lean * 8}deg)`,
              offset: 0.6,
            },
            {
              filter: "blur(0px)",
              opacity: 1,
              color: targetColor,
              transform: `perspective(600px) ${transProp}(0px) ${rotProp}(0deg)`,
            },
          ];
        } else {
          const transProp = isHorizontal ? "translateX" : "translateY";
          keyframes = [
            {
              filter: `blur(${blur}px)`,
              opacity: 0,
              color: fromColor || "#ffffff",
              transform: `${transProp}(${sign * distance}px)`,
            },
            {
              filter: `blur(${blur * 0.4}px)`,
              opacity: 0.6,
              color: targetColor,
              transform: `${transProp}(${-sign * distance * 0.08}px)`,
              offset: 0.55,
            },
            {
              filter: "blur(0px)",
              opacity: 1,
              color: targetColor,
              transform: `${transProp}(0px)`,
            },
          ];
        }

        el.getAnimations().forEach((a) => a.cancel());
        el.animate(keyframes, {
          duration: durationMs,
          delay: pieceDelay,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards",
        });
      });

      const totalTimeMs = durationMs + maxRank * Math.max(0, delay);
      return window.setTimeout(() => {
        completeRef.current?.();
      }, totalTimeMs);
    };

    useEffect(() => {
      if (!started) return;
      const timer = runAnimation();
      let loopTimer;
      if (loop) {
        const maxRank = ranks.reduce((m, r) => Math.max(m, r), 0);
        const cycleMs =
          stepDuration * 2 * 1000 +
          maxRank * Math.max(0, delay) +
          Math.max(0, loopDelay) * 1000;
        loopTimer = window.setInterval(runAnimation, cycleMs);
      }
      return () => {
        window.clearTimeout(timer);
        if (loopTimer) window.clearInterval(loopTimer);
      };
    }, [started, text, effect, direction, delay, stepDuration, blur, distance, loop, loopDelay]);

    const dim = Math.min(6, Math.max(2, blur * 0.3));

    return (
      <h1
        ref={containerRef}
        className={className}
        style={{
          display: "flex",
          flexWrap: "wrap",
          cursor: trigger === "click" ? "pointer" : undefined,
        }}
        onPointerEnter={trigger === "hover" ? runAnimation : undefined}
        onClick={trigger === "click" ? runAnimation : undefined}
        aria-label={text}
      >
        {groups.map((group, w) => {
          const dimmed =
            focusOnHover && focusWordIdx !== -1 && focusWordIdx !== w;
          return (
            <span
              key={`word-${w}`}
              style={{
                display: "inline-flex",
                filter: dimmed ? `blur(${dim}px)` : "blur(0px)",
                opacity: dimmed ? 0.3 : 1,
                transition:
                  "filter 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
              onPointerEnter={
                focusOnHover ? () => setFocusWordIdx(w) : undefined
              }
              onPointerLeave={
                focusOnHover ? () => setFocusWordIdx(-1) : undefined
              }
            >
              {group.items.map((piece) => (
                <span
                  key={piece.key}
                  aria-hidden="true"
                  data-highlighted={piece.isHighlighted ? "true" : "false"}
                  ref={(el) => {
                    pieceRefs.current[piece.index] = el;
                  }}
                  style={{
                    display: "inline-block",
                    willChange: "transform, filter, opacity",
                    opacity: started ? undefined : 0,
                    transformOrigin:
                      direction === "top"
                        ? "50% 0%"
                        : direction === "bottom"
                          ? "50% 100%"
                          : "50% 50%",
                  }}
                >
                  {piece.content}
                </span>
              ))}
            </span>
          );
        })}
      </h1>
    );
  }

  window.IFinityHub.BlurText = BlurText;
})();