import React, { Suspense, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Float, Environment, Sparkles } from '@react-three/drei';
import { Volume2, Bot, Eye } from 'lucide-react';
import * as THREE from 'three';

function Model({ isSpeaking, ...props }) {
  const groupRef = useRef();
  const { scene } = useGLTF('/models/woman-avatar.glb');

  // Clone scene to prevent global state mutation
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  // Real-time lip sync morph target animation & eye blinking in render loop
  useFrame((state) => {
    if (!groupRef.current || !clonedScene) return;

    const t = state.clock.getElapsedTime();

    // 1. Natural subtle head & body motion during speech vs idle
    if (isSpeaking) {
      groupRef.current.position.y = Math.sin(t * 8) * 0.015 - 1.35;
      groupRef.current.rotation.y = Math.sin(t * 3) * 0.05;
      groupRef.current.rotation.z = Math.cos(t * 5) * 0.015;
    } else {
      groupRef.current.position.y = Math.sin(t * 2) * 0.008 - 1.35;
      groupRef.current.rotation.y = Math.sin(t * 0.8) * 0.03;
      groupRef.current.rotation.z = 0;
    }

    // 2. Dynamic Lip Sync Morph Targets (jawOpen, mouthOpen, visemes)
    const openAmount = isSpeaking
      ? Math.abs(Math.sin(t * 15)) * 0.55 + Math.abs(Math.cos(t * 22)) * 0.25
      : 0;

    // Eye blinking cycle every ~3.5 seconds
    const blinkCycle = t % 3.5;
    const isBlinking = blinkCycle > 3.35;
    const blinkVal = isBlinking ? Math.sin((blinkCycle - 3.35) * Math.PI * 6.6) : 0;

    clonedScene.traverse((child) => {
      if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
        const dict = child.morphTargetDictionary;
        const inf = child.morphTargetInfluences;

        // Drive real lip sync on meshes
        if (dict['jawOpen'] !== undefined) inf[dict['jawOpen']] = openAmount;
        if (dict['mouthOpen'] !== undefined) inf[dict['mouthOpen']] = openAmount * 0.75;
        if (dict['viseme_aa'] !== undefined) inf[dict['viseme_aa']] = openAmount * 0.6;
        if (dict['viseme_E'] !== undefined) inf[dict['viseme_E']] = isSpeaking ? Math.abs(Math.sin(t * 12)) * 0.3 : 0;
        if (dict['viseme_O'] !== undefined) inf[dict['viseme_O']] = isSpeaking ? Math.abs(Math.cos(t * 10)) * 0.3 : 0;

        // Drive natural eye blinking
        if (dict['eyeBlinkLeft'] !== undefined) inf[dict['eyeBlinkLeft']] = blinkVal;
        if (dict['eyeBlinkRight'] !== undefined) inf[dict['eyeBlinkRight']] = blinkVal;
      }
    });
  });

  return (
    <group ref={groupRef} {...props} position={[0, -1.35, 0]} scale={0.9}>
      <primitive object={clonedScene} />
    </group>
  );
}

export default function AvatarCanvas({ isSpeaking = false }) {
  const [hasWebGLError, setHasWebGLError] = useState(false);

  return (
    <div className="relative w-full h-full flex flex-col justify-between items-center bg-gradient-to-b from-[#141b2a] via-[#0f172a] to-[#0b0f14] rounded-2xl overflow-hidden border border-amber-500/20 shadow-2xl">
      
      {/* African-Utopia Top Header Tag */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-amber-500/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-xs font-semibold text-amber-300 tracking-wider uppercase">Interactive AI Guide</span>
        </div>
        
        {isSpeaking && (
          <div className="flex items-center gap-1.5 bg-emerald-500/20 backdrop-blur-md text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/40 text-xs font-medium animate-pulse">
            <Volume2 className="w-3.5 h-3.5" />
            <span>Speaking...</span>
          </div>
        )}
      </div>

      {/* 3D Viewport / Canvas */}
      <div className="w-full h-full min-h-[320px] relative">
        {hasWebGLError ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-emerald-500 p-1 shadow-xl mb-4">
              <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                <Bot className="w-12 h-12 text-amber-400" />
              </div>
            </div>
            <h3 className="text-amber-200 font-semibold">MaternityCare Avatar</h3>
            <p className="text-xs text-slate-400 mt-1">3D Graphics Fallback Active</p>
          </div>
        ) : (
          <Canvas
            camera={{ position: [0, 0.1, 2.2], fov: 42 }}
            onError={() => setHasWebGLError(true)}
            className="w-full h-full cursor-grab active:cursor-grabbing"
          >
            <ambientLight intensity={1.4} />
            <directionalLight position={[5, 8, 5]} intensity={2.0} color="#fef08a" />
            <directionalLight position={[-5, 3, -5]} intensity={1.2} color="#34d399" />
            <pointLight position={[0, 0.5, 1]} intensity={1.0} color="#fbbf24" />

            <Sparkles count={45} scale={5} size={3} speed={0.4} color="#f59e0b" />

            <Suspense fallback={null}>
              <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.15}>
                <Model isSpeaking={isSpeaking} />
              </Float>
              <Environment preset="city" />
            </Suspense>

            <OrbitControls
              target={[0, 0.1, 0]}
              enableZoom={true}
              minDistance={1.0}
              maxDistance={3.5}
              maxPolarAngle={Math.PI / 2 + 0.1}
              minPolarAngle={Math.PI / 4}
              enablePan={false}
            />
          </Canvas>
        )}
      </div>

      {/* Futuristic Base Ring & Interaction Instructions */}
      <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800">
        <span className="flex items-center gap-1">
          <Eye className="w-3 h-3 text-amber-400" /> Drag to rotate • Scroll to zoom
        </span>
        <span className="text-amber-400/80 font-mono">3D UT-MODEL v2.4</span>
      </div>
    </div>
  );
}

useGLTF.preload('/models/woman-avatar.glb');
