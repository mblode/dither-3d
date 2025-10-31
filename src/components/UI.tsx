import { useEffect, useState } from 'react'
import { useGame } from '../Game'

// UI timing constants
const INSTRUCTIONS_DISPLAY_MS = 4000 // How long to show instructions before fading
const ANIMATION_FRAME_INTERVAL_MS = 16 // Update interval for animations (~60fps)
const SHOT_FLASH_DURATION_MS = 100 // Duration of white flash when shooting
const HIT_INDICATOR_DURATION_MS = 150 // Duration of red crosshair when hitting target

export const UI = () => {
  const { distance, kills, score, isGameOver, startGame, lastShotTime, lastHitTime } = useGame()
  const [showInstructions, setShowInstructions] = useState(true)
  const [currentTime, setCurrentTime] = useState(Date.now())

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInstructions(false)
    }, INSTRUCTIONS_DISPLAY_MS)

    return () => clearTimeout(timer)
  }, [])

  // Update current time for animations
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, ANIMATION_FRAME_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [])

  const distanceMeters = Math.floor(distance)
  const scoreRounded = Math.floor(score)

  // Calculate animation states
  const timeSinceShot = currentTime - lastShotTime
  const timeSinceHit = currentTime - lastHitTime
  const shotFlashActive = timeSinceShot < SHOT_FLASH_DURATION_MS
  const hitIndicatorActive = timeSinceHit < HIT_INDICATOR_DURATION_MS
  const crosshairPulse = shotFlashActive ? 1.3 : 1

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      fontFamily: '"Courier New", "Consolas", monospace',
      color: '#ffffff',
      zIndex: 1000,
    }}>
      {/* Score Display */}
      {!isGameOver && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          fontSize: '28px',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
        }}>
          Score: {scoreRounded} | {kills} kills
        </div>
      )}

      {/* Instructions (fade out after 4 seconds) */}
      {showInstructions && !isGameOver && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '22px',
          textAlign: 'center',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
          opacity: showInstructions ? 1 : 0,
          transition: 'opacity 0.5s',
          lineHeight: '1.5',
        }}>
          <div>Click to lock pointer</div>
          <div>Mouse to aim | Click to shoot</div>
          <div>Hold SPACEBAR to boost (costs score)</div>
        </div>
      )}

      {/* Crosshair */}
      {!isGameOver && (
        <>
          {/* Shot flash effect */}
          {shotFlashActive && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(255,255,255,0.15)',
              pointerEvents: 'none',
            }} />
          )}

          {/* Center dot */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${crosshairPulse})`,
            width: '4px',
            height: '4px',
            backgroundColor: hitIndicatorActive ? 'rgba(255,100,100,0.9)' : 'rgba(255,255,255,0.9)',
            borderRadius: '50%',
            boxShadow: '0 0 4px rgba(0,0,0,0.8)',
            transition: 'transform 0.1s, background-color 0.15s',
          }} />

          {/* Outer ring */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${crosshairPulse})`,
            width: '24px',
            height: '24px',
            border: `2px solid ${hitIndicatorActive ? 'rgba(255,100,100,0.7)' : 'rgba(255,255,255,0.6)'}`,
            borderRadius: '50%',
            boxShadow: '0 0 3px rgba(0,0,0,0.5)',
            transition: 'transform 0.1s, border-color 0.15s',
          }} />
        </>
      )}

      {/* Game Over Screen */}
      {isGameOver && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '64px',
            fontWeight: 'bold',
            marginBottom: '20px',
            textShadow: '3px 3px 6px rgba(0,0,0,0.9)',
          }}>
            GAME OVER
          </div>
          <div style={{
            fontSize: '32px',
            marginBottom: '10px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
          }}>
            Score: {scoreRounded}
          </div>
          <div style={{
            fontSize: '32px',
            marginBottom: '40px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
          }}>
            Kills: {kills}
          </div>
          <button
            onClick={startGame}
            style={{
              pointerEvents: 'all',
              fontSize: '24px',
              padding: '15px 40px',
              backgroundColor: '#ffffff',
              color: '#000000',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontFamily: '"Courier New", "Consolas", monospace',
              fontWeight: 'bold',
              boxShadow: '3px 3px 6px rgba(0,0,0,0.5)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#cccccc'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff'
            }}
          >
            RESTART
          </button>
        </div>
      )}
    </div>
  )
}
