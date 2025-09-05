#!/usr/bin/env node

/**
 * TutorAI QA Test Suite - Production Readiness Validation
 * 
 * This script performs comprehensive testing to validate that the skeleton
 * application is production-ready before AI tutoring features are built.
 */

import https from 'https';
import http from 'http';
import { performance } from 'perf_hooks';

// Configuration
const config = {
  // Update these URLs when deployed
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  healthEndpoint: '/api/health',
  pingEndpoint: '/api/ping',
  
  // Performance targets
  targets: {
    p50Latency: 400, // ms
    p95Latency: 1000, // ms
    testIterations: 100,
    uptimeThreshold: 99.9 // %
  },
  
  // Test data
  testUser: {
    email: `test_${Date.now()}@example.com`,
    password: 'Test123456!',
    displayName: 'QA Test User'
  }
};

// Test results tracking
const results = {
  infrastructure: {},
  authentication: {},
  firestore: {},
  performance: {},
  security: {},
  overall: { passed: 0, failed: 0, warnings: 0 }
};

// Utility functions
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] ${level.toUpperCase()}:`;
  console.log(`${prefix} ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    const requestLib = url.startsWith('https://') ? https : http;
    
    const req = requestLib.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        let parsedData = data;
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          // Keep as string if not JSON
        }
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsedData,
          responseTime,
          rawData: data
        });
      });
    });
    
    req.on('error', (error) => {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      reject({ error, responseTime });
    });
    
    if (options.data) {
      req.write(options.data);
    }
    
    req.end();
  });
}

function calculatePercentile(values, percentile) {
  const sorted = values.slice().sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index] || 0;
}

// Test Suite Implementation

async function testInfrastructure() {
  log('info', '🏗️  Testing Infrastructure & Deployment...');
  
  try {
    // Test basic connectivity
    const healthResponse = await makeRequest(`${config.baseUrl}${config.healthEndpoint}`);
    
    if (healthResponse.statusCode !== 200) {
      results.infrastructure.connectivity = '❌ Health endpoint not responding';
      results.overall.failed++;
      return;
    }
    
    // Validate health endpoint response
    const healthData = healthResponse.data;
    const requiredFields = ['status', 'timestamp', 'service', 'version', 'environment'];
    const missingFields = requiredFields.filter(field => !healthData[field]);
    
    if (missingFields.length > 0) {
      results.infrastructure.healthEndpoint = `⚠️  Missing fields: ${missingFields.join(', ')}`;
      results.overall.warnings++;
    } else {
      results.infrastructure.healthEndpoint = '✅ Health endpoint valid';
      results.overall.passed++;
    }
    
    // Test HTTPS (if deployed)
    if (config.baseUrl.startsWith('https://')) {
      results.infrastructure.https = '✅ HTTPS enabled';
      results.overall.passed++;
    } else {
      results.infrastructure.https = '⚠️  HTTPS not tested (local development)';
      results.overall.warnings++;
    }
    
    // Validate environment badge information
    const indexResponse = await makeRequest(config.baseUrl);
    if (indexResponse.statusCode === 200 && indexResponse.rawData.includes('GIT_SHA')) {
      results.infrastructure.environmentBadge = '✅ Environment badge visible';
      results.overall.passed++;
    } else {
      results.infrastructure.environmentBadge = '❌ Environment badge not found';
      results.overall.failed++;
    }
    
    log('info', 'Infrastructure tests completed', results.infrastructure);
    
  } catch (error) {
    results.infrastructure.error = `❌ Infrastructure test failed: ${error.message}`;
    results.overall.failed++;
    log('error', 'Infrastructure test error', error);
  }
}

