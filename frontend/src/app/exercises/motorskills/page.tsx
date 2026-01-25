"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, useGLTF } from "@react-three/drei";
import { useRequestDevice } from "react-web-bluetooth";
import { BluetoothRemoteGATTCharacteristic } from "web-bluetooth";
import * as THREE from "three";

export default function PhysicalDevice() {
  const quatRef = useRef<[number, number, number, number]>([0, 0, 0, 1]);
  const wallRef = useRef<THREE.Mesh>(null!);
  const hitPointsRef = useRef<THREE.Vector3[]>([]);

  const { onClick, device } = useRequestDevice({
    filters: [{ namePrefix: "BIODYN" }],
    optionalServices: [0x1432],
  });

  useEffect(() => {
    if (!device) return;

    let characteristic: BluetoothRemoteGATTCharacteristic;
    let intervalId: number;

    const connectAndPoll = async () => {
      const server = await device.gatt!.connect();
      const service = await server.getPrimaryService(0x1432);
      characteristic = await service.getCharacteristic(0x4153);

      intervalId = window.setInterval(async () => {
        try {
          const value = await characteristic.readValue();
          const offset = value.byteLength - 16;
          const x = value.getFloat32(offset + 0, true);
          const y = value.getFloat32(offset + 4, true);
          const z = value.getFloat32(offset + 8, true);
          const w = value.getFloat32(offset + 12, true);

          const norm = Math.sqrt(x * x + y * y + z * z + w * w);
          quatRef.current = [x / norm, y / norm, z / norm, w / norm];
        } catch (err) {
          console.error("Read failed:", err);
        }
      }, 1000 / 23);
    };

    connectAndPoll();

    return () => {
      clearInterval(intervalId);
      device.gatt?.disconnect();
    };
  }, [device]);

  return (
    <div className="relative min-h-screen bg-zinc-950 text-white">
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }} className="h-screen w-screen">
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <RotatingLP quatRef={quatRef} wallRef={wallRef} hitPointsRef={hitPointsRef} />
          <OrbitControls />
          <mesh ref={wallRef} rotation={[0.0, 0.0, 0]}>
            <boxGeometry args={[-30, 30, 30]} />
            <meshStandardMaterial color="blue" />
          </mesh>
        </Canvas>
      </div>

      <div className="absolute left-5 top-5 z-20 flex items-center gap-3">
        <Link
          className="rounded-full border border-zinc-600 px-5 py-2 text-sm font-semibold text-white"
          href="/exercises"
        >
          Back to exercises
        </Link>
        {!device && (
          <button
            onClick={onClick}
            className="rounded-full border border-zinc-600 px-5 py-2 text-sm font-semibold text-white"
          >
            Connect to Remote
          </button>
        )}
        {device && <span>{device.name}</span>}
      </div>
    </div>
  );
}

function RotatingLP({
  quatRef,
  wallRef,
  hitPointsRef,
}: {
  quatRef: React.MutableRefObject<[number, number, number, number]>;
  wallRef: React.RefObject<THREE.Mesh>;
  hitPointsRef: React.RefObject<THREE.Vector3[]>;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const lineRef = useRef<THREE.Line>(null!);
  const hitDotRef = useRef<THREE.Mesh>(null!);
  const raycaster = new THREE.Raycaster();
  const dir = new THREE.Vector3();
  const trailRef = useRef<THREE.Line>(null!);

  useFrame(() => {
    if (!meshRef.current || !wallRef.current) {
      return;
    }

    const [x, y, z, w] = quatRef.current;
    meshRef.current.quaternion.set(-y, -x, z, w);

    meshRef.current.getWorldDirection(dir);
    raycaster.set(meshRef.current.position, dir);
    const hits = raycaster.intersectObject(wallRef.current);

    if (hits.length > 0) {
      const point = hits[0].point;
      const last = hitPointsRef.current[hitPointsRef.current.length - 1];
      if (!last || last.distanceTo(point) > 0.05) {
        hitPointsRef.current.push(point);
      }
      if (last && last.distanceTo(point) > 3) {
        hitPointsRef.current = [];
      }

      const positions = new Float32Array([
        meshRef.current.position.x,
        meshRef.current.position.y,
        meshRef.current.position.z,
        point.x,
        point.y,
        point.z,
      ]);
      if (lineRef.current) {
        lineRef.current.geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(positions, 3),
        );
        lineRef.current.geometry.computeBoundingSphere();
        lineRef.current.geometry.attributes.position.needsUpdate = true;
      }

      if (hitDotRef.current) {
        hitDotRef.current.position.copy(point);
      }

      if (trailRef.current) {
        const trailPositions = new Float32Array(hitPointsRef.current.length * 3);
        hitPointsRef.current.forEach((p, i) => {
          trailPositions[i * 3 + 0] = p.x;
          trailPositions[i * 3 + 1] = p.y;
          trailPositions[i * 3 + 2] = p.z;
        });
        trailRef.current.geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(trailPositions, 3),
        );
        trailRef.current.geometry.computeBoundingSphere();
        trailRef.current.geometry.attributes.position.needsUpdate = true;
      }
    }
  });

  return (
    <>
      <mesh ref={meshRef}>
        <LaserPointer />
        <meshStandardMaterial color="orange" />
      </mesh>

      <line ref={lineRef}>
        <bufferGeometry />
        <lineBasicMaterial color="red" linewidth={14} />
      </line>

      <line ref={trailRef}>
        <bufferGeometry />
        <lineBasicMaterial color="cyan" linewidth={14} />
      </line>

      <mesh ref={hitDotRef}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="yellow" />
      </mesh>
    </>
  );
}

function LaserPointer() {
  const { scene } = useGLTF("/scene.gltf");
  return <primitive object={scene} scale={0.005} rotation={[0, Math.PI / 2, 0]} />;
}

export function Target({
  position,
  onHit,
}: {
  position: [number, number, number];
  onHit: () => void;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      const scale = 1 + 0.1 * Math.sin(clock.elapsedTime * 5);
      ref.current.scale.setScalar(scale);
    }
  });

  return (
    <Sphere ref={ref} args={[0.2, 32, 32]} position={position} onClick={onHit}>
      <meshStandardMaterial color="red" />
    </Sphere>
  );
}
