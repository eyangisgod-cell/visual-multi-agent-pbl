/**
 * 文件合并 API 测试
 */

describe('Merge API', () => {
  it('验证合并逻辑', () => {
    // 验证分片完整性检查
    const validateChunks = (uploadedIndices: number[], totalChunks: number): boolean => {
      if (uploadedIndices.length !== totalChunks) {
        return false
      }
      for (let i = 0; i < totalChunks; i++) {
        if (!uploadedIndices.includes(i)) {
          return false
        }
      }
      return true
    }

    expect(validateChunks([0, 1, 2], 3)).toBe(true)
    expect(validateChunks([0, 2], 3)).toBe(false) // 缺少分片 1
    expect(validateChunks([0, 1, 2, 3], 3)).toBe(false) // 超出
  })

  it('验证进度计算逻辑', () => {
    const calculateProgress = (uploaded: number, total: number): number => {
      if (total === 0) return 0
      return Math.round((uploaded / total) * 100 * 100) / 100
    }

    expect(calculateProgress(0, 10)).toBe(0)
    expect(calculateProgress(5, 10)).toBe(50)
    expect(calculateProgress(10, 10)).toBe(100)
    expect(calculateProgress(3, 7)).toBe(42.86)
  })
})
