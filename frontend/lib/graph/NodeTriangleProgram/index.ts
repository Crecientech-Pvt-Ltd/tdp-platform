import { NodeProgram, type ProgramInfo } from 'sigma/rendering';
import type { NodeDisplayData, RenderParams } from 'sigma/types';
import { floatColor } from 'sigma/utils';

const { UNSIGNED_BYTE, FLOAT } = WebGLRenderingContext;

const UNIFORMS = ['u_sizeRatio', 'u_pixelRatio', 'u_matrix'] as const;

import VERTEX_SHADER_SOURCE from '../NodeGradientProgram/node-gradient-vert.glsl';

const FRAGMENT_SHADER_SOURCE = `
precision mediump float;
varying vec4 v_color;

void main(void) {
  vec2 p = gl_PointCoord;

  // Transform coords from (0..1) → (-1..1)
  vec2 centered = p * 2.0 - 1.0;

  // Define an upright equilateral triangle that fits in the (-1,1) square
  // Triangle vertices: (0, 0.8), (-0.7, -0.4), (0.7, -0.4)
  
  // Bottom edge: y = -0.4
  if (centered.y < -0.4) discard;
  
  // Left edge: from (-0.7, -0.4) to (0, 0.8)
  // slope = (0.8 - (-0.4)) / (0 - (-0.7)) = 1.2 / 0.7 ≈ 1.714
  if (centered.y > 1.714 * centered.x + 1.2) discard;
  
  // Right edge: from (0.7, -0.4) to (0, 0.8)  
  // slope = (0.8 - (-0.4)) / (0 - 0.7) = 1.2 / (-0.7) ≈ -1.714
  if (centered.y > -1.714 * centered.x + 1.2) discard;

  gl_FragColor = v_color;
}
`;

export default class NodeTriangleProgram extends NodeProgram<(typeof UNIFORMS)[number]> {
  getDefinition() {
    return {
      VERTICES: 1,
      VERTEX_SHADER_SOURCE,
      FRAGMENT_SHADER_SOURCE,
      METHOD: WebGLRenderingContext.POINTS,
      UNIFORMS,
      ATTRIBUTES: [
        { name: 'a_position', size: 2, type: FLOAT },
        { name: 'a_size', size: 1, type: FLOAT },
        { name: 'a_color', size: 4, type: UNSIGNED_BYTE, normalized: true },
        { name: 'a_id', size: 4, type: UNSIGNED_BYTE, normalized: true },
      ],
    };
  }

  processVisibleItem(nodeIndex: number, startIndex: number, data: NodeDisplayData) {
    const array = this.array;
    array[startIndex++] = data.x;
    array[startIndex++] = data.y;
    array[startIndex++] = data.size;
    array[startIndex++] = floatColor(data.color);
    array[startIndex++] = nodeIndex;
  }

  setUniforms(params: RenderParams, { gl, uniformLocations }: ProgramInfo): void {
    const { u_sizeRatio, u_pixelRatio, u_matrix } = uniformLocations;
    gl.uniform1f(u_sizeRatio, params.sizeRatio);
    gl.uniform1f(u_pixelRatio, params.pixelRatio);
    gl.uniformMatrix3fv(u_matrix, false, params.matrix);
  }
}
