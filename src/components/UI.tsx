import { useEffect, useState } from "react";
import { useGame } from "../Game";

// UI timing constants
const INSTRUCTIONS_DISPLAY_MS = 4000; // How long to show instructions before fading
const ANIMATION_FRAME_INTERVAL_MS = 16; // Update interval for animations (~60fps)
const SHOT_FLASH_DURATION_MS = 100; // Duration of white flash when shooting
const HIT_INDICATOR_DURATION_MS = 150; // Duration of red crosshair when hitting target

export const UI = () => {
  const {
    distance,
    kills,
    score,
    isGameOver,
    startGame,
    lastShotTime,
    lastHitTime,
  } = useGame();
  const [showInstructions, setShowInstructions] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isMobile, setIsMobile] = useState(false);
  const [isSlowMoPressed, setIsSlowMoPressed] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      setIsMobile(hasTouch);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInstructions(false);
    }, INSTRUCTIONS_DISPLAY_MS);

    return () => clearTimeout(timer);
  }, []);

  // Update current time for animations
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, ANIMATION_FRAME_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  // Slow-mo button handlers (simulate spacebar for mobile)
  const handleSlowMoStart = () => {
    setIsSlowMoPressed(true);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
  };

  const handleSlowMoEnd = () => {
    setIsSlowMoPressed(false);
    window.dispatchEvent(new KeyboardEvent("keyup", { key: " " }));
  };

  const distanceMeters = Math.floor(distance);
  const scoreRounded = Math.floor(score);

  // Calculate speed multiplier (same formula as GameControls)
  const BASE_SPEED = 30;
  const SPEED_SCALE_POINTS = 500;
  const SPEED_SCALE_MULTIPLIER = 1.2;
  const MAX_SPEED = 150;
  const speedTier = Math.max(0, score) / SPEED_SCALE_POINTS;
  const scaledSpeed = Math.min(
    MAX_SPEED,
    BASE_SPEED * Math.pow(SPEED_SCALE_MULTIPLIER, speedTier),
  );
  const speedMultiplier = (scaledSpeed / BASE_SPEED).toFixed(1);

  // Calculate animation states
  const timeSinceShot = currentTime - lastShotTime;
  const timeSinceHit = currentTime - lastHitTime;
  const shotFlashActive = timeSinceShot < SHOT_FLASH_DURATION_MS;
  const hitIndicatorActive = timeSinceHit < HIT_INDICATOR_DURATION_MS;
  const crosshairPulse = shotFlashActive ? 1.3 : 1;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        fontFamily: '"VT323", monospace',
        color: "#ffffff",
        zIndex: 1000,
      }}
    >
      {/* Score Display */}
      {!isGameOver && (
        <>
          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "20px",
              fontSize: "28px",
              fontWeight: "bold",
            }}
          >
            Score: {scoreRounded} | {kills} kills
          </div>
          <div
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              fontSize: "28px",
              fontWeight: "bold",
              color:
                speedMultiplier >= "3.0"
                  ? "#ffff00"
                  : speedMultiplier >= "2.0"
                    ? "#ffaa00"
                    : "#ffffff",
            }}
          >
            SPEED: {speedMultiplier}x
          </div>
        </>
      )}

      {/* Instructions (fade out after 4 seconds) */}
      {showInstructions && !isGameOver && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: 30,
            textAlign: "center",
            opacity: showInstructions ? 1 : 0,
            transition: "opacity 0.5s",
            lineHeight: "1.5",
            maxWidth: "90%",
          }}
        >
          {isMobile ? (
            <>
              <div>Drag to look around</div>
              <div>Tap to shoot asteroids</div>
              <div>Hold slow-mo button (costs score)</div>
            </>
          ) : (
            <>
              <div>Click to lock pointer</div>
              <div>Mouse to aim, click to shoot</div>
              <div>Hold SPACEBAR for slow-mo (costs score)</div>
            </>
          )}
        </div>
      )}

      {/* Crosshair */}
      {!isGameOver && (
        <>
          {/* Shot flash effect */}
          {shotFlashActive && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(255,255,255,0.15)",
                pointerEvents: "none",
              }}
            />
          )}

          {/* Center dot */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%) scale(${crosshairPulse})`,
              width: "4px",
              height: "4px",
              backgroundColor: hitIndicatorActive
                ? "rgba(255,100,100,0.9)"
                : "rgba(255,255,255,0.9)",
              borderRadius: "50%",
              transition: "transform 0.1s, background-color 0.15s",
            }}
          />

          {/* Outer ring */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%) scale(${crosshairPulse})`,
              width: "24px",
              height: "24px",
              border: `2px solid ${hitIndicatorActive ? "rgba(255,100,100,0.7)" : "rgba(255,255,255,0.6)"}`,
              borderRadius: "50%",
              transition: "transform 0.1s, border-color 0.15s",
            }}
          />
        </>
      )}

      {/* Game Over Screen */}
      {isGameOver && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "64px",
              fontWeight: "bold",
              marginBottom: "20px",
            }}
          >
            GAME OVER
          </div>
          <div
            style={{
              fontSize: "32px",
              marginBottom: "10px",
            }}
          >
            Score: {scoreRounded}
          </div>
          <div
            style={{
              fontSize: "32px",
              marginBottom: "40px",
            }}
          >
            Kills: {kills}
          </div>
          <button
            onClick={startGame}
            style={{
              pointerEvents: "all",
              fontSize: isMobile ? "20px" : "24px",
              padding: isMobile ? "20px 50px" : "15px 40px",
              backgroundColor: "#ffffff",
              color: "#000000",
              border: "none",
              cursor: "pointer",
              fontFamily: '"VT323", monospace',
              fontWeight: "bold",
              touchAction: "manipulation",
            }}
            onPointerDown={(e) => {
              e.currentTarget.style.backgroundColor = "#cccccc";
            }}
            onPointerUp={(e) => {
              e.currentTarget.style.backgroundColor = "#ffffff";
            }}
            onPointerLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ffffff";
            }}
          >
            RESTART
          </button>
        </div>
      )}

      {/* Mobile Slow-Mo Button */}
      {isMobile && !isGameOver && (
        <div
          style={{
            position: "absolute",
            bottom: "30px",
            right: "30px",
            pointerEvents: "all",
          }}
        >
          <button
            onPointerDown={handleSlowMoStart}
            onPointerUp={handleSlowMoEnd}
            onPointerLeave={handleSlowMoEnd}
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              backgroundColor: isSlowMoPressed
                ? "rgba(255,255,100,0.8)"
                : "rgba(255,255,255,0.7)",
              color: "#000000",
              border: "3px solid rgba(255,255,255,0.9)",
              fontSize: "14px",
              fontWeight: "bold",
              fontFamily: '"VT323", monospace',
              cursor: "pointer",
              touchAction: "none",
              userSelect: "none",
              WebkitTapHighlightColor: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            SLOW-MO
          </button>
        </div>
      )}
    </div>
  );
};
