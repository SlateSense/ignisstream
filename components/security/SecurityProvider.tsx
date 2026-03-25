"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SecurityContextType {
  csrfToken: string | null;
  generateCSRFToken: () => Promise<string>;
  validateSession: () => Promise<boolean>;
  reportSecurityIssue: (issue: SecurityIssue) => Promise<void>;
  isSecureConnection: boolean;
}

interface SecurityIssue {
  type: 'xss_attempt' | 'csrf_attempt' | 'suspicious_activity' | 'data_breach';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isSecureConnection, setIsSecureConnection] = useState(false);
  const { user } = useAuth();

  // Check if connection is secure
  useEffect(() => {
    setIsSecureConnection(
      typeof window !== 'undefined' && 
      (window.location.protocol === 'https:' || window.location.hostname === 'localhost')
    );
  }, []);

  // Generate CSRF token
  const generateCSRFToken = useCallback(async (): Promise<string> => {
    try {
      const response = await fetch('/api/security/csrf-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate CSRF token');
      }

      const data = await response.json();
      setCsrfToken(data.token);
      return data.token;
    } catch (error) {
      console.error('CSRF token generation failed:', error);
      throw error;
    }
  }, []);

  // Validate current session
  const validateSession = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await fetch('/api/security/validate-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }, [user, csrfToken]);

  // Report security issues
  const reportSecurityIssue = useCallback(async (issue: SecurityIssue): Promise<void> => {
    try {
      await fetch('/api/security/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify({
          ...issue,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });
    } catch (error) {
      console.error('Failed to report security issue:', error);
    }
  }, [csrfToken]);

  // Generate initial CSRF token
  useEffect(() => {
    if (user && !csrfToken) {
      generateCSRFToken().catch(console.error);
    }
  }, [user, csrfToken, generateCSRFToken]);

  // Set up security monitoring
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Monitor for potential XSS attempts
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('script') || message.includes('eval') || message.includes('innerHTML')) {
        reportSecurityIssue({
          type: 'xss_attempt',
          description: `Potential XSS attempt detected: ${message}`,
          severity: 'high',
          metadata: { consoleArgs: args }
        });
      }
      originalConsoleError.apply(console, args);
    };

    // Monitor for suspicious DOM manipulations
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              // Check for suspicious script injections
              if (element.tagName === 'SCRIPT' && !element.hasAttribute('data-allowed')) {
                reportSecurityIssue({
                  type: 'xss_attempt',
                  description: 'Unauthorized script element detected',
                  severity: 'critical',
                  metadata: { 
                    tagName: element.tagName, 
                    innerHTML: element.innerHTML.substring(0, 100) 
                  }
                });

                // Remove the suspicious script
                element.remove();
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Monitor for suspicious network requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [resource, init] = args;
      const url = typeof resource === 'string' ? resource : resource.url;
      
      // Check for suspicious external requests
      if (url.startsWith('http') && !url.includes(window.location.hostname)) {
        // Log external API calls for monitoring
        console.info('External API call:', url);
      }

      return originalFetch.apply(window, args);
    };

    // Check for mixed content warnings
    if (window.location.protocol === 'https:') {
      const checkMixedContent = () => {
        const insecureElements = document.querySelectorAll('[src^="http:"], [href^="http:"]');
        if (insecureElements.length > 0) {
          reportSecurityIssue({
            type: 'suspicious_activity',
            description: 'Mixed content detected (HTTP resources on HTTPS page)',
            severity: 'medium',
            metadata: { count: insecureElements.length }
          });
        }
      };

      // Check periodically
      const mixedContentInterval = setInterval(checkMixedContent, 30000);

      return () => {
        observer.disconnect();
        console.error = originalConsoleError;
        window.fetch = originalFetch;
        clearInterval(mixedContentInterval);
      };
    }

    return () => {
      observer.disconnect();
      console.error = originalConsoleError;
      window.fetch = originalFetch;
    };
  }, [reportSecurityIssue]);

  const value = {
    csrfToken,
    generateCSRFToken,
    validateSession,
    reportSecurityIssue,
    isSecureConnection,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}

// Higher-order component for protecting sensitive components
export function withSecurityCheck<P extends object>(
  Component: React.ComponentType<P>,
  requiredSecurityLevel: 'basic' | 'authenticated' | 'verified' = 'basic'
) {
  return function ProtectedComponent(props: P) {
    const { user } = useAuth();
    const { isSecureConnection, validateSession } = useSecurity();
    const [isValidated, setIsValidated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const validate = async () => {
        try {
          if (requiredSecurityLevel === 'basic') {
            setIsValidated(isSecureConnection);
          } else if (requiredSecurityLevel === 'authenticated') {
            setIsValidated(!!user && isSecureConnection);
          } else if (requiredSecurityLevel === 'verified') {
            const sessionValid = await validateSession();
            setIsValidated(!!user && isSecureConnection && sessionValid);
          }
        } catch (error) {
          console.error('Security validation failed:', error);
          setIsValidated(false);
        } finally {
          setIsLoading(false);
        }
      };

      validate();
    }, [user, isSecureConnection, validateSession]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      );
    }

    if (!isValidated) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="text-red-500 text-2xl mb-4">🔒</div>
          <h3 className="text-lg font-semibold mb-2">Security Check Failed</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {!isSecureConnection && 'Secure connection required.'}
            {!user && requiredSecurityLevel !== 'basic' && ' Authentication required.'}
          </p>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

// Hook for secure API requests
export function useSecureAPI() {
  const { csrfToken } = useSecurity();
  const { user } = useAuth();

  const secureRequest = useCallback(async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const headers = new Headers(options.headers);
    
    // Add CSRF token for state-changing operations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method?.toUpperCase() || 'GET')) {
      if (csrfToken) {
        headers.set('X-CSRF-Token', csrfToken);
      }
    }

    // Add Content-Type if not already set and body is JSON
    if (options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    return fetch(url, {
      ...options,
      headers,
      credentials: 'same-origin', // Include cookies for authentication
    });
  }, [csrfToken]);

  return { secureRequest, isAuthenticated: !!user };
}
