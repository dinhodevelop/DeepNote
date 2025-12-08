// Error monitoring and logging system for DeepNote
class ErrorMonitor {
  constructor() {
    this.errors = [];
    this.maxErrors = 100; // Keep last 100 errors
    this.setupGlobalErrorHandlers();
  }

  setupGlobalErrorHandlers() {
    // Catch unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError('JavaScript Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('Unhandled Promise Rejection', {
        reason: event.reason,
        stack: event.reason?.stack
      });
    });

    // Override console.error to capture errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.logError('Console Error', { args: args.map(arg => String(arg)) });
      originalConsoleError.apply(console, args);
    };
  }

  logError(type, details) {
    const error = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      timestamp: new Date().toISOString(),
      type,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.errors.push(error);

    // Keep only the last maxErrors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Store in localStorage for persistence
    try {
      localStorage.setItem('deepnote-errors', JSON.stringify(this.errors.slice(-10))); // Keep last 10 in storage
    } catch (e) {
      // Ignore storage errors
    }

    // Show user-friendly notification for critical errors
    if (this.isCriticalError(type, details)) {
      this.showErrorNotification();
    }
  }

  isCriticalError(type, details) {
    // Define what constitutes a critical error
    const criticalPatterns = [
      'StorageAPI not available',
      'Error saving note',
      'Error loading note',
      'Error reading data',
      'Error writing data'
    ];

    const errorText = JSON.stringify(details).toLowerCase();
    return criticalPatterns.some(pattern => errorText.includes(pattern.toLowerCase()));
  }

  showErrorNotification() {
    // Create a user-friendly error notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-6 bg-red-500 text-white px-4 py-3 rounded-md shadow-lg z-50 max-w-sm';
    notification.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        <div>
          <div class="font-medium">Erro detectado</div>
          <div class="text-sm opacity-90">Algumas funcionalidades podem não estar funcionando corretamente.</div>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  getRecentErrors(count = 10) {
    return this.errors.slice(-count);
  }

  clearErrors() {
    this.errors = [];
    localStorage.removeItem('deepnote-errors');
  }

  // Method to check application health
  checkHealth() {
    const health = {
      storageAPI: !!window.storageAPI,
      taskManager: !!window.taskManager,
      documentEditor: !!window.documentEditor,
      recentErrors: this.getRecentErrors(5).length,
      timestamp: new Date().toISOString()
    };

    console.log('DeepNote Health Check:', health);
    return health;
  }
}

// Initialize error monitor
window.errorMonitor = new ErrorMonitor();

// Expose health check function globally
window.checkHealth = () => window.errorMonitor.checkHealth();
