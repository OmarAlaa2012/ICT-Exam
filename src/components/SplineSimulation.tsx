import { useEffect, useState } from 'react';

// Cast the custom web component to bypass TypeScript global JSX pollution
const SplineViewer = 'spline-viewer' as any;

interface SplineSimulationProps {
  theme?: 'dark' | 'light';
}

/**
 * Genuine 3D Spline Simulation Component
 * Uses the Spline Viewer Web Component to load and display either SplineRobot.spline or RobotLandscape.spline directly.
 */
export default function SplineSimulation({ theme = 'dark' }: SplineSimulationProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const splineUrl = theme === 'light' ? '/RobotLandscape.spline' : '/SplineRobot.spline';

  useEffect(() => {
    setIsLoaded(false);
    // Set active after a brief delay is given for the web-component initialization
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 400);
    return () => clearTimeout(timer);
  }, [splineUrl]);

  const activeBg = 'bg-transparent';
  const fallbackBg = 'bg-transparent';
  const spinnerAccent = theme === 'light' ? 'border-indigo-600' : 'border-[#17ED61]';
  const spinnerAccentSubtle = theme === 'light' ? 'border-[#4f46e5]/10' : 'border-[#17ED61]/10';
  const textAccent = theme === 'light' ? 'text-indigo-600' : 'text-[#17ED61]';
  const labelColor = theme === 'light' ? 'text-slate-500' : 'text-slate-400';

  return (
    <div className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-auto transition-colors duration-300 ${activeBg}`} id="3d-spline-background-wrapper">
      {/* Real-time 3D Spline Robot / Landscape Model */}
      <div 
        className={`w-full h-full transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        id="spline-robot-wrapper"
      >
        <SplineViewer 
          key={splineUrl}
          url={splineUrl} 
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </div>

      {/* Ambient Backdrop loader */}
      {!isLoaded && (
        <div className={`absolute inset-0 flex items-center justify-center ${fallbackBg}`} id="spline-loader-fallback">
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex items-center justify-center">
              <div className={`w-12 h-12 rounded-full border ${spinnerAccentSubtle} border-t-current ${spinnerAccent} animate-spin`} />
              <div className={`absolute w-6 h-6 rounded-full border ${spinnerAccentSubtle} border-b-current ${spinnerAccent} animate-spin duration-700`} />
            </div>
            <div className="space-y-1.5 text-center px-6">
              <span className={`text-[10px] font-mono tracking-widest ${textAccent} uppercase animate-pulse block`}>
                INITIATING {theme === 'light' ? 'ROBOT LANDSCAPE 3D ENVIRONMENT' : 'COGNITIVE EXAM SYSTEM'}
              </span>
              <p className="text-[9px] font-mono text-slate-500 uppercase">
                Loading live procedural textures
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CRT Scanline & Grid Overlays */}
      <div className={`absolute inset-0 pointer-events-none ${theme === 'light' ? 'bg-gradient-to-t from-white/20 via-transparent to-white/20' : 'bg-gradient-to-t from-black/30 via-transparent to-black/30'}`} />
      <div className={`absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.2)_50%)] bg-[size:100%_4px] ${theme === 'light' ? 'opacity-20' : 'opacity-60'}`} />

      <div className="absolute inset-x-0 bottom-4 text-center pointer-events-none z-10">
        <span className={`font-mono text-[10px] tracking-widest ${theme === 'light' ? 'text-indigo-600/60' : 'text-[#17ed61]/60'} uppercase`}>
          System Core &bull; {theme === 'light' ? 'Landscape Active' : 'Robotic Interface Active'}
        </span>
      </div>
    </div>
  );
}
