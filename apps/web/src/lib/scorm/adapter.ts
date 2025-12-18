import { SCORMVersion, SCORMAdapterConfig } from './types';

export class SCORMAPIAdapter {
  private attemptId: string | null = null;
  private cache: Map<string, string> = new Map();
  private lastError: string = '0';
  private initialized: boolean = false;
  private terminated: boolean = false;
  private config: SCORMAdapterConfig;
  private initPromise: Promise<void> | null = null;
  private initCompleted: boolean = false;
  private pendingSetValues: Array<{ key: string; value: string }> = [];

  constructor(config: SCORMAdapterConfig) {
    this.config = config;
  }

  // =====================
  // SCORM 1.2 API
  // =====================

  LMSInitialize(param: string): string {
    // If already initialized and not terminated, return error
    if (this.initialized && !this.terminated) {
      this.lastError = '101';
      return 'false';
    }

    // Allow re-initialization after termination (common in multi-page SCORM content)
    if (this.terminated) {
      this.resetState();
    }

    this.initPromise = this.initializeAsync();
    this.initialized = true;
    return 'true';
  }

  private resetState() {
    // Reset state for re-initialization
    // Keep the cache and attemptId to maintain progress across pages
    this.terminated = false;
    this.initCompleted = false;
    this.lastError = '0';
    this.pendingSetValues = [];
  }

