import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useTexture, Float, Sparkles } from '@react-three/drei';
import { Volume2, Bot, Eye, ShieldCheck, Sparkle, MousePointer } from 'lucide-react';
import * as THREE from 'three';

const PRIMARY_MODEL_URL = '/models/woman-avatar-y.glb';
const AVATAR_IMAGE_URL = '/maternal_avatar.jpg';

function TexturedAvatarMesh({ isSpeaking }) {
  const meshRef = useRef();
  const texture = useTexture(AVATAR_IMAGE_URL);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();

    const px = state.pointer.x * 0.35;
    const py = -state.pointer.y * 0.2;

    if (isSpeaking) {
      meshRef.current.position.y = 1.38 + Math.sin(t * 4) * 0.015;
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, px + Math.sin(t * 1.8) * 0.05, 0.1);
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, py + Math.sin(t * 2.5) * 0.02, 0.1);
      meshRef.current.scale.x = 1.0 + Math.sin(t * 8) * 0.015;
      meshRef.current.scale.y = 1.0 + Math.cos(t * 8) * 0.015;
    } else {
      meshRef.current.position.y = 1.38 + Math.sin(t * 1.2) * 0.008;
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, px + Math.sin(t * 0.5) * 0.02, 0.08);
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, py, 0.08);
      meshRef.current.scale.set(1, 1, 1);
    }
  });

  return (
    <group ref={meshRef} position={[0, 1.38, 0]}>
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[1.35, 1.35]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.3}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[1.42, 1.42]} />
        <meshBasicMaterial
          color={isSpeaking ? "#c084fc" : "#a855f7"}
          transparent
          opacity={0.35}
        />
      </mesh>
    </group>
  );
}

class AvatarErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    console.warn('GLTF avatar fallback active:', error);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Helper to apply natural standing idle pose to VRM humanoid skeleton
const applyIdlePose = (scene, t = 0, isSpeaking = false) => {
  if (!scene) return;

  const breath = Math.sin(t * 1.5) * 0.015;
  const speakSway = isSpeaking ? Math.sin(t * 3.5) * 0.025 : 0;

  scene.traverse((child) => {
    if (!child.name) return;

    // Left Arm (relaxed stance down by side)
    if (child.name === 'J_Bip_L_UpperArm' || child.name.includes('L_UpperArm')) {
      child.rotation.x = 0.08 + Math.sin(t * 1.2) * 0.01;
      child.rotation.y = 0.12 + Math.cos(t * 1.4) * 0.01;
      child.rotation.z = -1.25 + breath + speakSway * 0.3;
    }
    if (child.name === 'J_Bip_L_LowerArm' || child.name.includes('L_LowerArm')) {
      child.rotation.x = 0.05;
      child.rotation.y = -0.15;
      child.rotation.z = -0.22 + Math.sin(t * 1.8) * 0.01;
    }
    if (child.name === 'J_Bip_L_Hand' || child.name.includes('L_Hand')) {
      child.rotation.x = 0.05;
      child.rotation.y = 0.05;
      child.rotation.z = 0.08;
    }

    // Right Arm (relaxed stance down by side)
    if (child.name === 'J_Bip_R_UpperArm' || child.name.includes('R_UpperArm')) {
      child.rotation.x = 0.08 - Math.sin(t * 1.2) * 0.01;
      child.rotation.y = -0.12 - Math.cos(t * 1.4) * 0.01;
      child.rotation.z = 1.25 - breath - speakSway * 0.3;
    }
    if (child.name === 'J_Bip_R_LowerArm' || child.name.includes('R_LowerArm')) {
      child.rotation.x = 0.05;
      child.rotation.y = 0.15;
      child.rotation.z = 0.22 - Math.sin(t * 1.8) * 0.01;
    }
    if (child.name === 'J_Bip_R_Hand' || child.name.includes('R_Hand')) {
      child.rotation.x = 0.05;
      child.rotation.y = -0.05;
      child.rotation.z = -0.08;
    }

    // Spine & Chest posture
    if (child.name === 'J_Bip_C_Spine' || child.name.includes('Spine')) {
      child.rotation.x = 0.02 + Math.sin(t * 1.5) * 0.008;
    }
    if (child.name === 'J_Bip_C_Chest' || child.name.includes('Chest')) {
      child.rotation.x = 0.02 + Math.sin(t * 1.5 + 0.5) * 0.01;
    }
  });
};