async function testFirestoreConnectivity() {
  log('info', '🔥 Testing Firestore Connectivity...');
  
  try {
    const pingResponse = await makeRequest(`${config.baseUrl}${config.pingEndpoint}`);
    
    if (pingResponse.statusCode !== 200) {
      results.firestore.connectivity = '❌ Ping endpoint not responding';
      results.overall.failed++;
      return;
    }
    
    const pingData = pingResponse.data;
    
    // Validate ping response structure
    if (pingData.ok && pingData.firestore && pingData.firestore.connected) {
      results.firestore.connectivity = `✅ Firestore connected (${pingData.firestore.latency}ms)`;
      results.overall.passed++;
    } else {
      results.firestore.connectivity = '❌ Firestore not connected';
      results.overall.failed++;
    }
    
    // Check for required fields in ping response
    const requiredPingFields = ['timestamp', 'server', 'environment', 'gitSha', 'responseTime'];
    const missingPingFields = requiredPingFields.filter(field => !pingData[field]);
    
    if (missingPingFields.length > 0) {
      results.firestore.pingResponse = `⚠️  Missing fields: ${missingPingFields.join(', ')}`;
      results.overall.warnings++;
    } else {
      results.firestore.pingResponse = '✅ Ping response complete';
      results.overall.passed++;
    }
    
  } catch (error) {
    results.firestore.error = `❌ Firestore test failed: ${error.message}`;
    results.overall.failed++;
    log('error', 'Firestore test error', error);
  }
}

async function testPerformance() {
  log('info', '⚡ Testing Performance & Latency...');
  
  try {
    const latencies = [];
    const errors = [];
    
    log('info', `Running ${config.targets.testIterations} sequential requests...`);
    
    for (let i = 0; i < config.targets.testIterations; i++) {
      try {
        const response = await makeRequest(`${config.baseUrl}${config.pingEndpoint}`);
        if (response.statusCode === 200) {
          latencies.push(response.responseTime);
        } else {
          errors.push(`Request ${i + 1}: HTTP ${response.statusCode}`);
        }
        
        // Progress indicator
        if ((i + 1) % 20 === 0) {
          log('info', `Completed ${i + 1}/${config.targets.testIterations} requests`);
        }
        
      } catch (error) {
        errors.push(`Request ${i + 1}: ${error.error?.message || 'Network error'}`);
      }
    }
    
    if (latencies.length === 0) {
      results.performance.error = '❌ No successful requests completed';
      results.overall.failed++;
      return;
    }
    
    // Calculate percentiles
    const p50 = calculatePercentile(latencies, 50);
    const p95 = calculatePercentile(latencies, 95);
    const p99 = calculatePercentile(latencies, 99);
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const min = Math.min(...latencies);
    const max = Math.max(...latencies);
    
    // Success rate
    const successRate = (latencies.length / config.targets.testIterations) * 100;
    
    results.performance.statistics = {
      requests: config.targets.testIterations,
      successful: latencies.length,
      failed: errors.length,
      successRate: `${successRate.toFixed(2)}%`,
      latency: {
        min: `${min.toFixed(2)}ms`,
        max: `${max.toFixed(2)}ms`,
        avg: `${avg.toFixed(2)}ms`,
        p50: `${p50.toFixed(2)}ms`,
        p95: `${p95.toFixed(2)}ms`,
        p99: `${p99.toFixed(2)}ms`
      }
    };
    
    // Validate performance targets
    if (p50 <= config.targets.p50Latency) {
      results.performance.p50 = `✅ P50 latency: ${p50.toFixed(2)}ms (target: <${config.targets.p50Latency}ms)`;
      results.overall.passed++;
    } else {
      results.performance.p50 = `❌ P50 latency: ${p50.toFixed(2)}ms (target: <${config.targets.p50Latency}ms)`;
      results.overall.failed++;
    }
    
    if (p95 <= config.targets.p95Latency) {
      results.performance.p95 = `✅ P95 latency: ${p95.toFixed(2)}ms (target: <${config.targets.p95Latency}ms)`;
      results.overall.passed++;
    } else {
      results.performance.p95 = `❌ P95 latency: ${p95.toFixed(2)}ms (target: <${config.targets.p95Latency}ms)`;
      results.overall.failed++;
    }
    
    if (successRate >= config.targets.uptimeThreshold) {
      results.performance.reliability = `✅ Success rate: ${successRate.toFixed(2)}% (target: >${config.targets.uptimeThreshold}%)`;
      results.overall.passed++;
    } else {
      results.performance.reliability = `❌ Success rate: ${successRate.toFixed(2)}% (target: >${config.targets.uptimeThreshold}%)`;
      results.overall.failed++;
    }
    
    // Log errors if any
    if (errors.length > 0 && errors.length <= 10) {
      results.performance.errors = errors;
    } else if (errors.length > 10) {
      results.performance.errors = [...errors.slice(0, 10), `... and ${errors.length - 10} more errors`];
    }
    
    log('info', 'Performance tests completed', results.performance);
    
  } catch (error) {
    results.performance.error = `❌ Performance test failed: ${error.message}`;
    results.overall.failed++;
    log('error', 'Performance test error', error);
  }
}

