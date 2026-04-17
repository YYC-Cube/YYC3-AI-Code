/**
 * @file performance-test.js
 * @description Performance testing script using Lighthouse
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 3.0.0
 */

const { lighthouse } = require('lighthouse')
const chromeLauncher = require('chrome-launcher')
const fs = require('fs')
const path = require('path')

// Configuration
const CONFIG = {
  url: 'http://localhost:3000', // Default local development server
  outputPath: path.join(__dirname, '..', 'reports', 'performance-report'),
  chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox'],
  lighthouseConfig: {
    extends: 'lighthouse:default',
    settings: {
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      formFactor: 'desktop',
      throttling: {
        rttMs: 40,
        throughputKbps: 10 * 1024,
        cpuSlowdownMultiplier: 4,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0,
      },
      screenEmulation: {
        mobile: false,
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        disabled: false,
      },
      emulatedUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
  },
}

/**
 * Run Lighthouse performance test
 */
async function runLighthouse() {
  console.log('🚀 Starting Lighthouse performance test...')
  console.log(`📍 Testing URL: ${CONFIG.url}`)

  const chrome = await chromeLauncher.launch({ chromeFlags: CONFIG.chromeFlags })
  
  const runnerResult = await lighthouse(CONFIG.url, {
    port: chrome.port,
    ...CONFIG.lighthouseConfig,
  })

  await chrome.kill()

  const reportHtml = runnerResult.report[0]
  const reportJson = runnerResult.report[1]

  // Save reports
  const reportsDir = path.join(__dirname, '..', 'reports')
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true })
  }

  // Save HTML report
  const htmlPath = path.join(reportsDir, `lighthouse-report-${Date.now()}.html`)
  fs.writeFileSync(htmlPath, reportHtml)
  console.log(`✅ HTML report saved to: ${htmlPath}`)

  // Save JSON report
  const jsonPath = path.join(reportsDir, `lighthouse-report-${Date.now()}.json`)
  fs.writeFileSync(jsonPath, reportJson)
  console.log(`✅ JSON report saved to: ${jsonPath}`)

  // Print summary
  const { categories, audits } = runnerResult.lhr
  
  console.log('\n📊 Performance Scores:')
  console.log('═'.repeat(50))
  
  const categoryScores = {
    Performance: categories.performance?.score * 100 || 0,
    Accessibility: categories.accessibility?.score * 100 || 0,
    'Best Practices': categories['best-practices']?.score * 100 || 0,
    SEO: categories.seo?.score * 100 || 0,
  }

  Object.entries(categoryScores).forEach(([name, score]) => {
    const emoji = score >= 90 ? '🟢' : score >= 50 ? '🟡' : '🔴'
    const bar = '█'.repeat(Math.round(score / 10))
    const emptyBar = '░'.repeat(10 - Math.round(score / 10))
    console.log(`${emoji} ${name}: ${Math.round(score)} ${bar}${emptyBar}`)
  })

  // Core Web Vitals
  console.log('\n📈 Core Web Vitals:')
  console.log('─'.repeat(50))
  
  const metrics = {
    'Largest Contentful Paint (LCP)': {
      value: audits['largest-contentful-paint']?.displayValue || 'N/A',
      score: audits['largest-contentful-paint']?.score || 0,
      target: '≤ 2.5s',
    },
    'First Input Delay (FID)': {
      value: audits['max-potential-fid']?.displayValue || 'N/A',
      score: audits['max-potential-fid']?.score || 0,
      target: '≤ 100ms',
    },
    'Cumulative Layout Shift (CLS)': {
      value: audits['cumulative-layout-shift']?.displayValue || 'N/A',
      score: audits['cumulative-layout-shift']?.score || 0,
      target: '≤ 0.1',
    },
    'First Contentful Paint (FCP)': {
      value: audits['first-contentful-paint']?.displayValue || 'N/A',
      score: audits['first-contentful-paint']?.score || 0,
      target: '≤ 1.8s',
    },
    'Time to First Byte (TTFB)': {
      value: audits['server-response-time']?.displayValue || 'N/A',
      score: audits['server-response-time']?.score || 0,
      target: '≤ 800ms',
    },
  }

  Object.entries(metrics).forEach(([name, metric]) => {
    const emoji = metric.score >= 0.9 ? '🟢' : metric.score >= 0.5 ? '🟡' : '🔴'
    console.log(`${emoji} ${name}:`)
    console.log(`   Value: ${metric.value}`)
    console.log(`   Score: ${Math.round(metric.score * 100)}%`)
    console.log(`   Target: ${metric.target}`)
  })

  // Opportunities
  console.log('\n💡 Opportunities for Improvement:')
  console.log('─'.repeat(50))
  const opportunities = Object.values(audits)
    .filter(audit => audit.score !== null && audit.score < 1)
    .slice(0, 5)
    .map(audit => ({
      title: audit.title,
      description: audit.description,
      score: Math.round((audit.score || 0) * 100),
    }))

  opportunities.forEach((opp, index) => {
    const emoji = opp.score >= 90 ? '🟢' : opp.score >= 50 ? '🟡' : '🔴'
    console.log(`${emoji} ${index + 1}. ${opp.title}`)
    console.log(`   Score: ${opp.score}%`)
    console.log(`   Description: ${opp.description}`)
  })

  // Recommendations
  console.log('\n✅ Summary:')
  const overallScore = Object.values(categoryScores).reduce((a, b) => a + b, 0) / 4
  const status = overallScore >= 90 ? 'Excellent' : overallScore >= 50 ? 'Good' : 'Needs Improvement'
  console.log(`Overall Score: ${Math.round(overallScore)}`)
  console.log(`Status: ${status}`)
  console.log(`Report: ${htmlPath}`)
  console.log('─'.repeat(50))
}

