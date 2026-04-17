/**
 * @file webpagetest.js
 * @description WebPageTest performance testing configuration
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 3.0.0
 */

const fs = require('fs')
const path = require('path')

// WebPageTest API Configuration
const WPT_CONFIG = {
  apiKey: process.env.WPT_API_KEY || '',
  server: 'https://www.webpagetest.org',
  test: {
    url: 'http://localhost:3000',
    location: 'Dulles_MotoG5',
    browser: 'Chrome',
    connectivity: 'Cable',
    runs: 3,
   fvonly: false,
    video: true,
    timeline: true,
    keepVideo: true,
    sensitive: false,
  },
}

/**
 * Create WebPageTest API URL
 */
function createTestUrl() {
  const { server, test, apiKey } = WPT_CONFIG
  const params = new URLSearchParams({
    url: test.url,
    k: apiKey,
    location: test.location,
    browser: test.browser,
    connectivity: test.connectivity,
    runs: test.runs,
    fvonly: test.fvonly,
    video: test.video,
    timeline: test.timeline,
    keepVideo: test.keepVideo,
    sensitive: test.sensitive,
    f: 'json',
  })
  
  return `${server}/runtest.php?${params.toString()}`
}

/**
 * Get test result
 */
async function getTestResult(testId) {
  const { server, apiKey } = WPT_CONFIG
  const url = `${server}/jsonResult.php?test=${testId}&k=${apiKey}`
  
  const response = await fetch(url)
  const data = await response.json()
  
  return data
}

/**
 * Run WebPageTest
 */
async function runWebPageTest() {
  console.log('🚀 Starting WebPageTest...')
  console.log(`📍 Testing URL: ${WPT_CONFIG.test.url}`)
  console.log(`🌐 Server: ${WPT_CONFIG.server}`)
  console.log(`🖥️  Browser: ${WPT_CONFIG.test.browser}`)
  console.log(`📡  Connectivity: ${WPT_CONFIG.test.connectivity}`)
  console.log(`🔄  Runs: ${WPT_CONFIG.test.runs}`)
  console.log()

  // Create test
  const testUrl = createTestUrl()
  console.log('📝 Creating test...')
  
  try {
    const response = await fetch(testUrl)
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error)
    }
    
    const { data: { testId, userUrl, jsonUrl, summaryCsv } } = data
    
    console.log(`✅ Test created: ${testId}`)
    console.log(`📊 User URL: ${userUrl}`)
    console.log(`📄 JSON URL: ${jsonUrl}`)
    console.log(`📈 CSV URL: ${summaryCsv}`)
    console.log()
    
    // Poll for results
    console.log('⏳ Waiting for test to complete...')
    let status = 'pending'
    let attempts = 0
    const maxAttempts = 120 // 2 minutes
    
    while (status !== 'complete' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const result = await getTestResult(testId)
      status = result.data.statusCode
      
      if (attempts % 10 === 0) {
        console.log(`   Status: ${status} (${attempts}s)`)
      }
      
      attempts++
    }
    
    if (status !== 'complete') {
      throw new Error('Test did not complete in time')
    }
    
    console.log('✅ Test completed!')
    console.log()
    
    // Get final results
    const finalResult = await getTestResult(testId)
    const { data: { median, runs, average } } = finalResult
    
    // Print summary
    console.log('📊 Performance Summary:')
    console.log('═'.repeat(60))
    
    const metrics = {
      'Load Time': `${Math.round(median.TTFB)}ms`,
      'Start Render': `${Math.round(median.render)}ms`,
      'Speed Index': Math.round(median.SpeedIndex),
      'Time to Interactive': `${Math.round(median.TTI)}ms`,
      'First Contentful Paint': `${Math.round(median.firstContentfulPaint)}ms`,
      'Largest Contentful Paint': `${Math.round(median.largestContentfulPaint)}ms`,
      'Cumulative Layout Shift': median.CumulativeLayoutShift?.toFixed(3) || 'N/A',
      'Total Blocking Time': `${Math.round(median.TotalBlockingTime)}ms`,
      'Bytes In': `${(median.bytesIn / 1024).toFixed(2)}KB`,
      'Bytes In Doc': `${(median.bytesInDoc / 1024).toFixed(2)}KB`,
      'Requests': median.requests,
      'Requests Doc': median.requestsDoc,
    }
    
    Object.entries(metrics).forEach(([name, value]) => {
      console.log(`${name}: ${value}`)
    })
    
    console.log()
    
    // Print runs comparison
    console.log('📊 Runs Comparison:')
    console.log('─'.repeat(60))
    console.log('Run'.padEnd(8), 'TTFB', 'FCP', 'LCP', 'TTI', 'Speed Index')
    console.log('─'.repeat(60))
    
    runs.forEach((run, index) => {
      console.log(
        `#${index + 1}`.padEnd(8),
        `${Math.round(run.TTFB)}ms`.padStart(8),
        `${Math.round(run.firstContentfulPaint)}ms`.padStart(8),
        `${Math.round(run.largestContentfulPaint)}ms`.padStart(8),
        `${Math.round(run.TTI)}ms`.padStart(8),
        Math.round(run.SpeedIndex).toString().padStart(12)
      )
    })
    
    // Save results
    const reportsDir = path.join(__dirname, '..', 'reports')
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true })
    }
    
    const resultPath = path.join(reportsDir, `webpagetest-result-${Date.now()}.json`)
    fs.writeFileSync(resultPath, JSON.stringify(finalResult, null, 2))
    console.log(`\n✅ Results saved to: ${resultPath}`)
    
    console.log('\n✅ WebPageTest completed!')
    console.log(`📊 View results: ${userUrl}`)
    console.log('─'.repeat(60))
  } catch (error) {
    console.error('\n❌ Error running WebPageTest:', error.message)
    process.exit(1)
  }
}

// Main execution
async function main() {
  try {
    await runWebPageTest()
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { runWebPageTest }
