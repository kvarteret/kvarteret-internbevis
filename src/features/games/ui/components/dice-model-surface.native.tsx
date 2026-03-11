import { Canvas } from "@react-three/fiber/native"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { useWindowDimensions, View } from "react-native"
import * as THREE from "three"
import helvetikerRegular from "three/examples/fonts/helvetiker_regular.typeface.json"
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js"
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js"
import { DiceType } from "@/features/games/domain/dice"
import {
    createDieGeometry,
    extractDieFaces,
    getDieLabelScale,
    getSettledDieQuaternion,
} from "@/features/games/domain/dice-geometry"

interface DiceModelSurfaceProps {
    diceType: DiceType
    isRolling: boolean
    rollToken: number
    value: number
}

interface SpinningDieProps extends DiceModelSurfaceProps {
    size: number
}

interface DiePresentation {
    position: [number, number, number]
    rotation: [number, number, number]
}

const DICE_MATERIAL_COLOR = "#f5f8ff"
const DICE_EDGE_COLOR = "#aebed1"
const DICE_LABEL_COLOR = "#111318"
const DICE_SHADOW_COLOR = "#09101b"
const FACE_LABEL_OFFSET = 0.045
const TEXT_FORWARD = new THREE.Vector3(0, 0, 1)
const SPIN_SETTLE_DAMPING = 1 - Math.exp(-7 / 60)
const ROLL_SPIN_DURATION_SECONDS = 1.05

const getSpinVelocity = (): THREE.Vector3 =>
    new THREE.Vector3(
        (Math.random() * 14 + 16) * (Math.random() > 0.5 ? 1 : -1),
        (Math.random() * 15 + 17) * (Math.random() > 0.5 ? 1 : -1),
        (Math.random() * 12 + 14) * (Math.random() > 0.5 ? 1 : -1),
    )

