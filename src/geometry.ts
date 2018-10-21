import { BufferGeometry, Float32BufferAttribute, Uint16BufferAttribute } from 'three'

import { MinecraftModel, MinecraftModelFaceName, ArrayVector3, ArrayVector4, RotationAngle } from './model'

type FaceVertexMap = [ArrayVector3, ArrayVector3, ArrayVector3, ArrayVector3]

const vertexMap: {
  [name in MinecraftModelFaceName]: FaceVertexMap
} = {
  west: [[0, 0, 0], [0, 1, 0], [0, 1, 1], [0, 0, 1]],
  east: [[1, 0, 1], [1, 1, 1], [1, 1, 0], [1, 0, 0]],
  down: [[0, 0, 0], [0, 0, 1], [1, 0, 1], [1, 0, 0]],
  up: [[0, 1, 1], [0, 1, 0], [1, 1, 0], [1, 1, 1]],
  north: [[1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 0]],
  south: [[0, 0, 1], [0, 1, 1], [1, 1, 1], [1, 0, 1]]
}

export class MinecraftModelGeometry extends BufferGeometry {
  constructor (model: MinecraftModel) {
    super()
    const [vertices, uvs, indices] = this.computeAttributes(model)

    this.addAttribute('position', new Float32BufferAttribute(vertices, 3))
    this.addAttribute('uv', new Float32BufferAttribute(uvs, 2))
    this.setIndex(new Uint16BufferAttribute(indices, 1))
  }

  private computeAttributes (model: MinecraftModel) {
    const vertices = []
    const uvs = []
    const indices = []

    for (const element of model.elements) {
      const { from, to } = element

      for (const name in element.faces) {
        const faceName = name as MinecraftModelFaceName
        const face = element.faces[faceName]

        const i = vertices.length / 3
        indices.push(i, i + 2, i + 1)
        indices.push(i, i + 3, i + 2)

        for (const vertex of this.rotatedVertexMap(face.rotation || 0, vertexMap[faceName])) {
          vertices.push(...vertex.map((v, i) => v === 0 ? from[i] : to[i]))
        }

        const faceUvs = face.uv || this.generatedUvs(faceName, from, to)
        const [u1, v1, u2, v2] = this.computeNormalizedUvs(faceUvs)

        uvs.push(u1, v2)
        uvs.push(u1, v1)
        uvs.push(u2, v1)
        uvs.push(u2, v2)
      }
    }

    return [vertices, uvs, indices]
  }

  private rotatedVertexMap (rotation: RotationAngle, [a, b, c, d]: FaceVertexMap): FaceVertexMap {
    return (
      rotation === 0 ? [a, b, c, d] :
      rotation === 90 ? [b, c, d, a] :
      rotation === 180 ? [c, d, a, b] :
      [d, a, b, c]
    )
  }

  private generatedUvs (faceName: MinecraftModelFaceName, [x1, y1, z1]: ArrayVector3, [x2, y2, z2]: ArrayVector3): ArrayVector4 {
    return (
      faceName === 'west' ? [z1, 16 - y2, z2, 16 - y1] :
      faceName === 'east' ? [16 - z2, 16 - y2, 16 - z1, 16 - y1] :
      faceName === 'down' ? [x1, 16 - z2, x2, 16 - z1] :
      faceName === 'up' ? [x1, z1, x2, z2] :
      faceName === 'north' ? [16 - x2, 16 - y2, 16 - x1, 16 - y1] :
      [x1, 16 - y2, x2, 16 - y1]
     ) as ArrayVector4
  }

  private computeNormalizedUvs (uvs: ArrayVector4): ArrayVector4 {
    return uvs.map((coordinate, i) =>
      (i % 2 ? 16 - coordinate : coordinate) / 16
    ) as ArrayVector4
  }
}