function AvatarGLTFModel({ isSpeaking, ...props }) {
  const groupRef = useRef();
  const innerRef = useRef();
  const { scene } = useGLTF(PRIMARY_MODEL_URL);

  // Material upgrade & skeletal bounds setup
  useEffect(() => {
    if (!scene) return;

    // Ensure model is anchored cleanly at ground level
    scene.position.set(0, 0, 0);

    scene.traverse((child) => {
      if (child.isMesh) {
        child.frustumCulled = false;

        const convertMat = (mat) => {
          if (!mat) return mat;
          // Upgrade unlit MeshBasicMaterial so VRM avatar receives studio lights
          if (mat.type === 'MeshBasicMaterial' || mat.isMeshBasicMaterial) {
            const stdMat = new THREE.MeshStandardMaterial({
              map: mat.map,
              color: mat.color || new THREE.Color(0xffffff),
              transparent: mat.transparent || (mat.map && mat.map.format === THREE.RGBAFormat),
              alphaTest: mat.alphaTest > 0 ? mat.alphaTest : (mat.transparent ? 0.05 : 0),
              roughness: 0.55,
              metalness: 0.05,
              depthWrite: true,
              side: mat.side || THREE.FrontSide,
            });
            return stdMat;
          }
          mat.roughness = 0.55;
          mat.metalness = 0.05;
          mat.needsUpdate = true;
          return mat;
        };

        if (Array.isArray(child.material)) {
          child.material = child.material.map(convertMat);
        } else if (child.material) {
          child.material = convertMat(child.material);
        }
      }
    });

    // Apply initial idle pose
    applyIdlePose(scene, 0, false);
  }, [scene]);

  // Real-time animation loop (idle pose + eye blinking + multi-vowel lip sync + cursor tracking)
  useFrame((state) => {
    if (!groupRef.current || !scene) return;
    const t = state.clock.getElapsedTime();

    // Apply continuous organic idle pose sway
    applyIdlePose(scene, t, isSpeaking);

    // Mouse/Cursor Tracking
    const targetY = state.pointer.x * 0.35;
    const targetX = -state.pointer.y * 0.18;

    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetY + (isSpeaking ? Math.sin(t * 2) * 0.03 : Math.sin(t * 0.6) * 0.012),
      0.06
    );

    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetX + (isSpeaking ? Math.sin(t * 3.5) * 0.012 : 0),
      0.06
    );

    if (isSpeaking) {
      groupRef.current.position.y = Math.sin(t * 5) * 0.008;
      if (innerRef.current) {
        innerRef.current.scale.x = 1.0 + Math.sin(t * 12) * 0.006;
        innerRef.current.scale.y = 1.0 + Math.cos(t * 10) * 0.006;
      }
    } else {
      groupRef.current.position.y = Math.sin(t * 1.5) * 0.004;
      if (innerRef.current) {
        innerRef.current.scale.set(1, 1, 1);
      }
    }

    // --- MORPH TARGET ANIMATIONS: EYE BLINKING & LIP-SYNC ---
    // Eye Blink logic (natural blink timing with periodic subtle double-blinks)
    const blinkCycle = t % 4.2;
    let blinkVal = 0;
    if (blinkCycle > 3.95) {
      blinkVal = Math.sin(((blinkCycle - 3.95) / 0.25) * Math.PI);
    } else if (blinkCycle > 1.8 && blinkCycle < 2.0) {
      blinkVal = Math.sin(((blinkCycle - 1.8) / 0.2) * Math.PI) * 0.8;
    }
    blinkVal = Math.max(0, Math.min(1, blinkVal));

    // Lip sync visemes logic
    let visemeA = 0;
    let visemeI = 0;
    let visemeU = 0;
    let visemeE = 0;
    let visemeO = 0;
    let genericMouthOpen = 0;

    if (isSpeaking) {
      const speechT = t * 4.6;
      genericMouthOpen = Math.min(0.85, Math.abs(Math.sin(speechT * 0.9)) * 0.45 + Math.abs(Math.cos(speechT * 1.5)) * 0.3);
      visemeA = Math.max(0, Math.sin(speechT * 1.1) * 0.65);
      visemeI = Math.max(0, Math.cos(speechT * 1.3) * 0.35);
      visemeU = Math.max(0, Math.sin(speechT * 1.8) * 0.3);
      visemeE = Math.max(0, Math.cos(speechT * 0.9) * 0.4);
      visemeO = Math.max(0, Math.sin(speechT * 1.5) * 0.5);
    }

    scene.traverse((child) => {
      if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
        const dict = child.morphTargetDictionary;
        const inf = child.morphTargetInfluences;

        // Apply Eye Blinking
        const eyeBlinkKeys = [
          'Fcl_EYE_Close', 'Fcl_EYE_Close_L', 'Fcl_EYE_Close_R',
          'eyesClosed', 'eyeBlinkLeft', 'eyeBlinkRight',
          'blink', 'blinkLeft', 'blinkRight', 'Blink', 'Blink_L', 'Blink_R'
        ];
        for (let i = 0; i < eyeBlinkKeys.length; i++) {
          const key = eyeBlinkKeys[i];
          if (dict[key] !== undefined) {
            inf[dict[key]] = blinkVal;
          }
        }

        // Apply VRM & standard mouth visemes
        if (dict['Fcl_MTH_A'] !== undefined) inf[dict['Fcl_MTH_A']] = visemeA;
        if (dict['Fcl_MTH_I'] !== undefined) inf[dict['Fcl_MTH_I']] = visemeI;
        if (dict['Fcl_MTH_U'] !== undefined) inf[dict['Fcl_MTH_U']] = visemeU;
        if (dict['Fcl_MTH_E'] !== undefined) inf[dict['Fcl_MTH_E']] = visemeE;
        if (dict['Fcl_MTH_O'] !== undefined) inf[dict['Fcl_MTH_O']] = visemeO;

        // Generic fallback visemes
        if (dict['aa'] !== undefined) inf[dict['aa']] = visemeA;
        if (dict['ih'] !== undefined) inf[dict['ih']] = visemeI;
        if (dict['ou'] !== undefined) inf[dict['ou']] = visemeU;
        if (dict['ee'] !== undefined) inf[dict['ee']] = visemeE;
        if (dict['oh'] !== undefined) inf[dict['oh']] = visemeO;

        // Generic mouth / jaw open fallbacks
        if (dict['mouthOpen'] !== undefined) inf[dict['mouthOpen']] = genericMouthOpen;
        if (dict['jawOpen'] !== undefined) inf[dict['jawOpen']] = genericMouthOpen * 0.45;
        if (dict['Fcl_MTH_Down'] !== undefined) inf[dict['Fcl_MTH_Down']] = genericMouthOpen * 0.3;
      }
    });
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} scale={1.0} {...props}>
      <group ref={innerRef}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

