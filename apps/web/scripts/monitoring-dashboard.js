#!/usr/bin/env node

/**
 * TutorAI Monitoring Dashboard
 * 
 * A simple command-line dashboard for monitoring TutorAI system performance.
 * Run this script periodically or use with a monitoring service.
 * 
 * Usage:
 *   node scripts/monitoring-dashboard.js [--interval=30] [--baseUrl=http://localhost:3000]
 */

const https = require('https');
const http = require('http');

// Parse command line arguments
const args = process.argv.slice(2);
const interval = parseInt(args.find(arg => arg.startsWith('--interval='))?.split('=')[1] || '30');
const baseUrl = args.find(arg => arg.startsWith('--baseUrl='))?.split('=')[1] || 'http://localhost:3000';

console.log(`🤖 TutorAI Monitoring Dashboard`);
console.log(`📊 Checking every ${interval} seconds`);
console.log(`🌐 Base URL: ${baseUrl}`);
console.log('─'.repeat(60));

/**
 * Make HTTP request
 */
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: { error: 'Invalid JSON response' }
          });
        }
      });
    }).on('error', reject);
  });
}

/**
 * Format bytes
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

/**
 * Get health status emoji
 */
function getHealthEmoji(status) {
  switch (status) {
    case 'healthy': return '✅';
    case 'unhealthy': return '⚠️';
    case 'error': return '❌';
    default: return '❓';
  }
}

/**
 * Display system status
 */
async function displayStatus() {
  const timestamp = new Date().toLocaleString();
  
  try {
    // Get health status
    const healthResponse = await makeRequest(`${baseUrl}/api/monitoring/health`);
    const health = healthResponse.data;
    
    // Get system metrics
    const metricsResponse = await makeRequest(`${baseUrl}/api/monitoring/metrics?type=system`);
    const metrics = metricsResponse.data?.data || {};
    
    // Clear screen and show header
    console.clear();
    console.log(`🤖 TutorAI System Status - ${timestamp}`);
    console.log('═'.repeat(60));
    
    // Health status
    console.log(`${getHealthEmoji(health.status)} Health: ${health.status?.toUpperCase() || 'UNKNOWN'}`);
    
    if (health.issues && health.issues.length > 0) {
      console.log(`⚠️  Issues: ${health.issues.join(', ')}`);
    }
    
    console.log('─'.repeat(60));
    
    // System metrics
    console.log('📊 System Metrics:');
    console.log(`   👥 Active Users: ${metrics.activeUsers || 0}`);
    console.log(`   💬 Active Sessions: ${metrics.totalSessions || 0}`);
    console.log(`   ⏱️  Avg Response Time: ${metrics.averageResponseTime || 0}ms`);
    console.log(`   ✅ Success Rate: ${((metrics.successRate || 1) * 100).toFixed(1)}%`);
    console.log(`   🛡️  Safety Violation Rate: ${((metrics.safetyViolationRate || 0) * 100).toFixed(2)}%`);
    
    console.log('─'.repeat(60));
    
    // Performance indicators
    const responseTime = metrics.averageResponseTime || 0;
    const successRate = metrics.successRate || 1;
    
    console.log('🎯 Performance Indicators:');
    console.log(`   Response Time: ${responseTime < 1000 ? '✅' : responseTime < 1500 ? '⚠️' : '❌'} ${responseTime}ms (target: <1000ms)`);
    console.log(`   Success Rate: ${successRate > 0.95 ? '✅' : successRate > 0.9 ? '⚠️' : '❌'} ${(successRate * 100).toFixed(1)}% (target: >95%)`);
    console.log(`   Safety: ${(metrics.safetyViolationRate || 0) < 0.05 ? '✅' : '⚠️'} ${((metrics.safetyViolationRate || 0) * 100).toFixed(2)}% violations (target: <5%)`);
    
    console.log('─'.repeat(60));
    console.log(`Next update in ${interval} seconds... (Ctrl+C to stop)`);
    
  } catch (error) {
    console.log('❌ Error fetching status:', error.message);
    console.log(`Retrying in ${interval} seconds...`);
  }
}

/**
 * Display detailed report
 */
async function displayDetailedReport() {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  const now = Date.now();
  
  try {
    const reportResponse = await makeRequest(
      `${baseUrl}/api/monitoring/metrics?type=report&startTime=${oneHourAgo}&endTime=${now}`
    );
    
    const report = reportResponse.data?.data || {};
    
    console.log('\n📈 Last Hour Report:');
    console.log(`   Total Turns: ${report.totalTurns || 0}`);
    console.log(`   Unique Users: ${report.uniqueUsers || 0}`);
    console.log(`   Unique Sessions: ${report.uniqueSessions || 0}`);
    console.log(`   Avg Response Time: ${report.averageResponseTime || 0}ms`);
    console.log(`   Success Rate: ${((report.successRate || 1) * 100).toFixed(1)}%`);
    
    if (report.topicBreakdown && Object.keys(report.topicBreakdown).length > 0) {
      console.log('   Topic Breakdown:');
      Object.entries(report.topicBreakdown).forEach(([topic, count]) => {
        console.log(`     - ${topic}: ${count} turns`);
      });
    }
    
    if (report.errorBreakdown && Object.keys(report.errorBreakdown).length > 0) {
      console.log('   Error Breakdown:');
      Object.entries(report.errorBreakdown).forEach(([error, count]) => {
        console.log(`     - ${error}: ${count} occurrences`);
      });
    }
    
  } catch (error) {
    console.log('❌ Error fetching detailed report:', error.message);
  }
}

/**
 * Main monitoring loop
 */
async function startMonitoring() {
  let showDetailedReport = false;
  
  // Handle keyboard input
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', (key) => {
    if (key.toString() === 'd') {
      showDetailedReport = !showDetailedReport;
    } else if (key.toString() === 'q' || key.toString() === '\u0003') {
      console.log('\n👋 Monitoring stopped');
      process.exit();
    }
  });
  
  console.log('💡 Press "d" for detailed report, "q" to quit\n');
  
  // Display initial status
  await displayStatus();
  
  if (showDetailedReport) {
    await displayDetailedReport();
  }
  
  // Set up periodic updates
  setInterval(async () => {
    await displayStatus();
    
    if (showDetailedReport) {
      await displayDetailedReport();
    }
  }, interval * 1000);
}

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n👋 Monitoring stopped');
  process.exit();
});

process.on('SIGTERM', () => {
  console.log('\n👋 Monitoring stopped');
  process.exit();
});

// Start monitoring
startMonitoring().catch(error => {
  console.error('❌ Failed to start monitoring:', error);
  process.exit(1);
});