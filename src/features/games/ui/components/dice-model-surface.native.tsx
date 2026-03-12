import { Canvas, useFrame, useThree } from "@react-three/fiber/native"
import React, { useEffect, useMemo, useRef } from "react"
import { useWindowDimensions, View } from "react-native"
import * as THREE from "three"
import { DiceType } from "@/features/games/domain/dice"
import {
    createDieGeometry,
    extractDieFaces,
    getSettledDieQuaternion,
} from "@/features/games/domain/dice-geometry"

// ─── Props ───────────────────────────────────────────────────────────────────

interface DiceModelSurfaceProps {
    diceType: DiceType
    isRolling: boolean
    rollToken: number
    value: number
}

interface SpinningDieProps extends DiceModelSurfaceProps {
    size: number
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DICE_MATERIAL_COLOR = "#f5f8ff"
const DICE_EDGE_COLOR = "#aebed1"
const DICE_LABEL_COLOR = "#111318"
const DICE_SHADOW_COLOR = "#09101b"
const FACE_LABEL_OFFSET = 0.045
const TEXT_FORWARD = new THREE.Vector3(0, 0, 1)
const DOT_RADIUS = 0.052
const DOT_SEGMENTS = 8

/** Number of translucent "ghost" copies trailing behind the die during spin. */
const MOTION_BLUR_TRAIL_COUNT = 3
/** Maximum opacity of the first (most recent) ghost. */
const MOTION_BLUR_MAX_OPACITY = 0.22
/** How aggressively velocity decays each frame (applied as pow(factor, dt*60)). */
const SPIN_DAMPING_BASE = 0.992
/** Slerp speed when settling to the target quaternion. */
const SETTLE_SLERP_SPEED = 7
/** Convergence threshold for the settling slerp (dot product). */
const SETTLE_CONVERGENCE = 0.9999

// ─── Pre-allocated math objects (avoids per-frame GC) ────────────────────────

const _angularStep = new THREE.Quaternion()
const _angularStepEuler = new THREE.Euler()
const _zeroVec = new THREE.Vector3()

// ─── Pip patterns for values 1-6 ────────────────────────────────────────────

const PIP_PATTERNS: Record<number, Array<[number, number]>> = {
    1: [[0, 0]],
    2: [
        [-0.22, -0.22],
        [0.22, 0.22],
    ],
    3: [
        [-0.22, -0.22],
        [0, 0],
        [0.22, 0.22],
    ],
    4: [
        [-0.22, -0.22],
        [0.22, -0.22],
        [-0.22, 0.22],
        [0.22, 0.22],
    ],
    5: [
        [-0.22, -0.22],
        [0.22, -0.22],
        [0, 0],
        [-0.22, 0.22],
        [0.22, 0.22],
    ],
    6: [
        [-0.22, -0.28],
        [0.22, -0.28],
        [-0.22, 0],
        [0.22, 0],
        [-0.22, 0.28],
        [0.22, 0.28],
    ],
}

// ─── Segment-display digit paths for values 7-20 ────────────────────────────

const DIGIT_PATHS: Record<number, Array<Array<[number, number]>>> = {
    0: [[[-0.18, -0.4], [0.18, -0.4], [0.18, 0.4], [-0.18, 0.4], [-0.18, -0.4]]],
    1: [[[0, -0.4], [0, 0.4]]],
    2: [[[-0.18, -0.4], [0.18, -0.4], [0.18, 0], [-0.18, 0], [-0.18, 0.4], [0.18, 0.4]]],
    3: [
        [[-0.18, -0.4], [0.18, -0.4], [0.18, 0], [-0.18, 0]],
        [[0.18, 0], [0.18, 0.4], [-0.18, 0.4]],
    ],
    4: [
        [[-0.18, -0.4], [-0.18, 0], [0.18, 0]],
        [[0.18, -0.4], [0.18, 0.4]],
    ],
    5: [[[0.18, -0.4], [-0.18, -0.4], [-0.18, 0], [0.18, 0], [0.18, 0.4], [-0.18, 0.4]]],
    6: [[[0.18, -0.4], [-0.18, -0.4], [-0.18, 0.4], [0.18, 0.4], [0.18, 0], [-0.18, 0]]],
    7: [[[-0.18, -0.4], [0.18, -0.4], [0.18, 0.4]]],
    8: [
        [[-0.18, -0.4], [0.18, -0.4], [0.18, 0.4], [-0.18, 0.4], [-0.18, -0.4]],
        [[-0.18, 0], [0.18, 0]],
    ],
    9: [[[0.18, 0.4], [0.18, -0.4], [-0.18, -0.4], [-0.18, 0], [0.18, 0]]],
}

// ─── Geometry helpers ────────────────────────────────────────────────────────

const createNumberGeometry = (value: number, labelScale: number): THREE.BufferGeometry => {
    const digits = String(value).split("").map(Number)
    const geometries: THREE.BufferGeometry[] = []

    digits.forEach((digit, index) => {
        const shapes: THREE.Shape[] = []
        const paths = DIGIT_PATHS[digit]
        if (!paths) return

        const HALF_WIDTH = 0.035

        for (const path of paths) {
            for (let i = 0; i < path.length - 1; i++) {
                const [x1, y1] = path[i]
                const [x2, y2] = path[i + 1]
                const dx = x2 - x1
                const dy = y2 - y1
                const len = Math.sqrt(dx * dx + dy * dy)
                if (len === 0) continue
                const nx = (-dy / len) * HALF_WIDTH
                const ny = (dx / len) * HALF_WIDTH

                const segShape = new THREE.Shape()
                segShape.moveTo(x1 + nx, -(y1 + ny))
                segShape.lineTo(x2 + nx, -(y2 + ny))
                segShape.lineTo(x2 - nx, -(y2 - ny))
                segShape.lineTo(x1 - nx, -(y1 - ny))
                segShape.closePath()
                shapes.push(segShape)
            }
        }

        if (shapes.length > 0) {
            const digitGeo = new THREE.ShapeGeometry(shapes)
            const offsetX = (index - (digits.length - 1) / 2) * 0.48
            digitGeo.translate(offsetX, 0, 0)
            geometries.push(digitGeo)
        }
    })

    if (geometries.length === 0) {
        return new THREE.BufferGeometry()
    }

    if (geometries.length === 1) {
        geometries[0].scale(labelScale, labelScale, 1)
        return geometries[0]
    }

    const positions: number[] = []
    const indices: number[] = []
    let vertexOffset = 0

    for (const geo of geometries) {
        const pos = geo.getAttribute("position")
        for (let i = 0; i < pos.count; i++) {
            positions.push(pos.getX(i), pos.getY(i), pos.getZ(i))
        }
        const idx = geo.getIndex()
        if (idx) {
            for (let i = 0; i < idx.count; i++) {
                indices.push(idx.array[i] + vertexOffset)
            }
        }
        vertexOffset += pos.count
        geo.dispose()
    }

    const merged = new THREE.BufferGeometry()
    merged.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
    if (indices.length > 0) {
        merged.setIndex(indices)
    }
    merged.scale(labelScale, labelScale, 1)
    return merged
}

const getLabelScale = (diceType: DiceType): number => {
    switch (diceType) {
        case 4:
            return 0.62
        case 6:
            return 1.0
        case 8:
            return 0.72
        case 10:
            return 0.62
        case 12:
            return 0.56
        case 20:
            return 0.46
    }
}

const getSpinVelocity = (): THREE.Vector3 =>
    new THREE.Vector3(
        (Math.random() * 14 + 16) * (Math.random() > 0.5 ? 1 : -1),
        (Math.random() * 15 + 17) * (Math.random() > 0.5 ? 1 : -1),
        (Math.random() * 12 + 14) * (Math.random() > 0.5 ? 1 : -1),
    )

// ─── Shared geometry instances ───────────────────────────────────────────────

const sharedDotGeometry = new THREE.CircleGeometry(DOT_RADIUS, DOT_SEGMENTS)

// ─── Face label components ───────────────────────────────────────────────────

interface FaceLabelProps {
    faceValue: number
    labelScale: number
    position: [number, number, number]
    rotation: [number, number, number]
}

const FaceLabel = React.memo(
    ({ faceValue, labelScale, position, rotation }: FaceLabelProps): React.JSX.Element => {
        const pipPattern = PIP_PATTERNS[faceValue]

        if (pipPattern) {
            return (
                <group position={position} rotation={rotation}>
                    {pipPattern.map(([x, y], dotIndex) => (
                        <mesh
                            key={dotIndex}
                            geometry={sharedDotGeometry}
                            position={[x * labelScale, y * labelScale, 0]}
                        >
                            <meshBasicMaterial color={DICE_LABEL_COLOR} />
                        </mesh>
                    ))}
                </group>
            )
        }

        return (
            <FaceDigitLabel
                faceValue={faceValue}
                labelScale={labelScale}
                position={position}
                rotation={rotation}
            />
        )
    },
)

const FaceDigitLabel = React.memo(
    ({ faceValue, labelScale, position, rotation }: FaceLabelProps): React.JSX.Element => {
        const geometry = useMemo(
            () => createNumberGeometry(faceValue, labelScale),
            [faceValue, labelScale],
        )

        useEffect(
            () => () => {
                geometry.dispose()
            },
            [geometry],
        )

        return (
            <group position={position} rotation={rotation}>
                <mesh geometry={geometry}>
                    <meshBasicMaterial color={DICE_LABEL_COLOR} side={THREE.DoubleSide} />
                </mesh>
            </group>
        )
    },
)

// ─── Motion blur trail ───────────────────────────────────────────────────────

interface MotionTrailProps {
    dieScale: number
    geometry: THREE.BufferGeometry
    edgeGeometry: THREE.EdgesGeometry
}

/**
 * Renders translucent "ghost" copies of the die that lag behind the current
 * rotation, producing a motion-blur effect during spins.
 *
 * Each ghost stores its own quaternion and is updated imperatively from the
 * parent's useFrame, so no React re-renders are triggered.
 */
const MotionTrail = React.memo(
    ({ dieScale, geometry, edgeGeometry }: MotionTrailProps): React.JSX.Element => {
        return (
            <>
                {Array.from({ length: MOTION_BLUR_TRAIL_COUNT }, (_, i) => {
                    const opacity =
                        MOTION_BLUR_MAX_OPACITY * ((MOTION_BLUR_TRAIL_COUNT - i) / MOTION_BLUR_TRAIL_COUNT)
                    return (
                        <group
                            key={i}
                            name={`trail-${i}`}
                            scale={dieScale}
                            visible={false}
                        >
                            <mesh>
                                <primitive attach="geometry" object={geometry} />
                                <meshBasicMaterial
                                    color={DICE_MATERIAL_COLOR}
                                    opacity={opacity}
                                    transparent
                                />
                            </mesh>
                            <lineSegments>
                                <primitive attach="geometry" object={edgeGeometry} />
                                <lineBasicMaterial
                                    color={DICE_EDGE_COLOR}
                                    opacity={opacity * 0.6}
                                    transparent
                                />
                            </lineSegments>
                        </group>
                    )
                })}
            </>
        )
    },
)

// ─── Spinning die ────────────────────────────────────────────────────────────

const SpinningDie = React.memo(
    ({ diceType, isRolling, rollToken, value, size }: SpinningDieProps): React.JSX.Element => {
        const groupRef = useRef<THREE.Group>(null)
        const sceneRef = useRef<THREE.Scene | null>(null)
        const angularVelocityRef = useRef(getSpinVelocity())
        const settledQuaternionRef = useRef(new THREE.Quaternion())
        const currentQuaternionRef = useRef(new THREE.Quaternion())
        const spinActiveRef = useRef(false)
        const isSettlingRef = useRef(false)
        const needsRenderRef = useRef(true)

        // Ring buffer of previous quaternions for the motion trail.
        const trailQuaternions = useRef<THREE.Quaternion[]>(
            Array.from({ length: MOTION_BLUR_TRAIL_COUNT }, () => new THREE.Quaternion()),
        )

        const geometry = useMemo(() => createDieGeometry(diceType), [diceType])
        const edgeGeometry = useMemo(() => new THREE.EdgesGeometry(geometry, 18), [geometry])
        const faceDescriptors = useMemo(() => extractDieFaces(geometry), [geometry])
        const labelScale = useMemo(() => getLabelScale(diceType), [diceType])
        const dieScale = size / 260

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

        // Cache the scene reference so trail groups can be found imperatively.
        const { scene } = useThree()
        sceneRef.current = scene

        // Update settled quaternion when value changes.
        useEffect(() => {
            const nextQuaternion = getSettledDieQuaternion(
                faceDescriptors.map(face => face.normal),
                value,
            )
            settledQuaternionRef.current.copy(nextQuaternion)

            if (!spinActiveRef.current && !isSettlingRef.current) {
                currentQuaternionRef.current.copy(nextQuaternion)
                if (groupRef.current) {
                    groupRef.current.quaternion.copy(nextQuaternion)
                }
                needsRenderRef.current = true
            }
        }, [faceDescriptors, value])

        // React to roll state changes.
        useEffect(() => {
            if (isRolling && rollToken > 0) {
                spinActiveRef.current = true
                isSettlingRef.current = false
                angularVelocityRef.current.copy(getSpinVelocity())
                currentQuaternionRef.current.setFromEuler(
                    new THREE.Euler(
                        Math.random() * Math.PI * 2,
                        Math.random() * Math.PI * 2,
                        Math.random() * Math.PI * 2,
                    ),
                )

                // Initialize trail quaternions to the starting orientation.
                for (const tq of trailQuaternions.current) {
                    tq.copy(currentQuaternionRef.current)
                }
            } else if (!isRolling && spinActiveRef.current) {
                // Transition from spinning to settling — don't snap.
                spinActiveRef.current = false
                isSettlingRef.current = true
            }
        }, [isRolling, rollToken])

        // R3F animation loop — pure imperative mutation, no React state.
        useFrame((state, delta) => {
            if (!groupRef.current) return

            const clampedDelta = Math.min(0.05, delta)
            const elapsed = state.clock.elapsedTime
            let positionY = 0
            const isAnimating = spinActiveRef.current || isSettlingRef.current

            if (spinActiveRef.current) {
                // Cascade trail: each ghost chases the one ahead of it.
                const trail = trailQuaternions.current
                for (let i = trail.length - 1; i > 0; i--) {
                    trail[i].slerp(trail[i - 1], 0.45)
                }
                trail[0].slerp(currentQuaternionRef.current, 0.45)

                // Advance the main die rotation.
                _angularStepEuler.set(
                    angularVelocityRef.current.x * clampedDelta,
                    angularVelocityRef.current.y * clampedDelta,
                    angularVelocityRef.current.z * clampedDelta,
                )
                _angularStep.setFromEuler(_angularStepEuler)
                currentQuaternionRef.current.multiply(_angularStep)
                positionY = Math.sin(elapsed * 14) * 0.12
                angularVelocityRef.current.multiplyScalar(
                    Math.pow(SPIN_DAMPING_BASE, clampedDelta * 60),
                )
            } else if (isSettlingRef.current) {
                // Settle: slerp toward the target quaternion.
                const slerpFactor = 1 - Math.exp(-clampedDelta * SETTLE_SLERP_SPEED)
                currentQuaternionRef.current.slerp(settledQuaternionRef.current, slerpFactor)
                angularVelocityRef.current.lerp(_zeroVec, 0.15)

                const dot = currentQuaternionRef.current.dot(settledQuaternionRef.current)
                if (Math.abs(dot) > SETTLE_CONVERGENCE) {
                    currentQuaternionRef.current.copy(settledQuaternionRef.current)
                    isSettlingRef.current = false
                }
                positionY = Math.sin(elapsed * 1.3) * 0.03 * (1 - Math.abs(dot))

                // Fade trail out during settle.
                const trail = trailQuaternions.current
                for (const tq of trail) {
                    tq.slerp(settledQuaternionRef.current, slerpFactor * 1.5)
                }
            }

            // Apply to the main group.
            groupRef.current.quaternion.copy(currentQuaternionRef.current)
            groupRef.current.position.y = positionY

            // Update trail ghost groups.
            const sceneRoot = sceneRef.current
            if (sceneRoot) {
                for (let i = 0; i < MOTION_BLUR_TRAIL_COUNT; i++) {
                    const trailGroup = sceneRoot.getObjectByName(`trail-${i}`)
                    if (trailGroup) {
                        trailGroup.visible = isAnimating
                        if (isAnimating) {
                            trailGroup.quaternion.copy(trailQuaternions.current[i])
                            trailGroup.position.y = positionY
                        }
                    }
                }
            }

            // Only request a new frame when animating or a one-shot render is needed.
            if (isAnimating || needsRenderRef.current) {
                needsRenderRef.current = false
                state.invalidate()
            }
        })

        useEffect(
            () => () => {
                geometry.dispose()
                edgeGeometry.dispose()
            },
            [edgeGeometry, geometry],
        )

        return (
            <>
                <MotionTrail
                    dieScale={dieScale}
                    geometry={geometry}
                    edgeGeometry={edgeGeometry}
                />
                <group ref={groupRef} scale={dieScale}>
                    <mesh>
                        <primitive attach="geometry" object={geometry} />
                        <meshBasicMaterial color={DICE_MATERIAL_COLOR} />
                    </mesh>
                    <lineSegments>
                        <primitive attach="geometry" object={edgeGeometry} />
                        <lineBasicMaterial color={DICE_EDGE_COLOR} opacity={0.82} transparent />
                    </lineSegments>
                    {faceDescriptors.map((_, index) => (
                        <FaceLabel
                            key={`${diceType}-${index + 1}`}
                            faceValue={index + 1}
                            labelScale={labelScale}
                            position={labelTransforms[index].position}
                            rotation={labelTransforms[index].rotation}
                        />
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
    },
)

// ─── Public surface ──────────────────────────────────────────────────────────

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
                frameloop="demand"
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