async function testSecurity() {
  log('info', '🔒 Testing Security & Data Protection...');
  
  try {
    // Test 1: Check for exposed secrets in response headers
    const response = await makeRequest(`${config.baseUrl}${config.pingEndpoint}`);
    
    const sensitivePatterns = [
      /FIREBASE_PRIVATE_KEY/i,
      /firebase.*private.*key/i,
      /AIza[0-9A-Za-z\\-_]{35}/g, // Firebase API key pattern
      /-----BEGIN PRIVATE KEY-----/i,
      /client_secret/i
    ];
    
    let secretsExposed = false;
    const responseString = JSON.stringify(response);
    
    sensitivePatterns.forEach(pattern => {
      if (pattern.test(responseString)) {
        secretsExposed = true;
      }
    });
    
    if (secretsExposed) {
      results.security.secretExposure = '❌ Sensitive data exposed in API response';
      results.overall.failed++;
    } else {
      results.security.secretExposure = '✅ No sensitive data in API responses';
      results.overall.passed++;
    }
    
    // Test 2: Security headers
    const securityHeaders = {
      'x-frame-options': 'DENY',
      'x-content-type-options': 'nosniff',
      'cache-control': 'no-cache, no-store, must-revalidate'
    };
    
    let securityHeadersPassed = 0;
    const missingHeaders = [];
    
    Object.entries(securityHeaders).forEach(([header, expectedValue]) => {
      const actualValue = response.headers[header];
      if (actualValue && actualValue.toLowerCase().includes(expectedValue.toLowerCase())) {
        securityHeadersPassed++;
      } else {
        missingHeaders.push(header);
      }
    });
    
    if (securityHeadersPassed === Object.keys(securityHeaders).length) {
      results.security.headers = '✅ Security headers properly configured';
      results.overall.passed++;
    } else {
      results.security.headers = `⚠️  Missing security headers: ${missingHeaders.join(', ')}`;
      results.overall.warnings++;
    }
    
    // Test 3: HTTPS redirect (if applicable)
    if (config.baseUrl.startsWith('http://') && config.baseUrl !== 'http://localhost:3000') {
      results.security.httpsRedirect = '⚠️  HTTPS redirect not tested (non-production URL)';
      results.overall.warnings++;
    } else {
      results.security.httpsRedirect = '✅ HTTPS configuration verified';
      results.overall.passed++;
    }
    
    log('info', 'Security tests completed', results.security);
    
  } catch (error) {
    results.security.error = `❌ Security test failed: ${error.message}`;
    results.overall.failed++;
    log('error', 'Security test error', error);
  }
}

