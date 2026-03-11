import * as THREE from "three"
import { DiceType } from "@/features/games/domain/dice"

const D10_RING_OFFSET_RATIO = 0.10557280900008414
const DISPLAY_NORMAL = new THREE.Vector3(0.48, 0.82, 1).normalize()
const FACE_NORMAL_GROUP_EPSILON = 0.9994
const FACE_VERTEX_PRECISION = 10000

export interface DieFace {
    center: THREE.Vector3
    normal: THREE.Vector3
}

const buildD10Geometry = (): THREE.BufferGeometry => {
    const poleHeight = 1.38
    const ringRadius = 1
    const ringOffsetHeight = poleHeight * D10_RING_OFFSET_RATIO
    const upperVertices: number[] = []
    const lowerVertices: number[] = []
    const triangleIndices: number[] = []

    for (let index = 0; index < 5; index += 1) {
        const upperAngle = (index / 5) * Math.PI * 2
        const lowerAngle = upperAngle + Math.PI / 5

        upperVertices.push(
            ringRadius * Math.cos(upperAngle),
            ringRadius * Math.sin(upperAngle),
            ringOffsetHeight,
        )
        lowerVertices.push(
            ringRadius * Math.cos(lowerAngle),
            ringRadius * Math.sin(lowerAngle),
            -ringOffsetHeight,
        )
    }

    const vertices = [0, 0, poleHeight, 0, 0, -poleHeight, ...upperVertices, ...lowerVertices]

    for (let index = 0; index < 5; index += 1) {
        const upperIndex = 2 + index
        const nextUpperIndex = 2 + ((index + 1) % 5)
        const lowerIndex = 7 + index
        const nextLowerIndex = 7 + ((index + 1) % 5)

        // Top half kite face.
        triangleIndices.push(0, upperIndex, lowerIndex)
        triangleIndices.push(0, lowerIndex, nextUpperIndex)

        // Bottom half kite face.
        triangleIndices.push(1, lowerIndex, nextUpperIndex)
        triangleIndices.push(1, nextLowerIndex, lowerIndex)
    }

    return new THREE.PolyhedronGeometry(vertices, triangleIndices, 1.48, 0)
}

export const createDieGeometry = (diceType: DiceType): THREE.BufferGeometry => {
    switch (diceType) {
        case 4:
            return new THREE.TetrahedronGeometry(1.56, 0)
        case 6:
            return new THREE.BoxGeometry(1.92, 1.92, 1.92)
        case 8:
            return new THREE.OctahedronGeometry(1.62, 0)
        case 10:
            return buildD10Geometry()
        case 12:
            return new THREE.DodecahedronGeometry(1.44, 0)
        case 20:
            return new THREE.IcosahedronGeometry(1.62, 0)
    }
}

const sortFaces = (left: DieFace, right: DieFace): number => {
    if (left.normal.z !== right.normal.z) {
        return right.normal.z - left.normal.z
    }
    if (left.normal.y !== right.normal.y) {
        return right.normal.y - left.normal.y
    }
    return right.normal.x - left.normal.x
}

export const extractDieFaces = (geometry: THREE.BufferGeometry): DieFace[] => {
    const sourceGeometry = geometry.index ? geometry.toNonIndexed() : geometry.clone()
    const positions = sourceGeometry.getAttribute("position")
    const vertexA = new THREE.Vector3()
    const vertexB = new THREE.Vector3()
    const vertexC = new THREE.Vector3()
    const edgeAB = new THREE.Vector3()
    const edgeAC = new THREE.Vector3()
    const faceNormal = new THREE.Vector3()
    const triangleCenter = new THREE.Vector3()
    const groupedFaces: Array<{ normal: THREE.Vector3; vertices: Map<string, THREE.Vector3> }> = []

    for (let index = 0; index < positions.count; index += 3) {
        vertexA.fromBufferAttribute(positions, index)
        vertexB.fromBufferAttribute(positions, index + 1)
        vertexC.fromBufferAttribute(positions, index + 2)

        edgeAB.subVectors(vertexB, vertexA)
        edgeAC.subVectors(vertexC, vertexA)
        faceNormal.crossVectors(edgeAB, edgeAC).normalize()

        if (faceNormal.lengthSq() === 0) {
            continue
        }

        triangleCenter
            .copy(vertexA)
            .add(vertexB)
            .add(vertexC)
            .multiplyScalar(1 / 3)

        const existingFace = groupedFaces.find(
            candidate => candidate.normal.dot(faceNormal) > FACE_NORMAL_GROUP_EPSILON,
        )

        const targetFace = existingFace ?? {
            normal: faceNormal.clone(),
            vertices: new Map<string, THREE.Vector3>(),
        }

        if (!existingFace) {
            groupedFaces.push(targetFace)
        }

        ;[vertexA, vertexB, vertexC].forEach(vertex => {
            const key = [
                Math.round(vertex.x * FACE_VERTEX_PRECISION),
                Math.round(vertex.y * FACE_VERTEX_PRECISION),
                Math.round(vertex.z * FACE_VERTEX_PRECISION),
            ].join(":")

            if (!targetFace.vertices.has(key)) {
                targetFace.vertices.set(key, vertex.clone())
            }
        })
    }

    sourceGeometry.dispose()

    return groupedFaces
        .map(({ normal, vertices }) => {
            const center = new THREE.Vector3()
            vertices.forEach(vertex => {
                center.add(vertex)
            })
            center.multiplyScalar(1 / Math.max(1, vertices.size))

            return {
                center,
                normal,
            }
        })
        .sort(sortFaces)
}

export const extractUniqueFaceNormals = (geometry: THREE.BufferGeometry): THREE.Vector3[] =>
    extractDieFaces(geometry).map(face => face.normal.clone())

export const getDieLabelScale = (diceType: DiceType): number => {
    switch (diceType) {
        case 4:
            return 0.24
        case 6:
            return 0.42
        case 8:
            return 0.3
        case 10:
            return 0.26
        case 12:
            return 0.24
        case 20:
            return 0.2
    }
}

export const getSettledDieQuaternion = (
    faceNormals: THREE.Vector3[],
    value: number,
): THREE.Quaternion => {
    if (faceNormals.length === 0) {
        return new THREE.Quaternion()
    }

    const faceNormal = faceNormals[(Math.max(1, value) - 1) % faceNormals.length]
        .clone()
        .normalize()
    const alignmentQuaternion = new THREE.Quaternion().setFromUnitVectors(
        faceNormal,
        DISPLAY_NORMAL,
    )
    const twistQuaternion = new THREE.Quaternion().setFromAxisAngle(
        DISPLAY_NORMAL,
        (((value * 0.61803398875) % 1) - 0.5) * Math.PI,
    )

    return twistQuaternion.multiply(alignmentQuaternion)
}
