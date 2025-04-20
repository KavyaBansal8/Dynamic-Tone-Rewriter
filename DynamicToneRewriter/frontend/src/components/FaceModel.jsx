import { useGLTF, Text } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  OrbitControls,
  PresentationControls,
  Stage,
  ContactShadows,
} from "@react-three/drei";
import { Suspense, useRef } from "react";

const emotions = ["Happy", "Sad", "Frustrated", "Excited", "Angry", "Calm", "Anxious"];

const Model = () => {
  const { scene } = useGLTF("source/Metageist-FutureShock-clip.glb");
  return (
    <group>
      <primitive 
        object={scene} 
        scale={4}
        position={[0, -1, 0]}
        rotation={[0.3, 0, 0]} 
      />
    </group>
  );
};

const FloatingEmotions = () => {
  const textsRef = useRef([]);
  
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    textsRef.current.forEach((text, index) => {
      if (text) {
        const angle = (index / emotions.length) * Math.PI * 2 + time * 0.5;
        text.position.x = Math.cos(angle) * 5;
        text.position.z = Math.sin(angle) * 5;
        text.lookAt(0, 0, 0);
      }
    });
  });

  return (
    <group>
      {emotions.map((emotion, index) => (
        <Text
          key={emotion}
          ref={(el) => (textsRef.current[index] = el)}
          fontSize={0.5}
          position={[Math.cos(index) * 5, 2, Math.sin(index) * 5]}
          color="darkred"
        >
          {emotion}
        </Text>
      ))}
    </group>
  );
};

const FaceModel = () => {
  return (
    <div className="w-full h-screen bg-gradient-to-b from-black to-red-900">
      <Canvas
        camera={{ 
          position: [-0.4,10, 8],
          fov: 120
        }}
        className="w-full h-full"
      >
        <Suspense fallback={null}>
          <Stage intensity={0.7} contactShadow={false} shadowBias={-0.0015}>
            <Model />
          </Stage>
          
          <FloatingEmotions />

          <spotLight position={[10, 20, 10]} angle={0.3} penumbra={1} intensity={1.5} castShadow color="crimson" />
          <spotLight position={[-10, -5, -10]} angle={0.2} penumbra={1} intensity={0.7} color="darkred" />
          
          <ContactShadows opacity={0.5} scale={15} blur={3} far={5} resolution={512} color="#330000" />
          
          <OrbitControls enableZoom enablePan enableRotate zoomSpeed={0.5} panSpeed={0.5} rotateSpeed={0.5} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default FaceModel;