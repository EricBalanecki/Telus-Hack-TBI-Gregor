"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Box } from "@react-three/drei";
import { useRequestDevice } from "react-web-bluetooth";
import { BluetoothRemoteGATTCharacteristic } from 'web-bluetooth';
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";



export default function PhysicalDevice() {

	const quatRef = useRef<[number, number, number, number]>([0, 0, 0, 1]);

	const { onClick, device } = useRequestDevice({
		filters: [
			{ namePrefix: "BIODYN" },
		],
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
					console.log("BLE data: ", x, y, z, w);
				} catch (err) {
					console.error("Read failed:", err);
				}
			}, 1000 / 10); // ~33ms
		};

		connectAndPoll();

		return () => {
			clearInterval(intervalId);
			device.gatt?.disconnect();
		};
	}, [device]);

	return (
		<div className="relative min-h-screen">
			{!device && <button onClick={onClick} className="z-1">Connect</button>}
			{device && <span>{device.name}</span>}

			<div className="absolute inset-0 top-64">
				<Canvas camera={{ position: [0, 0, 5], fov: 60 }} className="h-screen w-screen">
					<ambientLight intensity={0.5} />
					<directionalLight position={[5, 5, 5]} intensity={1} />
					<RotatingLP quatRef={quatRef} />
					<OrbitControls />
					<axesHelper args={[5]} />
				</Canvas>
			</div>
		</div>
	);
};

function RotatingLP({ quatRef }: { quatRef: React.MutableRefObject<[number, number, number, number]> }) {
	const meshRef = useRef<THREE.Mesh>(null!);

	useFrame(() => {
		const [x, y, z, w] = quatRef.current;
		meshRef.current.quaternion.set(-y, -x, z, w);
	});

	return (
		<mesh ref={meshRef}>
			<LaserPointer />
			<meshStandardMaterial color="orange" />
		</mesh>
	);
}

function LaserPointer() {
	const { scene } = useGLTF("/scene.gltf");
	return <primitive object={scene} scale={0.005} />;
}