  private async initializeAsync() {
    try {
      const res = await fetch('/api/scorm/runtime/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: this.config.packageId })
      });

      const data = await res.json();
      if (data.success) {
        this.attemptId = data.attemptId;
        Object.entries(data.cmiData).forEach(([key, value]) => {
          this.cache.set(key, value as string);
        });

        // Initialize default values for common SCORM 2004 elements
        this.initializeDefaults();

        this.initCompleted = true;

        // Process any pending setValue calls
        await this.processPendingSetValues();
      } else {
        this.config.onError?.('Failed to initialize: ' + data.error);
      }
    } catch (error) {
      this.config.onError?.('Failed to initialize');
    }
  }

  private initializeDefaults() {
    // Set default values for elements that might be queried
    const defaults: Record<string, string> = {
      'cmi.objectives._count': '0',
      'cmi.interactions._count': '0',
      'cmi.comments_from_learner._count': '0',
      'cmi.comments_from_lms._count': '0',
    };

    // Only set if not already in cache
    Object.entries(defaults).forEach(([key, value]) => {
      if (!this.cache.has(key)) {
        this.cache.set(key, value);
      }
    });
  }

  private async processPendingSetValues() {
    for (const { key, value } of this.pendingSetValues) {
      await this.setValueAsync(key, value);
    }
    this.pendingSetValues = [];
  }

  LMSGetValue(key: string): string {
    // Be permissive - auto-initialize if GetValue is called before Initialize
    if (!this.initialized) {
      this.LMSInitialize('');
    }

    const value = this.cache.get(key);
    if (value !== undefined) {
      this.lastError = '0';
      return value;
    }

    // Value not in cache - return sensible defaults without errors
    // This is more permissive to handle async initialization timing

    // Handle _count elements
    if (key.endsWith('._count')) {
      this.lastError = '0';
      return '0';
    }

    // Handle _children elements
    if (key.endsWith('._children')) {
      this.lastError = '0';
      return this.getChildrenForKey(key);
    }

    // Handle objectives (any objective key)
    // SCORM content may query objectives by ID (e.g., cmi.objectives.n.id where n is index)
    // We need to handle both indexed access and ID-based queries
    if (key.startsWith('cmi.objectives')) {
      // Check if it's a query for a specific objective by ID
      // Pattern: cmi.objectives.n.id or cmi.objectives.n.success_status, etc.
      const objectiveMatch = key.match(/^cmi\.objectives\.(\d+)\.(.+)$/);
      if (objectiveMatch) {
        const index = objectiveMatch[1];
        const field = objectiveMatch[2];
        
        // For ID field, return empty string (objectives are optional in SCORM)
        if (field === 'id') {
          this.lastError = '0';
          return '';
        }
        
        // For other fields, return appropriate defaults
        if (field === 'success_status') {
          this.lastError = '0';
          return 'unknown';
        }
        if (field === 'completion_status') {
          this.lastError = '0';
          return 'unknown';
        }
        if (field === 'score.raw') {
          this.lastError = '0';
          return '';
        }
        
        // Default: return empty string
        this.lastError = '0';
        return '';
      }
      
      // For other objective queries, return empty string
      this.lastError = '0';
      return '';
    }

    // Handle interactions
    if (key.startsWith('cmi.interactions')) {
      this.lastError = '0';
      return '';
    }

    // Handle comments
    if (key.startsWith('cmi.comments')) {
      this.lastError = '0';
      return '';
    }

    // Handle all other cmi.* keys - return empty string without error
    // This is permissive to handle timing issues during initialization
    if (key.startsWith('cmi.') || key.startsWith('adl.')) {
      this.lastError = '0';
      return '';
    }

    // For truly unknown keys, return empty string with error
    this.lastError = '201';
    return '';
  }

  private getChildrenForKey(key: string): string {
    const childrenMap: Record<string, string> = {
      // SCORM 1.2
      'cmi.core._children': 'student_id,student_name,lesson_location,credit,lesson_status,entry,score,total_time,lesson_mode,exit,session_time',
      'cmi.core.score._children': 'raw,min,max',
      'cmi.interactions._children': 'id,objectives,time,type,correct_responses,weighting,student_response,result,latency',
      // SCORM 2004
      'cmi._children': 'comments_from_learner,comments_from_lms,completion_status,completion_threshold,credit,entry,exit,interactions,launch_data,learner_id,learner_name,learner_preference,location,max_time_allowed,mode,objectives,progress_measure,scaled_passing_score,score,session_time,success_status,suspend_data,time_limit_action,total_time',
      'cmi.score._children': 'scaled,raw,min,max',
      'cmi.objectives._children': 'id,score,success_status,completion_status,description,progress_measure',
      'cmi.learner_preference._children': 'audio_level,language,delivery_speed,audio_captioning',
    };
    return childrenMap[key] || '';
  }

  LMSSetValue(key: string, value: string): string {
    // Be permissive with initialization state - auto-initialize if needed
    if (!this.initialized) {
      // Auto-initialize if SetValue is called before Initialize
      // This handles poorly-behaved SCORM content
      this.LMSInitialize('');
    }

    // If terminated, just return success but queue the value
    // The next Initialize will process it
    // This is more permissive than the strict SCORM spec
    if (this.terminated) {
      // Still cache locally even if terminated
      this.cache.set(key, value);
      this.lastError = '0';
      return 'true';
    }

    const readOnly = [
      // SCORM 1.2 read-only
      'cmi.core._children', 'cmi.core.student_id', 'cmi.core.student_name',
      'cmi.core.total_time', 'cmi.core.entry', 'cmi.core.lesson_mode',
      'cmi._version', 'cmi.interactions._children',
      // SCORM 2004 read-only
      'cmi._children', 'cmi.learner_id', 'cmi.learner_name', 'cmi.mode',
      'cmi.entry', 'cmi.total_time', 'cmi.credit', 'cmi.launch_data',
      'cmi.completion_threshold', 'cmi.scaled_passing_score',
      'cmi.max_time_allowed', 'cmi.time_limit_action',
    ];

    if (readOnly.includes(key)) {
      this.lastError = '403';
      return 'false';
    }

    // Update _count when adding new objectives or interactions
    this.updateCollectionCount(key);

    this.cache.set(key, value);

    // Queue the setValue if initialization hasn't completed yet
    if (!this.initCompleted) {
      this.pendingSetValues.push({ key, value });
    } else {
      this.setValueAsync(key, value);
    }

    // Detectar completado
    if (key === 'cmi.core.lesson_status' || key === 'cmi.completion_status') {
      if (value === 'completed' || value === 'passed' || value === 'failed') {
        const scoreKey = this.config.version === 'SCORM_2004'
          ? 'cmi.score.raw'
          : 'cmi.core.score.raw';
        const score = parseFloat(this.cache.get(scoreKey) || '');
        this.config.onComplete?.(value, isNaN(score) ? undefined : score);
      }
    }

    this.lastError = '0';
    return 'true';
  }

  private updateCollectionCount(key: string) {
    // Update objectives count
    const objectiveMatch = key.match(/^cmi\.objectives\.(\d+)\./);
    if (objectiveMatch) {
      const index = parseInt(objectiveMatch[1], 10);
      const currentCount = parseInt(this.cache.get('cmi.objectives._count') || '0', 10);
      if (index >= currentCount) {
        this.cache.set('cmi.objectives._count', String(index + 1));
      }
    }

    // Update interactions count
    const interactionMatch = key.match(/^cmi\.interactions\.(\d+)\./);
    if (interactionMatch) {
      const index = parseInt(interactionMatch[1], 10);
      const currentCount = parseInt(this.cache.get('cmi.interactions._count') || '0', 10);
      if (index >= currentCount) {
        this.cache.set('cmi.interactions._count', String(index + 1));
      }
    }
  }

  private async setValueAsync(key: string, value: string) {
    if (!this.attemptId) {
      await this.initPromise;
    }
    if (!this.attemptId) return;

    try {
      await fetch('/api/scorm/runtime/setValue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: this.attemptId,
          key,
          value
        })
      });
    } catch (error) {
      // Silent fail - datos en cache local
    }
  }

  LMSCommit(param: string): string {
    if (!this.initialized || this.terminated) {
      this.lastError = '301';
      return 'false';
    }

    this.commitAsync();
    this.lastError = '0';
    return 'true';
  }

  private async commitAsync() {
    if (!this.attemptId) {
      await this.initPromise;
    }
    if (!this.attemptId) return;

    try {
      await fetch('/api/scorm/runtime/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId: this.attemptId })
      });
    } catch (error) {
      // Silent fail
    }
  }

  LMSFinish(param: string): string {
    if (!this.initialized) {
      this.lastError = '301';
      return 'false';
    }

    // If already terminated, just return true to avoid errors
    // Some SCORM content calls Terminate multiple times
    if (this.terminated) {
      this.lastError = '0';
      return 'true';
    }

    this.terminated = true;
    this.terminateAsync();
    this.lastError = '0';
    return 'true';
  }

  private async terminateAsync() {
    // Wait for initialization if still pending
    if (!this.initCompleted && this.initPromise) {
      await this.initPromise;
    }

    // Process any remaining pending setValues
    await this.processPendingSetValues();

    // Commit changes
    await this.commitAsync();

    // Only call terminate endpoint if we have an attemptId
    if (!this.attemptId) return;

    try {
      await fetch('/api/scorm/runtime/terminate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId: this.attemptId })
      });
    } catch (error) {
      // Silent fail - don't show alerts during page unload
    }
  }

  LMSGetLastError(): string {
    return this.lastError;
  }

  LMSGetErrorString(errorCode: string): string {
    const errors: Record<string, string> = {
      '0': 'No error',
      '101': 'General exception',
      '201': 'Invalid argument error',
      '202': 'Element cannot have children',
      '203': 'Element not an array - cannot have count',
      '301': 'Not initialized',
      '401': 'Not implemented error',
      '402': 'Invalid set value, element is a keyword',
      '403': 'Element is read only',
      '404': 'Element is write only',
      '405': 'Incorrect data type'
    };
    return errors[errorCode] || 'Unknown error';
  }

  LMSGetDiagnostic(errorCode: string): string {
    return this.LMSGetErrorString(errorCode);
  }

  // =====================
  // SCORM 2004 API (alias)
  // =====================

  Initialize = (param: string) => this.LMSInitialize(param);
  GetValue = (key: string) => this.LMSGetValue(key);
  SetValue = (key: string, value: string) => this.LMSSetValue(key, value);
  Commit = (param: string) => this.LMSCommit(param);
  Terminate = (param: string) => this.LMSFinish(param);
  GetLastError = () => this.LMSGetLastError();
  GetErrorString = (code: string) => this.LMSGetErrorString(code);
  GetDiagnostic = (code: string) => this.LMSGetDiagnostic(code);

  // Métodos de utilidad
  isInitialized(): boolean {
    return this.initialized;
  }

  isInitCompleted(): boolean {
    return this.initCompleted;
  }

  isTerminated(): boolean {
    return this.terminated;
  }

  getAttemptId(): string | null {
    return this.attemptId;
  }

  // Wait for initialization to complete
  async waitForInit(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }
}

// Inyectar en window
export function initializeSCORMAPI(config: SCORMAdapterConfig): SCORMAPIAdapter {
  const adapter = new SCORMAPIAdapter(config);

  if (config.version === 'SCORM_2004') {
    (window as any).API_1484_11 = adapter;
  } else {
    (window as any).API = adapter;
  }

  return adapter;
}

export function cleanupSCORMAPI() {
  delete (window as any).API;
  delete (window as any).API_1484_11;
}

// Función para que el SCO encuentre el API
export function findAPI(win: Window): any {
  let findAttempts = 0;
  const findAttemptLimit = 500;

  while (
    (win as any).API == null &&
    (win as any).API_1484_11 == null &&
    win.parent != null &&
    win.parent != win
  ) {
    findAttempts++;
    if (findAttempts > findAttemptLimit) {
      return null;
    }
    win = win.parent;
  }

  return (win as any).API_1484_11 || (win as any).API;
}
