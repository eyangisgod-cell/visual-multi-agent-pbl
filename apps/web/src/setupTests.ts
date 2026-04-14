import '@testing-library/jest-dom'

// Mock chart.js registration
jest.mock('chart.js', () => {
  return {
    Chart: {
      register: jest.fn(),
    },
    CategoryScale: {},
    LinearScale: {},
    PointElement: {},
    LineElement: {},
    BarElement: {},
    ArcElement: {},
    Title: {},
    Tooltip: {},
    Legend: {},
  }
})

// Mock URL.createObjectURL and revokeObjectURL for file preview
if (typeof URL.createObjectURL === 'undefined') {
  Object.defineProperty(URL, 'createObjectURL', {
    value: (obj: Blob) => {
      if (obj instanceof File) {
        return `mock-url-for-${obj.name}`
      }
      return 'mock-url'
    },
    writable: true,
    configurable: true,
  })
}

if (typeof URL.revokeObjectURL === 'undefined') {
  Object.defineProperty(URL, 'revokeObjectURL', {
    value: jest.fn(),
    writable: true,
    configurable: true,
  })
}

// Mock crypto for file hash calculation
if (typeof crypto === 'undefined' || !crypto.subtle) {
  Object.defineProperty(global, 'crypto', {
    value: {
      subtle: {
        digest: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
      },
    },
    writable: true,
    configurable: true,
  })
}