function Model({ isSpeaking }) {
  return (
    <AvatarErrorBoundary fallback={<TexturedAvatarMesh isSpeaking={isSpeaking} />}>
      <AvatarGLTFModel isSpeaking={isSpeaking} />
    </AvatarErrorBoundary>
  );
}

export default function AvatarCanvas({ isSpeaking = false, theme = 'dark' }) {
  const [hasWebGLError, setHasWebGLError] = useState(false);
  const isLight = theme === 'light';

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between items-center rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 border ${
        isLight
          ? 'bg-gradient-to-b from-[#fdfbf7] via-[#f5ece3] to-[#ebdcd0] border-purple-200/80 shadow-purple-900/10'
          : 'bg-gradient-to-b from-[#131024] via-[#101424] to-[#0b0e14] border-purple-500/30 shadow-black/70'
      }`}
    >
      {/* Top Header Tag */}
      <div className="absolute top-3.5 left-3.5 right-3.5 z-20 flex items-center justify-between pointer-events-none">
        <div
          className={`flex items-center gap-2 backdrop-blur-md px-3.5 py-1.5 rounded-full border text-[11px] font-bold tracking-wide uppercase shadow-sm ${
            isLight
              ? 'bg-white/90 border-purple-200 text-purple-900'
              : 'bg-slate-900/90 border-purple-500/40 text-purple-200'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Live 3D Rigged Avatar</span>
        </div>

        {isSpeaking && (
          <div
            className={`flex items-center gap-1.5 backdrop-blur-md px-3 py-1.5 rounded-full border text-xs font-semibold animate-pulse ${
              isLight
                ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 shadow-lg shadow-purple-600/30'
            }`}
          >
            <Volume2 className="w-4 h-4 animate-bounce" />
            <span>Voice Assistance Active...</span>
          </div>
        )}
      </div>

      {/* FULL 3D INTERACTIVE CANVAS VIEWPORT */}
      <div className="w-full h-full min-h-[340px] relative flex items-center justify-center overflow-hidden">
        {/* User Studio Background Image */}
        <img
          src="/studio_background.png"
          alt="Studio Backdrop"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none z-0" />

        {hasWebGLError ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center z-10">
            <img
              src={AVATAR_IMAGE_URL}
              alt="Maternal Health Guide Avatar"
              className="w-44 h-44 rounded-full object-cover border-4 border-purple-500/50 shadow-2xl mb-3"
            />
            <h3 className={`font-bold ${isLight ? 'text-purple-950' : 'text-purple-200'}`}>Utopia Women Guide</h3>
          </div>
        ) : (
          <Canvas
            gl={{ alpha: true }}
            camera={{ position: [0, 1.30, 1.25], fov: 38 }}
            onError={() => setHasWebGLError(true)}
            className="w-full h-full cursor-grab active:cursor-grabbing relative z-10"
          >
            {/* Studio Lighting - 100% Offline & Local (Prevents external HDRI 503 fetch errors) */}
            <ambientLight intensity={isLight ? 2.4 : 2.0} color="#ffedd5" />
            <directionalLight position={[3, 5, 4]} intensity={2.8} color="#fed7aa" />
            <directionalLight position={[-3, 2, -3]} intensity={1.5} color="#f472b6" />
            <directionalLight position={[0, -2, 3]} intensity={0.8} color="#e0e7ff" />
            <pointLight position={[0, 1.3, 0.8]} intensity={1.8} color="#fb7185" />
            <hemisphereLight skyColor="#fef3c7" groundColor="#4c1d95" intensity={0.8} />

            <Sparkles count={35} scale={2.8} size={2.2} speed={0.3} color="#fca5a5" />

            <Suspense fallback={null}>
              <Float speed={1.1} rotationIntensity={0.04} floatIntensity={0.05}>
                <Model isSpeaking={isSpeaking} />
              </Float>
            </Suspense>

            <OrbitControls
              target={[0, 1.25, 0]}
              enableZoom={true}
              minDistance={0.45}
              maxDistance={2.5}
              maxPolarAngle={Math.PI / 2}
              minPolarAngle={Math.PI / 4}
              enablePan={false}
            />
          </Canvas>
        )}
      </div>

      {/* 3D Interaction Footer */}
      <div
        className={`w-full px-4 py-2 border-t flex items-center justify-between text-[11px] font-semibold backdrop-blur-md z-10 ${
          isLight
            ? 'bg-white/90 border-purple-200 text-purple-900'
            : 'bg-slate-950/80 border-purple-500/20 text-purple-300/80'
        }`}
      >
        <span className="flex items-center gap-1">
          <MousePointer className="w-3.5 h-3.5 text-purple-500" />
          <span>Interactive Cursor Eye-Tracking Active</span>
        </span>
        <span className="font-mono text-[10px] text-purple-500">LIVE 3D LIP-SYNC</span>
      </div>
    </div>
  );
}

try {
  useGLTF.preload(PRIMARY_MODEL_URL);
} catch (_) {}






