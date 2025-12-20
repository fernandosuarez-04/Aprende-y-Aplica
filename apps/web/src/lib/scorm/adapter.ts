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
  // Map objective IDs to their indices for lookup
  private objectiveIdToIndex: Map<string, number> = new Map();
  // Track session start time for automatic time calculation
  private sessionStartTime: number = 0;
  // Callback para notificar cuando el usuario quiere salir
  private onExitCallback: (() => void) | null = null;
  // Track interactions by ID to preserve all of them even if SCORM content overwrites index 0
  private interactionsById: Map<string, Record<string, string>> = new Map();

  constructor(config: SCORMAdapterConfig) {
    this.config = config;

    // Pre-initialize objectives from config immediately (before async init)
    // This ensures objectives are available when SCORM content queries them
    console.log('[SCORM Adapter] Constructor - objectives from config:', config.objectives);

    if (config.objectives && config.objectives.length > 0) {
      // Set initial count
      this.cache.set('cmi.objectives._count', '0');

      config.objectives.forEach((objective) => {
        console.log('[SCORM Adapter] Pre-initializing objective:', objective.id);
        this.getOrCreateObjectiveByID(objective.id);
        if (objective.description) {
          const index = this.findObjectiveByID(objective.id);
          if (index >= 0) {
            this.cache.set(`cmi.objectives.${index}.description`, objective.description);
          }
        }
      });

      console.log('[SCORM Adapter] After init - objectives count:', this.cache.get('cmi.objectives._count'));
      console.log('[SCORM Adapter] Objective IDs map:', Array.from(this.objectiveIdToIndex.entries()));
    } else {
      console.warn('[SCORM Adapter] No objectives provided in config!');
    }
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

    // Track session start time for automatic time calculation
    this.sessionStartTime = Date.now();

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

        // Initialize objectives from server response (from imsmanifest.xml)
        if (data.objectives && Array.isArray(data.objectives)) {
          data.objectives.forEach((obj: { id: string; description?: string }) => {
            this.getOrCreateObjectiveByID(obj.id);
            if (obj.description) {
              const index = this.findObjectiveByID(obj.id);
              if (index >= 0) {
                this.cache.set(`cmi.objectives.${index}.description`, obj.description);
              }
            }
          });
        }

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

    // Initialize pre-defined objectives from config
    if (this.config.objectives && this.config.objectives.length > 0) {
      this.config.objectives.forEach((objective) => {
        this.getOrCreateObjectiveByID(objective.id);
        // Set description if provided
        if (objective.description) {
          const index = this.findObjectiveByID(objective.id);
          if (index >= 0) {
            this.cache.set(`cmi.objectives.${index}.description`, objective.description);
          }
        }
      });
    }
    
    // Pre-create common objectives that SCORM content often expects
    // This prevents "could not find objective" errors from SCORM content
    const commonObjectiveIds = ['obj_playing', 'obj_etiquette', 'obj_handicapping', 'obj_havingfun', 'PRIMARYOBJ'];
    commonObjectiveIds.forEach((objId) => {
      // Only create if not already created from config or manifest
      if (this.findObjectiveByID(objId) === -1) {
        this.getOrCreateObjectiveByID(objId);
        console.log(`[SCORM Adapter] Pre-created common objective: ${objId}`);
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
    // Log important GetValue calls
    if (key.includes('status') || key.includes('score') || key === 'cmi.exit' || key === 'cmi.core.exit') {
      console.log(`[SCORM Adapter] GetValue called: ${key}`);
    }

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
      // Check if it's a query for a specific objective by index
      // Pattern: cmi.objectives.n.id or cmi.objectives.n.success_status, etc.
      const objectiveMatch = key.match(/^cmi\.objectives\.(\d+)\.(.+)$/);
      if (objectiveMatch) {
        const index = parseInt(objectiveMatch[1], 10);
        const field = objectiveMatch[2];
        
        // Check if this objective index exists
        const count = parseInt(this.cache.get('cmi.objectives._count') || '0', 10);
        
        // If the index is out of bounds but we're querying the 'id' field,
        // this might be SCORM content trying to find an objective by iterating through indices
        // In this case, return empty string (objective doesn't exist at this index)
        if (index >= count) {
          this.lastError = '0';
          return '';
        }
        
        // Get the value from cache if it exists
        const cachedValue = this.cache.get(key);
        if (cachedValue !== undefined) {
          this.lastError = '0';
          return cachedValue;
        }
        
        // Return appropriate defaults for fields that don't exist yet
        if (field === 'id') {
          const id = this.cache.get(`cmi.objectives.${index}.id`);
          this.lastError = '0';
          return id || '';
        }
        
        if (field === 'success_status') {
          this.lastError = '0';
          return this.cache.get(`cmi.objectives.${index}.success_status`) || 'unknown';
        }
        
        if (field === 'completion_status') {
          this.lastError = '0';
          return this.cache.get(`cmi.objectives.${index}.completion_status`) || 'unknown';
        }
        
        if (field === 'score.raw') {
          this.lastError = '0';
          return this.cache.get(`cmi.objectives.${index}.score.raw`) || '';
        }
        
        if (field === 'description') {
          this.lastError = '0';
          return this.cache.get(`cmi.objectives.${index}.description`) || '';
        }
        
        // For any other field, return empty string
        this.lastError = '0';
        return '';
      }
      
      // For other objective queries (like cmi.objectives._count, cmi.objectives._children), 
      // check cache first, then return defaults
      const cachedValue = this.cache.get(key);
      if (cachedValue !== undefined) {
        this.lastError = '0';
        return cachedValue;
      }
      
      // Return empty string for unknown objective queries (don't error)
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
    // Log ALL SetValue calls for debugging
    console.log(`[SCORM Adapter] SetValue called: ${key} = ${value}`);

    // Special handling for interactions - track by ID instead of index
    // This handles the case where SCORM content always uses index 0
    if (key.startsWith('cmi.interactions.')) {
      const match = key.match(/^cmi\.interactions\.(\d+)\.(.+)$/);
      if (match) {
        const field = match[2];

        // Get current interaction ID or use the one being set
        let interactionId = '';
        if (field === 'id') {
          interactionId = value;
        } else {
          // Get the current ID for this index
          interactionId = this.cache.get('cmi.interactions.0.id') || `temp_${Date.now()}`;
        }

        // Store in our map keyed by interaction ID
        if (interactionId) {
          if (!this.interactionsById.has(interactionId)) {
            this.interactionsById.set(interactionId, {});
          }
          this.interactionsById.get(interactionId)![field] = value;

          // Also store with the correct index based on the number of unique interactions
          const interactionIndex = Array.from(this.interactionsById.keys()).indexOf(interactionId);
          if (interactionIndex === -1) {
            // New interaction
            const newIndex = this.interactionsById.size - 1;
            this.cache.set(`cmi.interactions.${newIndex}.${field}`, value);
          } else {
            this.cache.set(`cmi.interactions.${interactionIndex}.${field}`, value);
          }

          // Update the count
          this.cache.set('cmi.interactions._count', String(this.interactionsById.size));
        }
      }
    }

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

    // Special handling: If setting an objective ID, ensure the objective exists
    // This handles cases where SCORM content creates objectives on-the-fly
    const objectiveIdMatch = key.match(/^cmi\.objectives\.(\d+)\.id$/);
    if (objectiveIdMatch && value) {
      const index = parseInt(objectiveIdMatch[1], 10);
      const objectiveId = value;
      
      // Create or update the objective if it doesn't exist
      const existingIndex = this.findObjectiveByID(objectiveId);
      if (existingIndex === -1) {
        // Objective doesn't exist, create it at the requested index
        const count = parseInt(this.cache.get('cmi.objectives._count') || '0', 10);
        if (index >= count) {
          // Expand the objectives array to include this index
          this.cache.set('cmi.objectives._count', String(index + 1));
        }
        // Initialize the objective with default values
        this.cache.set(`cmi.objectives.${index}.id`, objectiveId);
        this.cache.set(`cmi.objectives.${index}.success_status`, 'unknown');
        this.cache.set(`cmi.objectives.${index}.completion_status`, 'unknown');
        this.cache.set(`cmi.objectives.${index}.score.raw`, '');
        this.cache.set(`cmi.objectives.${index}.score.min`, '');
        this.cache.set(`cmi.objectives.${index}.score.max`, '');
        this.cache.set(`cmi.objectives.${index}.score.scaled`, '');
        this.cache.set(`cmi.objectives.${index}.description`, '');
        this.cache.set(`cmi.objectives.${index}.progress_measure`, '');
        // Update the mapping
        this.objectiveIdToIndex.set(objectiveId, index);
        console.log(`[SCORM Adapter] Auto-created objective "${objectiveId}" at index ${index}`);
      } else if (existingIndex !== index) {
        // Objective exists at a different index, update the mapping
        this.objectiveIdToIndex.set(objectiveId, index);
      }
    }

    // Update _count when adding new objectives or interactions
    this.updateCollectionCount(key, value);

    this.cache.set(key, value);

    // NOTE: We no longer send individual setValue calls to the server
    // All data is sent via commitSync when LMSFinish/Terminate is called
    // This prevents rate limiting issues with SCORM content that makes many rapid calls

    // Detectar completado - múltiples condiciones según el estándar SCORM
    //
    // SCORM 2004 tiene dos elementos separados:
    // - cmi.completion_status: completed/incomplete (si vio el contenido)
    // - cmi.success_status: passed/failed/unknown (si pasó la evaluación)
    //
    // Algunos paquetes usan success_status, otros solo completion_status con score

    if (this.config.version === 'SCORM_2004') {
      // Caso 1: success_status cambia a passed/failed
      if (key === 'cmi.success_status' && (value === 'passed' || value === 'failed')) {
        const score = parseFloat(this.cache.get('cmi.score.raw') || '');
        console.log('[SCORM Adapter] SCORM 2004 success_status:', value, 'score:', score);
        this.config.onComplete?.(value, isNaN(score) ? undefined : score);
      }

      // Caso 2: Se establece un score.raw - verificar si hay completion
      if (key === 'cmi.score.raw' && value) {
        const scoreValue = parseFloat(value);
        const completionStatus = this.cache.get('cmi.completion_status');
        const successStatus = this.cache.get('cmi.success_status');

        // Si hay score y completion_status es 'completed', pero no hay success_status
        // Esto indica que el quiz fue enviado
        if (!isNaN(scoreValue) && completionStatus === 'completed' &&
            (!successStatus || successStatus === 'unknown')) {
          console.log('[SCORM Adapter] SCORM 2004 score with completion:', scoreValue);
          // Determinar passed/failed basado en score
          const scoreMax = parseFloat(this.cache.get('cmi.score.max') || '100');
          const scaledPassingScore = parseFloat(this.cache.get('cmi.scaled_passing_score') || '0.8');
          const passThreshold = scoreMax * scaledPassingScore;
          const status = scoreValue >= passThreshold ? 'passed' : 'failed';
          this.config.onComplete?.(status, scoreValue);
        }
      }
    } else {
      // SCORM 1.2: lesson_status puede ser passed, completed, failed, incomplete, etc.
      if (key === 'cmi.core.lesson_status') {
        if (value === 'passed' || value === 'failed') {
          const score = parseFloat(this.cache.get('cmi.core.score.raw') || '');
          console.log('[SCORM Adapter] SCORM 1.2 course completed:', value, 'score:', score);
          this.config.onComplete?.(value, isNaN(score) ? undefined : score);
        } else if (value === 'completed') {
          // Para SCORM 1.2, 'completed' con score también indica finalización
          const score = parseFloat(this.cache.get('cmi.core.score.raw') || '');
          if (!isNaN(score)) {
            console.log('[SCORM Adapter] SCORM 1.2 completed with score:', score);
            this.config.onComplete?.('completed', score);
          }
        }
      }
    }

    this.lastError = '0';
    return 'true';
  }

  private updateCollectionCount(key: string, value?: string) {
    // Update objectives count and track IDs
    const objectiveMatch = key.match(/^cmi\.objectives\.(\d+)\.(.+)$/);
    if (objectiveMatch) {
      const index = parseInt(objectiveMatch[1], 10);
      const field = objectiveMatch[2];
      const currentCount = parseInt(this.cache.get('cmi.objectives._count') || '0', 10);
      if (index >= currentCount) {
        this.cache.set('cmi.objectives._count', String(index + 1));
      }
      // Track objective ID to index mapping
      if (field === 'id' && value) {
        this.objectiveIdToIndex.set(value, index);
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

  // Find objective index by ID
  findObjectiveByID(objectiveId: string): number {
    // First check the cached mapping
    if (this.objectiveIdToIndex.has(objectiveId)) {
      return this.objectiveIdToIndex.get(objectiveId)!;
    }

    // Scan through objectives to find by ID
    const count = parseInt(this.cache.get('cmi.objectives._count') || '0', 10);
    for (let i = 0; i < count; i++) {
      const id = this.cache.get(`cmi.objectives.${i}.id`);
      if (id === objectiveId) {
        this.objectiveIdToIndex.set(objectiveId, i);
        return i;
      }
    }

    return -1; // Not found
  }

  // Get or create objective by ID (for SCORM content that expects objectives to exist)
  getOrCreateObjectiveByID(objectiveId: string): number {
    let index = this.findObjectiveByID(objectiveId);
    if (index === -1) {
      // Create new objective
      index = parseInt(this.cache.get('cmi.objectives._count') || '0', 10);
      this.cache.set(`cmi.objectives.${index}.id`, objectiveId);
      this.cache.set('cmi.objectives._count', String(index + 1));
      this.objectiveIdToIndex.set(objectiveId, index);

      // Initialize default values for the new objective
      this.cache.set(`cmi.objectives.${index}.success_status`, 'unknown');
      this.cache.set(`cmi.objectives.${index}.completion_status`, 'unknown');
      this.cache.set(`cmi.objectives.${index}.score.raw`, '');
      this.cache.set(`cmi.objectives.${index}.score.min`, '');
      this.cache.set(`cmi.objectives.${index}.score.max`, '');
      this.cache.set(`cmi.objectives.${index}.score.scaled`, '');
      this.cache.set(`cmi.objectives.${index}.description`, '');
      this.cache.set(`cmi.objectives.${index}.progress_measure`, '');
    }
    return index;
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
    console.log('[SCORM Adapter] LMSCommit called');

    if (!this.initialized || this.terminated) {
      console.log('[SCORM Adapter] LMSCommit rejected - initialized:', this.initialized, 'terminated:', this.terminated);
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
    console.log('[SCORM Adapter] LMSFinish/Terminate called - initialized:', this.initialized, 'terminated:', this.terminated);

    if (!this.initialized) {
      console.log('[SCORM Adapter] LMSFinish rejected - not initialized');
      this.lastError = '301';
      return 'false';
    }

    // If already terminated, just return true to avoid errors
    // Some SCORM content calls Terminate multiple times
    if (this.terminated) {
      console.log('[SCORM Adapter] LMSFinish - already terminated, returning true');
      this.lastError = '0';
      return 'true';
    }

    console.log('[SCORM Adapter] LMSFinish - FIRST TIME, proceeding with termination');
    console.log('[SCORM Adapter] Current cache size:', this.cache.size);
    console.log('[SCORM Adapter] Score in cache:', this.cache.get('cmi.score.raw'));
    console.log('[SCORM Adapter] Interactions count:', this.interactionsById.size);

    // Detectar si el contenido SCORM quiere salir (cmi.exit = 'logout' o 'normal')
    const exitValue = this.cache.get('cmi.exit') || this.cache.get('cmi.core.exit') || '';
    console.log('[SCORM Adapter] Exit value:', exitValue);

    this.terminated = true;

    // Get current completion/success status and score before terminating
    let completionStatus: string;
    let scoreKey: string;

    if (this.config.version === 'SCORM_2004') {
      // For SCORM 2004, success_status (passed/failed) is the assessment result
      // completion_status just means content was viewed
      const successStatus = this.cache.get('cmi.success_status') || '';
      const compStatus = this.cache.get('cmi.completion_status') || '';

      // Prioritize success_status for assessment result
      if (successStatus === 'passed' || successStatus === 'failed') {
        completionStatus = successStatus;
      } else {
        completionStatus = compStatus || 'unknown';
      }
      scoreKey = 'cmi.score.raw';
    } else {
      // SCORM 1.2
      completionStatus = this.cache.get('cmi.core.lesson_status') || 'unknown';
      scoreKey = 'cmi.core.score.raw';
    }

    const score = parseFloat(this.cache.get(scoreKey) || '');

    // Calculate and set session_time if not set by SCORM content OR if it's zero/empty
    const sessionTimeKey = this.config.version === 'SCORM_2004' ? 'cmi.session_time' : 'cmi.core.session_time';
    const existingSessionTime = this.cache.get(sessionTimeKey);

    // Force auto-calculation if session time is missing, empty, or zero
    const needsAutoCalculation = !existingSessionTime ||
      existingSessionTime === '' ||
      existingSessionTime === 'PT0S' ||
      existingSessionTime === 'PT0H0M0S' ||
      existingSessionTime === '0000:00:00.00' ||
      existingSessionTime === '0:0:0';

    console.log('[SCORM Adapter] LMSFinish - existingSessionTime:', existingSessionTime, 'sessionStartTime:', this.sessionStartTime, 'needsAutoCalculation:', needsAutoCalculation);

    if (needsAutoCalculation && this.sessionStartTime > 0) {
      const elapsedMs = Date.now() - this.sessionStartTime;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      const hours = Math.floor(elapsedSeconds / 3600);
      const minutes = Math.floor((elapsedSeconds % 3600) / 60);
      const seconds = elapsedSeconds % 60;

      let sessionTimeValue: string;
      if (this.config.version === 'SCORM_2004') {
        // ISO 8601 duration format: PT#H#M#S
        sessionTimeValue = `PT${hours}H${minutes}M${seconds}S`;
      } else {
        // SCORM 1.2 format: HHHH:MM:SS.ss
        sessionTimeValue = `${hours.toString().padStart(4, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.00`;
      }

      this.cache.set(sessionTimeKey, sessionTimeValue);
      // NOTE: No individual setValueAsync call - all data sent via commitSync
      console.log('[SCORM Adapter] Auto-calculated session time:', sessionTimeValue);
    }

    // IMPORTANT: If course is not completed, set exit to 'suspend' to enable resume
    // This ensures progress is saved for resumption even if the content doesn't set it
    const isCompleted = completionStatus === 'completed' ||
                       completionStatus === 'passed' ||
                       completionStatus === 'failed';

    if (!isCompleted) {
      // Set exit to suspend for resuming later
      const exitKey = this.config.version === 'SCORM_2004' ? 'cmi.exit' : 'cmi.core.exit';
      const currentExit = this.cache.get(exitKey);

      // Only set to suspend if not already set by the content
      if (!currentExit || currentExit === '' || currentExit === 'time-out' || currentExit === 'logout') {
        this.cache.set(exitKey, 'suspend');
        // NOTE: No individual setValueAsync call - all data sent via commitSync
        console.log('[SCORM Adapter] Auto-set exit to suspend for incomplete course');
      }
    }

    // ONLY trigger onComplete for ACTUAL pass/fail - NOT just 'completed'
    // 'completed' in SCORM 2004 just means content was viewed, not that assessment was done
    const hasAssessmentResult = completionStatus === 'passed' || completionStatus === 'failed';

    if (this.config.onComplete && hasAssessmentResult) {
      console.log('[SCORM Adapter] LMSFinish triggering onComplete:', completionStatus, 'score:', score);
      this.config.onComplete(completionStatus, isNaN(score) ? undefined : score);
    }

    this.terminateAsync();

    // Si el contenido SCORM quiere salir (logout/normal) O si completó el assessment, disparar el callback
    // Esto permite que el botón EXIT del contenido SCORM funcione correctamente
    const shouldExit = exitValue === 'logout' || exitValue === 'normal' || hasAssessmentResult;

    if (shouldExit && this.onExitCallback) {
      console.log('[SCORM Adapter] LMSFinish - will trigger exit callback. exitValue:', exitValue, 'hasAssessmentResult:', hasAssessmentResult);
      setTimeout(() => {
        console.log('[SCORM Adapter] Triggering exit callback now');
        this.onExitCallback?.();
      }, 150);
    }

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

    // Commit changes - use synchronous commit for reliability
    await this.commitSync();

    // Only call terminate endpoint if we have an attemptId
    if (!this.attemptId) return;

    // Use sendBeacon for reliable delivery during page unload
    const data = JSON.stringify({ attemptId: this.attemptId });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/scorm/runtime/terminate', new Blob([data], { type: 'application/json' }));
    } else {
      try {
        await fetch('/api/scorm/runtime/terminate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: data
        });
      } catch (error) {
        // Silent fail - don't show alerts during page unload
      }
    }
  }

  // Synchronous commit using sendBeacon for reliable delivery
  private async commitSync() {
    if (!this.attemptId) return;

    // Build the data to send
    const cacheData: Record<string, string> = {};
    for (const [key, value] of this.cache.entries()) {
      cacheData[key] = value;
    }

    const payload = JSON.stringify({
      attemptId: this.attemptId,
      cacheData
    });

    // Log key values and objective scores for debugging
    const keyValues: Record<string, string> = {};
    for (const key of ['cmi.completion_status', 'cmi.success_status', 'cmi.score.raw', 'cmi.score.max', 'cmi.session_time', 'cmi.exit', 'cmi.core.lesson_status', 'cmi.core.score.raw', 'cmi.core.session_time', 'cmi.core.exit']) {
      if (cacheData[key]) {
        keyValues[key] = cacheData[key];
      }
    }

    // Also log objective scores
    const objectiveScores: Record<string, string> = {};
    for (const [key, value] of Object.entries(cacheData)) {
      if (key.includes('objectives') && (key.includes('score') || key.includes('success_status'))) {
        objectiveScores[key] = value;
      }
    }

    console.log('[SCORM Adapter] Committing key values:', keyValues);
    console.log('[SCORM Adapter] Committing objective scores:', objectiveScores);
    console.log('[SCORM Adapter] Total cache entries:', Object.keys(cacheData).length);

    // Use sendBeacon for reliable delivery
    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon('/api/scorm/runtime/commit-sync',
        new Blob([payload], { type: 'application/json' }));
      console.log('[SCORM Adapter] sendBeacon result:', sent);
      if (!sent) {
        // Fallback to fetch if sendBeacon fails
        await this.commitAsync();
      }
    } else {
      await this.commitAsync();
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

  // Registrar callback de salida para cuando el contenido SCORM quiera cerrar
  setOnExitCallback(callback: () => void): void {
    this.onExitCallback = callback;
  }

  // Terminar y notificar salida (llamado cuando el contenido SCORM quiere salir)
  terminateAndExit(): void {
    console.log('[SCORM Adapter] terminateAndExit called, terminated:', this.terminated);
    if (!this.terminated) {
      this.LMSFinish('');
    }
    // SIEMPRE notificar al componente para navegar, incluso si ya está terminado
    // porque el usuario quiere salir explícitamente
    setTimeout(() => {
      console.log('[SCORM Adapter] Executing exit callback');
      if (this.onExitCallback) {
        this.onExitCallback();
      }
    }, 150);
  }
}

// Inyectar en window
export function initializeSCORMAPI(config: SCORMAdapterConfig): SCORMAPIAdapter {
  const adapter = new SCORMAPIAdapter(config);

  if (config.version === 'SCORM_2004') {
    (window as any).API_1484_11 = adapter;
    console.log('[SCORM Adapter] API_1484_11 injected into window');
  } else {
    (window as any).API = adapter;
    console.log('[SCORM Adapter] API injected into window');
  }

  // Also inject into parent frames for nested iframes
  try {
    if (window.parent && window.parent !== window) {
      if (config.version === 'SCORM_2004') {
        (window.parent as any).API_1484_11 = adapter;
        console.log('[SCORM Adapter] API_1484_11 also injected into parent window');
      } else {
        (window.parent as any).API = adapter;
        console.log('[SCORM Adapter] API also injected into parent window');
      }
    }
  } catch (e) {
    // Cross-origin parent, ignore
  }

  // Debug: Log when any API method is called
  console.log('[SCORM Adapter] Ready. API object:', config.version === 'SCORM_2004' ? 'API_1484_11' : 'API');

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