/**
 * Run performance test on multiple URLs
 */
async function runMultipleTests(urls) {
  console.log('🚀 Running Lighthouse tests on multiple URLs...')
  console.log(`📍 Total URLs: ${urls.length}`)
  console.log()

  const results = []
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]
    console.log(`\n📍 Testing ${i + 1}/${urls.length}: ${url}`)
    
    const chrome = await chromeLauncher.launch({ chromeFlags: CONFIG.chromeFlags })
    const runnerResult = await lighthouse(url, {
      port: chrome.port,
      ...CONFIG.lighthouseConfig,
    })
    await chrome.kill()
    
    results.push({
      url,
      score: runnerResult.lhr.categories.performance?.score * 100 || 0,
      lcp: runnerResult.lhr.audits['largest-contentful-paint']?.numericValue || 0,
      fid: runnerResult.lhr.audits['max-potential-fid']?.numericValue || 0,
      cls: runnerResult.lhr.audits['cumulative-layout-shift']?.numericValue || 0,
    })
  }

  // Print comparison
  console.log('\n📊 Comparison:')
  console.log('═'.repeat(70))
  console.log('URL'.padEnd(40), 'Score', 'LCP', 'FID', 'CLS')
  console.log('─'.repeat(70))
  
  results.forEach(result => {
    console.log(
      result.url.padEnd(40),
      Math.round(result.score).toString().padStart(6),
      `${Math.round(result.lcp)}ms`.padStart(8),
      `${Math.round(result.fid)}ms`.padStart(8),
      result.cls.toFixed(3).padStart(8)
    )
  })

  console.log('─'.repeat(70))

  // Save comparison report
  const reportsDir = path.join(__dirname, '..', 'reports')
  const comparisonPath = path.join(reportsDir, `lighthouse-comparison-${Date.now()}.json`)
  fs.writeFileSync(comparisonPath, JSON.stringify(results, null, 2))
  console.log(`✅ Comparison report saved to: ${comparisonPath}`)
}

// Main execution
async function main() {
  try {
    const args = process.argv.slice(2)
    const urls = args.length > 0 ? args : [CONFIG.url]
    
    if (urls.length === 1) {
      await runLighthouse()
    } else {
      await runMultipleTests(urls)
    }
    
    console.log('\n✅ Performance test completed!')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error running performance test:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { runLighthouse, runMultipleTests }
