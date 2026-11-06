"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";

const TOTAL_FRAMES = 190;
const FPS = 24;

interface VarietyDetails {
  title: string;
  badge: string;
  notes: string;
  harvestLocation: string;
  colorGrade: string;
  purity: string;
}

const VARIETIES: Record<"wildflower" | "forest", VarietyDetails> = {
  wildflower: {
    title: "Wildflower Blossom",
    badge: "🍯 Sweet & Floral",
    notes: "Sun-drenched lavender, alpine clover, citrus blossom",
    harvestLocation: "Dolomites Valley • 1,400m",
    colorGrade: "Warm Golden Amber",
    purity: "100% Raw Comb-Filtered",
  },
  forest: {
    title: "Dark Forest Honeydew",
    badge: "🌲 Rich & Woody",
    notes: "Pine sap, roasted caramel, toasted cedar, malt",
    harvestLocation: "Black Forest Hives • 920m",
    colorGrade: "Deep Molasses Amber",
    purity: "Cold-Spun Single Origin",
  },
};

const SIZES = {
  "350g": { price: 14.5, servings: "~24 spoonfuls", label: "Small / Daily" },
  "500g": { price: 19.0, servings: "~35 spoonfuls", label: "Family Favorite" },
  "1kg": { price: 32.0, servings: "~70 spoonfuls", label: "Artisan Pantry Jar" },
};

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [framesLoaded, setFramesLoaded] = useState<number>(0);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);

  // Phases: "loading" -> "playing" (fullscreen) -> "transitioning" -> "hero"
  const [sequencePhase, setSequencePhase] = useState<"loading" | "playing" | "transitioning" | "hero">("loading");

  // Hero interactive states
  const [activeTab, setActiveTab] = useState<"wildflower" | "forest">("wildflower");
  const [selectedSize, setSelectedSize] = useState<"350g" | "500g" | "1kg">("500g");
  const [beeSpeech, setBeeSpeech] = useState<string>("Bzz bzz! Pure raw nectar!");
  const [beeClicks, setBeeClicks] = useState<number>(0);
  const [addedToCartToast, setAddedToCartToast] = useState<boolean>(false);

  // 3D Tilt perspective state for the hero image card
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Refs for image preload and animation loop
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Preload frames
  useEffect(() => {
    let isCancelled = false;
    const loadedImages: HTMLImageElement[] = new Array(TOTAL_FRAMES);
    let loadedCount = 0;

    const pad = (num: number) => num.toString().padStart(3, "0");

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new window.Image();
      const frameSrc = `/frames/frame_${pad(i)}.webp`;
      img.src = frameSrc;

      img.onload = () => {
        if (isCancelled) return;
        loadedImages[i - 1] = img;
        loadedCount++;
        setFramesLoaded(loadedCount);

        // Draw first frame immediately
        if (i === 1 && canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          }
        }

        if (loadedCount === TOTAL_FRAMES) {
          imagesRef.current = loadedImages;
          setIsReady(true);
        }
      };

      img.onerror = () => {
        if (isCancelled) return;
        loadedCount++;
        setFramesLoaded(loadedCount);
        if (loadedCount === TOTAL_FRAMES) {
          imagesRef.current = loadedImages;
          setIsReady(true);
        }
      };
    }

    return () => {
      isCancelled = true;
    };
  }, []);

  // Draw a specific frame to canvas
  const drawFrame = useCallback((frameIdx: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imagesRef.current[frameIdx];
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setCurrentFrameIndex(frameIdx);
    }
  }, []);

  // Finish intro and trigger morph
  const completeIntro = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    drawFrame(TOTAL_FRAMES - 1);
    setSequencePhase("transitioning");
    setTimeout(() => {
      setSequencePhase("hero");
    }, 1000);
  }, [drawFrame]);

  // Play animation sequence from 0 to TOTAL_FRAMES - 1
  const playIntro = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }

    setSequencePhase("playing");
    startTimeRef.current = null;

    const totalDurationMs = (TOTAL_FRAMES / FPS) * 1000;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / totalDurationMs, 1);
      const targetFrame = Math.min(
        Math.floor(progress * TOTAL_FRAMES),
        TOTAL_FRAMES - 1
      );

      drawFrame(targetFrame);

      if (progress < 1) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        completeIntro();
      }
    };

    animationFrameIdRef.current = requestAnimationFrame(animate);
  }, [drawFrame, completeIntro]);

  // Autoplay on load
  useEffect(() => {
    if (isReady && sequencePhase === "loading") {
      playIntro();
    }
  }, [isReady, sequencePhase, playIntro]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, []);

  const handleReplay = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    playIntro();
  };

  const handleSkipIntro = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    completeIntro();
  };

  // Interactive 3D mouse move handler over the hero visual card
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 14, y: -y * 14 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Bee click easter egg: cycling playful messages
  const handleBeeClick = () => {
    const quotes = [
      "Bzz! Made with love from 2,000 mountain flowers!",
      "Tickles! Hands off my honey jar, hehe 🍯",
      "Fun fact: A bee visits 50 to 100 flowers in one trip!",
      "Super sweet! 100% natural raw energy 🐝✨",
      "Ready to add this golden jar to your breakfast?",
    ];
    setBeeClicks((prev) => prev + 1);
    setBeeSpeech(quotes[(beeClicks + 1) % quotes.length]);
  };

  const handleAddToCart = () => {
    setAddedToCartToast(true);
    setTimeout(() => {
      setAddedToCartToast(false);
    }, 2800);
  };

  const progressPercent = Math.round((framesLoaded / TOTAL_FRAMES) * 100);
  const isFullScreenMode = sequencePhase === "loading" || sequencePhase === "playing";
  const isHeroActive = sequencePhase === "hero" || sequencePhase === "transitioning";
  const currentVariety = VARIETIES[activeTab];

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#fbf0dc] text-[#2d1808] selection:bg-[#f59e0b] selection:text-white flex flex-col justify-between">
      
      {/* Background Ambience: Subtle floating honeycomb glow blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-[30rem] h-[30rem] rounded-full bg-orange-200/35 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-80 h-80 rounded-full bg-yellow-200/30 blur-2xl" />
      </div>

      {/* Floating Cart Notification Toast */}
      <div
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out ${
          addedToCartToast
            ? "opacity-100 -translate-y-0 scale-100"
            : "opacity-0 -translate-y-8 scale-90 pointer-events-none"
        }`}
      >
        <div className="bg-[#2d1808] text-[#fbf0dc] px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-amber-600/40 backdrop-blur-md">
          <span className="text-xl">🍯</span>
          <div className="text-xs sm:text-sm">
            <span className="font-bold text-amber-400">Added to Basket!</span>{" "}
            {currentVariety.title} ({selectedSize})
          </div>
          <span className="text-xs bg-amber-500 text-[#2d1808] font-bold px-2 py-0.5 rounded-full ml-1">
            ${SIZES[selectedSize].price.toFixed(2)}
          </span>
        </div>
      </div>

      {/* =========================================================================
          TOP NAVIGATION BAR (Compact, sleek fixed header)
      ========================================================================= */}
      <header
        className={`relative z-30 w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between transition-all duration-1000 ease-out shrink-0 ${
          isHeroActive
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-6 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl sm:text-2xl font-black tracking-tight text-[#3d200a]">
            Nectar<span className="text-[#e28308]">&</span>Co.
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-7 text-xs sm:text-sm font-semibold text-[#543014]">
          <a href="#hives" className="hover:text-[#b45309] transition-colors relative py-1 group">
            Our Hives
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#d97706] transition-all duration-300 group-hover:w-full rounded-full" />
          </a>
          <a href="#varieties" className="hover:text-[#b45309] transition-colors relative py-1 group">
            Varieties
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#d97706] transition-all duration-300 group-hover:w-full rounded-full" />
          </a>
          <a href="#harvest" className="hover:text-[#b45309] transition-colors relative py-1 group">
            Cold Harvest
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#d97706] transition-all duration-300 group-hover:w-full rounded-full" />
          </a>
          <a href="#reviews" className="hover:text-[#b45309] transition-colors relative py-1 group">
            Reviews
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#d97706] transition-all duration-300 group-hover:w-full rounded-full" />
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReplay}
            title="Replay sequence"
            className="text-xs font-semibold px-3.5 py-1.5 rounded-full border border-[#d6be9f] text-[#6b3c16] hover:bg-[#edd9be] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <span>↺</span> Replay Intro
          </button>
          <button
            onClick={handleAddToCart}
            className="px-4 py-2 rounded-full bg-[#2d1808] text-[#fbf0dc] font-semibold text-xs sm:text-sm hover:bg-[#4a280e] transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
          >
            <span>Order Jars</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          </button>
        </div>
      </header>

      {/* Fullscreen Skip Button during Intro */}
      {isFullScreenMode && (
        <div className="fixed top-8 right-8 z-50">
          <button
            onClick={handleSkipIntro}
            className="text-xs font-bold px-5 py-2.5 rounded-full bg-black/75 hover:bg-black text-white backdrop-blur-md border border-white/20 transition-all duration-200 cursor-pointer shadow-2xl flex items-center gap-2 group hover:scale-105"
          >
            <span>Skip Intro</span>
            <span className="group-hover:translate-x-0.5 transition-transform">⏩</span>
          </button>
        </div>
      )}

      {sequencePhase === "playing" && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-2.5 rounded-full bg-black/75 backdrop-blur-md text-white text-xs font-medium border border-white/10 shadow-2xl">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Playing intro ({currentFrameIndex + 1}/{TOTAL_FRAMES})</span>
          <span className="font-mono text-[11px] opacity-75">
            {((currentFrameIndex + 1) / FPS).toFixed(1)}s
          </span>
        </div>
      )}

      {/* =========================================================================
          HERO MAIN CONTENT (Flex-1, perfectly fit without page scrolling)
      ========================================================================= */}
      <main className="relative z-20 flex-1 w-full max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-10 py-1 min-h-0">
        
        {/* Left Column: Hero Copy, Variety Selector & Dynamic Specs */}
        <div
          className={`flex-1 max-w-xl transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col justify-center ${
            isHeroActive
              ? "opacity-100 translate-x-0 translate-y-0 pointer-events-auto"
              : "opacity-0 -translate-x-12 translate-y-4 pointer-events-none"
          }`}
        >
          {/* Tag Pill with Pulse */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f3e0c4] border border-[#e5cbab] text-[#7e4318] text-[11px] font-bold uppercase tracking-wider mb-3 shadow-xs w-fit">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600" />
            </span>
            <span>Spring Bloom Batch • Single Estate</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-black text-[#2e1707] tracking-tight leading-[1.08] mb-3">
            Pure drops. <br />
            <span className="bg-gradient-to-r from-[#d97706] to-[#b45309] bg-clip-text text-transparent">
              Sweeter mornings.
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-[#613615] leading-relaxed mb-4 max-w-md font-medium">
            100% raw, unheated honey produced by our wild mountain bees. Cold-extracted, coarse-filtered, and jarred straight from the comb into your breakfast bowl.
          </p>

          {/* Interactive Card: Variety, Live Tasting Notes & Size Selector */}
          <div className="bg-[#f5e4cc]/95 backdrop-blur-md p-4 rounded-2xl border border-[#e2cbaf] shadow-md shadow-amber-900/5 mb-4 space-y-3">
            {/* Variety Tabs */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7e461b]">
                  Select Honey Harvest
                </span>
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                  {currentVariety.colorGrade}
                </span>
              </div>

              <div className="grid grid-cols-2 p-1 bg-[#ecd5b7] rounded-xl gap-1">
                <button
                  onClick={() => {
                    setActiveTab("wildflower");
                    setBeeSpeech("Wildflower has delicate floral honey notes!");
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer text-center ${
                    activeTab === "wildflower"
                      ? "bg-[#2d1808] text-[#fbf0dc] shadow-md scale-[1.01]"
                      : "text-[#623816] hover:text-[#2d1808] hover:bg-[#e4cbab]"
                  }`}
                >
                  🍯 Wildflower Bloom
                </button>
                <button
                  onClick={() => {
                    setActiveTab("forest");
                    setBeeSpeech("Dark Forest is intensely rich with pine and caramel!");
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer text-center ${
                    activeTab === "forest"
                      ? "bg-[#2d1808] text-[#fbf0dc] shadow-md scale-[1.01]"
                      : "text-[#623816] hover:text-[#2d1808] hover:bg-[#e4cbab]"
                  }`}
                >
                  🌲 Dark Forest Amber
                </button>
              </div>
            </div>

            {/* Dynamic Taste Profile Box based on selection */}
            <div className="bg-[#fbf0dc]/90 p-2.5 rounded-xl border border-[#e6cfae] flex items-start gap-2.5">
              <span className="text-lg">🌸</span>
              <div className="text-xs space-y-0.5">
                <div className="font-bold text-[#3d200a] text-[11px]">Tasting Notes:</div>
                <div className="text-[#6d3e18] leading-tight italic text-[11px]">
                  "{currentVariety.notes}"
                </div>
              </div>
            </div>

            {/* Jar Size Selector & Dynamic Pricing */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#e5cbab]">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7e461b] block mb-1">
                  Jar Size:
                </span>
                <div className="flex items-center gap-1.5">
                  {(["350g", "500g", "1kg"] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => {
                        setSelectedSize(sz);
                        setBeeSpeech(`The ${sz} jar is a great choice!`);
                      }}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all duration-150 cursor-pointer ${
                        selectedSize === sz
                          ? "bg-[#d97706] text-white border-[#b45309] shadow-xs scale-105"
                          : "bg-[#fbf0dc] text-[#5c3212] border-[#dac3a3] hover:border-[#b45309]"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-[#874f22] block font-medium">
                  {SIZES[selectedSize].servings}
                </span>
                <div className="text-xl font-black text-[#2e1707] tracking-tight">
                  ${SIZES[selectedSize].price.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* CTA Row */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleAddToCart}
              className="px-6 py-3 rounded-full bg-[#d97706] hover:bg-[#b45309] text-white font-extrabold text-sm shadow-lg shadow-[#d97706]/35 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer flex items-center gap-2 group"
            >
              <span>Add Jar to Basket</span>
              <span className="text-base group-hover:translate-x-1 transition-transform">→</span>
            </button>
            <button
              onClick={handleBeeClick}
              className="px-5 py-3 rounded-full border-2 border-[#542d0f] text-[#3d200a] hover:bg-[#2d1808] hover:text-[#fbf0dc] font-bold text-sm transition-all duration-200 cursor-pointer flex items-center gap-2"
            >
              <span>Say Hi to Bee</span>
              <span className="text-base">🐝</span>
            </button>
          </div>

          {/* Trust Badges */}
          <div className="mt-4 pt-3 border-t border-[#edd8bd] flex items-center gap-5 text-[11px] font-semibold text-[#7e481f]">
            <div className="flex items-center gap-1">
              <span className="text-amber-600 font-bold">✓</span> Raw & Unpasteurized
            </div>
            <div className="flex items-center gap-1">
              <span className="text-amber-600 font-bold">✓</span> Zero Additives
            </div>
            <div className="flex items-center gap-1">
              <span className="text-amber-600 font-bold">✓</span> Ethical Alpine Hives
            </div>
          </div>
        </div>

        {/* Right Column / Stage Wrapper with 3D Tilt & Interactive Hotspots */}
        <div className="flex-1 w-full flex flex-col items-center justify-center relative min-h-0">
          
          {/* Speech Bubble: Interactive & Clickable with speech updates */}
          <div
            onClick={handleBeeClick}
            className={`absolute -top-7 right-2 sm:right-6 z-30 transition-all duration-700 ease-out transform cursor-pointer group ${
              sequencePhase === "hero"
                ? "opacity-100 scale-100 translate-y-0 animate-float-gentle"
                : "opacity-0 scale-75 translate-y-4 pointer-events-none"
            }`}
          >
            <div className="relative bg-white/95 text-[#2d1808] px-3.5 py-2 rounded-2xl shadow-xl border border-[#ecd2b2] text-xs font-bold flex items-center gap-2 backdrop-blur-sm group-hover:scale-105 transition-transform">
              <span className="text-base animate-bounce">🐝</span>
              <span className="text-[#3d200a]">{beeSpeech}</span>
              <span className="text-[9px] text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full font-bold">
                Tap me
              </span>
              <div className="absolute -bottom-2 left-6 w-3 h-3 bg-white border-b border-r border-[#ecd2b2] transform rotate-45" />
            </div>
          </div>

          {/* DYNAMIC MORPHING CONTAINER */}
          <div
            ref={stageRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              transform:
                sequencePhase === "hero"
                  ? `perspective(1000px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`
                  : "none",
              transition:
                sequencePhase === "hero"
                  ? "transform 0.15s ease-out"
                  : "all 1s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            className={`overflow-hidden ${
              isFullScreenMode
                ? "fixed inset-0 z-40 w-screen h-screen rounded-none shadow-none border-none bg-black"
                : "relative w-full max-w-[560px] aspect-[16/9] rounded-3xl shadow-2xl border-4 border-[#ecd2b2] bg-[#fbf0dc] z-20"
            }`}
          >
            {/* 1. Canvas that plays all 190 frames */}
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              className={`w-full h-full object-cover transition-opacity duration-700 ${
                sequencePhase === "hero" ? "opacity-0 pointer-events-none" : "opacity-100"
              }`}
            />

            {/* 2. Seamless Interactive Hero Resting Stage */}
            <div
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                sequencePhase === "hero" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
              }`}
            >
              <Image
                src="/hero-bee.jpg"
                alt="Cute bumblebee hugging a fresh jar of golden honey"
                fill
                priority
                className="object-cover transform hover:scale-[1.03] transition-transform duration-700 ease-out cursor-pointer"
                onClick={handleBeeClick}
              />

              {/* Ambient Warm Golden Sunlight Glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-amber-200/20 pointer-events-none animate-pulse-glow" />

              {/* Interactive Hotspot 1: Bee Hugging the Jar */}
              <div
                onMouseEnter={() => {
                  setBeeSpeech("That's me! Your resident master pollinator 🌸");
                }}
                onClick={handleBeeClick}
                className="absolute top-[28%] left-[28%] -translate-x-1/2 -translate-y-1/2 z-30 cursor-pointer group"
              >
                <div className="relative flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-7 w-7 rounded-full bg-amber-400 opacity-60" />
                  <div className="w-5 h-5 rounded-full bg-white/90 shadow-md border-2 border-amber-500 flex items-center justify-center text-[10px] group-hover:scale-125 transition-transform">
                    🐝
                  </div>
                </div>
              </div>

              {/* Interactive Hotspot 2: The Big Honey Jar */}
              <div
                onMouseEnter={() => {
                  setBeeSpeech("Thick, unpasteurized honey full of natural enzymes!");
                }}
                className="absolute top-[55%] left-[56%] -translate-x-1/2 -translate-y-1/2 z-30 cursor-pointer group"
              >
                <div className="relative flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-7 w-7 rounded-full bg-yellow-400 opacity-60" />
                  <div className="w-5 h-5 rounded-full bg-white/90 shadow-md border-2 border-amber-600 flex items-center justify-center text-[10px] group-hover:scale-125 transition-transform">
                    🍯
                  </div>
                </div>
              </div>

              {/* Interactive Hotspot 3: Golden Honey Dipper */}
              <div
                onMouseEnter={() => {
                  setBeeSpeech("Caramelized drip straight from the mountain comb!");
                }}
                className="absolute bottom-[16%] left-[62%] -translate-x-1/2 -translate-y-1/2 z-30 cursor-pointer group"
              >
                <div className="relative flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-amber-300 opacity-70" />
                  <div className="w-4 h-4 rounded-full bg-white/90 shadow-md border-2 border-amber-500 flex items-center justify-center text-[9px] group-hover:scale-125 transition-transform">
                    ✨
                  </div>
                </div>
              </div>

              {/* Interactive Jar Spotlight Badges */}
              <div className="absolute bottom-4 left-4 z-20 bg-black/65 backdrop-blur-md text-white text-[10px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/15 shadow-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{currentVariety.title}</span>
                <span className="text-amber-300">•</span>
                <span className="text-amber-300 font-bold">{selectedSize} (${SIZES[selectedSize].price.toFixed(2)})</span>
              </div>
            </div>

            {/* Preloader overlay while frames download */}
            {!isReady && (
              <div className="absolute inset-0 bg-[#fbf0dc] flex flex-col items-center justify-center gap-3 z-50">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl shadow-inner animate-bounce">
                  🐝
                </div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#7e4318]">
                  Preparing hive intro... {progressPercent}%
                </p>
                <div className="w-48 h-1.5 bg-[#ebd5b8] rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-150 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Interactive footer under hero stage */}
          {sequencePhase === "hero" && (
            <div className="w-full max-w-[560px] mt-2.5 flex items-center justify-between text-[11px] font-medium text-[#7d481d] px-2 animate-fade-in">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Move cursor for 3D tilt • Tap glowing dots</span>
              </div>
              <button
                onClick={handleReplay}
                className="text-[#b45309] hover:underline cursor-pointer flex items-center gap-1 font-semibold"
              >
                <span>↺</span> Replay intro
              </button>
            </div>
          )}
        </div>
      </main>

      {/* =========================================================================
          DECORATIVE COMPACT ORGANIC HONEY WAVE FOOTER (Locked within 100vh)
      ========================================================================= */}
      <footer
        className={`relative w-full overflow-hidden leading-none z-10 transition-all duration-1000 ease-out shrink-0 ${
          isHeroActive
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-12 pointer-events-none"
        }`}
      >
        <svg
          viewBox="0 0 1440 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-8 sm:h-10 text-[#3d1f08] fill-current"
          preserveAspectRatio="none"
        >
          <path d="M0,16L48,21.3C96,26.7,192,37.3,288,40C384,42.7,480,37.3,576,32C672,26.7,768,21.3,864,24C960,26.7,1056,37.3,1152,40C1248,42.7,1344,37.3,1392,34.7L1440,32L1440,60L1392,60C1344,60,1248,60,1152,60C1056,60,960,60,864,60C768,60,672,60,576,60C480,60,384,60,288,60C192,60,96,60,48,60L0,60Z" />
        </svg>

        <div className="bg-[#3d1f08] text-[#edd5b8] py-2.5 px-6 text-center text-xs font-medium flex flex-wrap items-center justify-center gap-6">
          <span>✨ 100% Unpasteurized Honey</span>
          <span className="opacity-40">•</span>
          <span>🍯 Harvested With Sustainable Care</span>
          <span className="opacity-40">•</span>
          <span>🚚 Free Express Shipping Over $45</span>
        </div>
      </footer>
    </div>
  );
}
