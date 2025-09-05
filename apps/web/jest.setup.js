import '@testing-library/jest-dom'

// Mock Next.js server components
global.Request = global.Request || class Request extends URL {};
global.Response = global.Response || class Response {};
global.Headers = global.Headers || class Headers {};

// Mock Next.js NextRequest
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url, init) => ({
    url,
    method: init?.method || 'GET',
    headers: new Map(Object.entries(init?.headers || {})),
    json: () => Promise.resolve(JSON.parse(init?.body || '{}')),
    body: init?.body,
  })),
  NextResponse: {
    json: (data, options) => ({
      status: options?.status || 200,
      json: () => Promise.resolve(data),
    }),
  },
}));

// Mock Firebase Admin
jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  cert: jest.fn(),
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
      add: jest.fn(),
      where: jest.fn(),
    })),
  })),
}));

// Mock Google Cloud Vertex AI
jest.mock('@google-cloud/vertexai', () => ({
  VertexAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  tutor_message: "What do you think?",
                  intent: "ask_probe",
                  concept_tags: ["test"],
                  hint_level: 0
                })
              }]
            }
          }]
        }
      })
    })
  }))
}));

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.GOOGLE_APPLICATION_CREDENTIALS = 'test-key.json';
process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
process.env.VERTEX_AI_LOCATION = 'us-central1';

// Global test utilities
global.createMockRequest = (body) => ({
  json: () => Promise.resolve(body),
  headers: {
    get: jest.fn(() => 'application/json')
  }
});

global.createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  };
  return res;
};

// Suppress console output during tests unless explicitly needed
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
});

// Increase timeout for integration tests
jest.setTimeout(30000);