const SpinningDie = ({
    diceType,
    isRolling,
    rollToken,
    value,
    size,
}: SpinningDieProps): React.JSX.Element => {
    const angularVelocityRef = useRef(getSpinVelocity())
    const settledQuaternionRef = useRef(new THREE.Quaternion())
    const currentQuaternionRef = useRef(new THREE.Quaternion())
    const animationFrameRef = useRef<number | null>(null)
    const lastFrameAtRef = useRef<number | null>(null)
    const spinTimeRemainingRef = useRef(0)
    const [presentation, setPresentation] = useState<DiePresentation>({
        position: [0, 0, 0],
        rotation: [0, 0, 0],
    })
    const geometry = useMemo(() => createDieGeometry(diceType), [diceType])
    const edgeGeometry = useMemo(() => new THREE.EdgesGeometry(geometry, 18), [geometry])
    const faceDescriptors = useMemo(() => extractDieFaces(geometry), [geometry])
    const labelScale = useMemo(() => getDieLabelScale(diceType), [diceType])
    const dieScale = size / 260
    const font = useMemo(
        () => new FontLoader().parse(helvetikerRegular as Parameters<FontLoader["parse"]>[0]),
        [],
    )
    const labelGeometries = useMemo(
        () =>
            faceDescriptors.map((_, index) => {
                const labelGeometry = new TextGeometry(String(index + 1), {
                    font,
                    size: labelScale,
                    depth: 0.01,
                    curveSegments: 4,
                    bevelEnabled: false,
                })

                labelGeometry.computeBoundingBox()
                const boundingBox = labelGeometry.boundingBox
                if (boundingBox) {
                    const center = new THREE.Vector3()
                    boundingBox.getCenter(center)
                    labelGeometry.translate(-center.x, -center.y, 0)
                }

                return labelGeometry
            }),
        [faceDescriptors, font, labelScale],
    )
    const labelTransforms = useMemo(
        () =>
            faceDescriptors.map(face => {
                const position = face.center
                    .clone()
                    .add(face.normal.clone().multiplyScalar(FACE_LABEL_OFFSET))
                const quaternion = new THREE.Quaternion().setFromUnitVectors(
                    TEXT_FORWARD,
                    face.normal.clone().normalize(),
                )
                const rotation = new THREE.Euler().setFromQuaternion(quaternion)

                return {
                    position: position.toArray() as [number, number, number],
                    rotation: [rotation.x, rotation.y, rotation.z] as [number, number, number],
                }
            }),
        [faceDescriptors],
    )

    const syncPresentation = (positionY: number): void => {
        const euler = new THREE.Euler().setFromQuaternion(currentQuaternionRef.current, "XYZ")
        setPresentation({
            position: [0, positionY, 0],
            rotation: [euler.x, euler.y, euler.z],
        })
    }

    useEffect(() => {
        const nextQuaternion = getSettledDieQuaternion(
            faceDescriptors.map(face => face.normal),
            value,
        )
        settledQuaternionRef.current.copy(nextQuaternion)

        if (spinTimeRemainingRef.current <= 0) {
            currentQuaternionRef.current.copy(nextQuaternion)
            syncPresentation(0)
        }
    }, [faceDescriptors, value])

    useEffect(() => {
        if (isRolling && rollToken > 0) {
            spinTimeRemainingRef.current = ROLL_SPIN_DURATION_SECONDS
            lastFrameAtRef.current = null
            angularVelocityRef.current.copy(getSpinVelocity())
            currentQuaternionRef.current.setFromEuler(
                new THREE.Euler(
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                ),
            )
            syncPresentation(0)
        } else if (!isRolling) {
            spinTimeRemainingRef.current = 0
            currentQuaternionRef.current.copy(settledQuaternionRef.current)
            syncPresentation(0)
        }
    }, [isRolling, rollToken])

    useEffect(() => {
        const step = (timestamp: number): void => {
            const lastFrameAt = lastFrameAtRef.current ?? timestamp
            const delta = Math.min(0.05, (timestamp - lastFrameAt) / 1000)
            const elapsed = timestamp / 1000
            lastFrameAtRef.current = timestamp

            let positionY = 0
            if (spinTimeRemainingRef.current > 0) {
                spinTimeRemainingRef.current = Math.max(0, spinTimeRemainingRef.current - delta)
                const angularStep = new THREE.Quaternion().setFromEuler(
                    new THREE.Euler(
                        angularVelocityRef.current.x * delta,
                        angularVelocityRef.current.y * delta,
                        angularVelocityRef.current.z * delta,
                    ),
                )
                currentQuaternionRef.current.multiply(angularStep)
                positionY = Math.sin(elapsed * 14) * 0.12
                angularVelocityRef.current.multiplyScalar(Math.pow(0.992, delta * 60))
            } else {
                const idleQuaternion = new THREE.Quaternion().setFromEuler(
                    new THREE.Euler(
                        Math.sin(elapsed * 0.9) * 0.08,
                        Math.cos(elapsed * 0.7) * 0.12,
                        0,
                    ),
                )
                const targetQuaternion = settledQuaternionRef.current
                    .clone()
                    .multiply(idleQuaternion)

                positionY = Math.sin(elapsed * 1.3) * 0.03
                currentQuaternionRef.current.slerp(targetQuaternion, 1 - Math.exp(-delta * 7))
                angularVelocityRef.current.lerp(new THREE.Vector3(), SPIN_SETTLE_DAMPING)
            }

            syncPresentation(positionY)

            animationFrameRef.current = requestAnimationFrame(step)
        }

        animationFrameRef.current = requestAnimationFrame(step)

        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [])

    useEffect(
        () => () => {
            geometry.dispose()
            edgeGeometry.dispose()
            labelGeometries.forEach(labelGeometry => {
                labelGeometry.dispose()
            })
        },
        [edgeGeometry, geometry, labelGeometries],
    )

    return (
        <>
            <group
                position={presentation.position}
                rotation={presentation.rotation}
                scale={dieScale}
            >
                <mesh>
                    <primitive attach="geometry" object={geometry} />
                    <meshBasicMaterial color={DICE_MATERIAL_COLOR} />
                </mesh>
                <lineSegments>
                    <primitive attach="geometry" object={edgeGeometry} />
                    <lineBasicMaterial color={DICE_EDGE_COLOR} opacity={0.82} transparent />
                </lineSegments>
                {faceDescriptors.map((face, index) => (
                    <group
                        key={`${diceType}-${index + 1}`}
                        position={labelTransforms[index].position}
                        rotation={labelTransforms[index].rotation}
                    >
                        <mesh>
                            <primitive attach="geometry" object={labelGeometries[index]} />
                            <meshBasicMaterial color={DICE_LABEL_COLOR} />
                        </mesh>
                    </group>
                ))}
            </group>
            <mesh
                position={[0, -1.92, -0.3]}
                rotation={[-Math.PI / 2, 0, 0]}
                scale={[1.18, 0.78, 1]}
            >
                <circleGeometry args={[1.4, 48]} />
                <meshBasicMaterial color={DICE_SHADOW_COLOR} opacity={0.22} transparent />
            </mesh>
        </>
    )
}

export const DiceModelSurface = ({
    diceType,
    isRolling,
    rollToken,
    value,
}: DiceModelSurfaceProps): React.JSX.Element => {
    const { width } = useWindowDimensions()
    const sceneSize = Math.min(Math.max(width - 88, 230), 340)

    return (
        <View
            className="overflow-hidden rounded-[28px] bg-[#05070c]"
            style={{
                borderColor: "rgba(196, 213, 232, 0.14)",
                borderWidth: 1,
                boxShadow: "0 18px 36px rgba(4, 8, 18, 0.34)",
                height: sceneSize,
            }}
        >
            <Canvas
                camera={{ fov: 36, position: [0, 0, 7.2] }}
                frameloop="always"
                gl={{ antialias: true }}
                style={{ flex: 1, width: "100%", height: sceneSize }}
            >
                <color args={["#05070c"]} attach="background" />
                <SpinningDie
                    diceType={diceType}
                    isRolling={isRolling}
                    rollToken={rollToken}
                    size={sceneSize}
                    value={value}
                />
            </Canvas>
        </View>
    )
}