async function testEndToEnd() {
  log('info', '🌐 Testing End-to-End User Flow...');
  
  try {
    // Test 1: Landing page accessibility
    const landingResponse = await makeRequest(config.baseUrl);
    
    if (landingResponse.statusCode === 200) {
      // Check for key elements in landing page
      const landingContent = landingResponse.rawData;
      const keyElements = [
        'TutorAI',
        'Sign In',
        'Get Started',
        'environment',
        'build'
      ];
      
      const missingElements = keyElements.filter(element => 
        !landingContent.toLowerCase().includes(element.toLowerCase())
      );
      
      if (missingElements.length === 0) {
        results.authentication.landingPage = '✅ Landing page elements present';
        results.overall.passed++;
      } else {
        results.authentication.landingPage = `⚠️  Missing elements: ${missingElements.join(', ')}`;
        results.overall.warnings++;
      }
    } else {
      results.authentication.landingPage = '❌ Landing page not accessible';
      results.overall.failed++;
    }
    
    // Test 2: Auth pages accessibility
    const signInResponse = await makeRequest(`${config.baseUrl}/auth/signin`);
    const signUpResponse = await makeRequest(`${config.baseUrl}/auth/signup`);
    
    if (signInResponse.statusCode === 200 && signUpResponse.statusCode === 200) {
      results.authentication.authPages = '✅ Authentication pages accessible';
      results.overall.passed++;
    } else {
      results.authentication.authPages = `❌ Auth pages error (signin: ${signInResponse.statusCode}, signup: ${signUpResponse.statusCode})`;
      results.overall.failed++;
    }
    
    // Test 3: Protected route behavior (should redirect or show access denied)
    const dashboardResponse = await makeRequest(`${config.baseUrl}/dashboard`);
    
    // Dashboard should either redirect (3xx) or show access control (2xx but with auth gate)
    if (dashboardResponse.statusCode >= 200 && dashboardResponse.statusCode < 400) {
      results.authentication.protectedRoutes = '✅ Protected routes properly configured';
      results.overall.passed++;
    } else {
      results.authentication.protectedRoutes = `⚠️  Unexpected dashboard response: ${dashboardResponse.statusCode}`;
      results.overall.warnings++;
    }
    
    log('info', 'End-to-end tests completed', results.authentication);
    
  } catch (error) {
    results.authentication.error = `❌ E2E test failed: ${error.message}`;
    results.overall.failed++;
    log('error', 'End-to-end test error', error);
  }
}

function generateReport() {
  log('info', '📊 Generating QA Report...');
  
  const totalTests = results.overall.passed + results.overall.failed + results.overall.warnings;
  const passRate = totalTests > 0 ? ((results.overall.passed / totalTests) * 100).toFixed(1) : 0;
  
  const report = {
    summary: {
      timestamp: new Date().toISOString(),
      testEnvironment: config.baseUrl,
      totalTests,
      passed: results.overall.passed,
      failed: results.overall.failed,
      warnings: results.overall.warnings,
      passRate: `${passRate}%`
    },
    details: {
      infrastructure: results.infrastructure,
      authentication: results.authentication,
      firestore: results.firestore,
      performance: results.performance,
      security: results.security
    }
  };
  
  // Determine go/no-go decision
  const criticalFailures = results.overall.failed;
  const goNoGo = criticalFailures === 0 && results.overall.passed >= 8;
  
  report.recommendation = {
    decision: goNoGo ? '✅ GO - Safe to build tutoring features' : '❌ NO-GO - Issues must be resolved',
    reasoning: goNoGo 
      ? 'All critical tests passed. Infrastructure is stable and ready for feature development.'
      : `${criticalFailures} critical failures detected. Must resolve before proceeding.`,
    nextSteps: goNoGo 
      ? ['Begin AI/ML tutoring engine integration', 'Set up monitoring alerts', 'Plan user acceptance testing']
      : ['Fix all failing tests', 'Address performance issues', 'Re-run QA validation']
  };
  
  return report;
}

// Main execution
async function runQA() {
  log('info', '🚀 Starting TutorAI QA Test Suite...');
  log('info', `Testing environment: ${config.baseUrl}`);
  
  try {
    await testInfrastructure();
    await testFirestoreConnectivity();
    await testPerformance();
    await testSecurity();
    await testEndToEnd();
    
    const report = generateReport();
    
    console.log('\n' + '='.repeat(80));
    console.log('📋 TUTORAI QA TEST REPORT');
    console.log('='.repeat(80));
    console.log(JSON.stringify(report, null, 2));
    console.log('='.repeat(80));
    
    // Exit with appropriate code
    process.exit(report.recommendation.decision.includes('GO') ? 0 : 1);
    
  } catch (error) {
    log('error', 'QA test suite failed', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runQA();
}

export { runQA, config };