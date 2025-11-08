/**
 * Core TypeScript types and interfaces for Linear Toolkit
 * Comprehensive type definitions for Linear API integration
 */

// ============================================================================
// User & Team Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  name: string;
  key: string;
  description?: string;
  private: boolean;
  members?: User[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Issue & Status Types
// ============================================================================

export type IssueStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';

export interface WorkflowState {
  id: string;
  name: string;
  color: string;
  position: number;
  type: 'backlog' | 'unstarted' | 'started' | 'completed' | 'cancelled';
}

export interface Issue {
  id: string;
  identifier: string; // e.g., "LIN-123"
  title: string;
  description?: string;
  state: WorkflowState;
  priority: number; // 0 = no priority, 1 = urgent, 2 = high, 3 = medium, 4 = low
  status?: IssueStatus;
  assignee?: User;
  team?: Team;
  cycle?: Cycle;
  parent?: Issue;
  children?: Issue[];
  labels?: Label[];
  attachments?: string[];
  estimate?: number; // story points
  dueDate?: Date;
  startDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;

  // Relations
  relations?: IssueRelation[];
  comments?: Comment[];
  subscribers?: User[];
}

export interface IssueRelation {
  id: string;
  fromIssueId: string;
  toIssueId: string;
  type: 'blocks' | 'is_blocked_by' | 'relates_to' | 'duplicates' | 'is_duplicated_by';
  createdAt: Date;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  description?: string;
  team?: Team;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  issueId: string;
  body: string;
  author: User;
  createdAt: Date;
  updatedAt: Date;
  archived: boolean;
}

// ============================================================================
// Sprint/Cycle Types
// ============================================================================

export interface Cycle {
  id: string;
  name: string;
  number: number;
  description?: string;
  team: Team;
  startsAt: Date;
  endsAt: Date;
  completedAt?: Date;
  issues?: Issue[];
  completionPercentage: number;
  completedIssueCount: number;
  issueCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Work Context Types
// ============================================================================

export interface WorkContext {
  activeIssues: Issue[];
  currentSprint?: Cycle;
  upcomingCycles?: Cycle[];
  blockedIssues: Issue[];
  upcomingDeadlines: Issue[];
  teamMembers: User[];
  userTeams: Team[];
  assignedToCurrentUser: Issue[];
}

export interface CodeContext {
  files: string[];
  functions?: string[];
  branch?: string;
  commit?: string;
  changes?: FileChange[];
  errors?: CodeError[];
}

export interface FileChange {
  path: string;
  status: 'added' | 'modified' | 'deleted';
  linesAdded: number;
  linesRemoved: number;
}

export interface CodeError {
  type: 'compilation' | 'runtime' | 'lint' | 'test';
  message: string;
  file: string;
  line?: number;
  column?: number;
}

export interface Progress {
  filesModified: string[];
  functionsChanged?: string[];
  testsAdded: boolean;
  testsPass: boolean;
  testsPassing?: number;
  testsFailing?: number;
  linesAdded: number;
  linesRemoved: number;
  readyForReview: boolean;
  reviewers?: string[];
}

// ============================================================================
// Code Analysis Types
// ============================================================================

export interface TodoItem {
  file: string;
  line: number;
  content: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface PotentialBug {
  file: string;
  line: number;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestion?: string;
}

export interface SecurityIssue {
  file: string;
  line: number;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cwe?: string;
  remediation?: string;
}

export interface RefactoringSuggestion {
  file: string;
  line?: number;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
}

export interface CodeAnalysis {
  todos: TodoItem[];
  bugs: PotentialBug[];
  security: SecurityIssue[];
  refactoring: RefactoringSuggestion[];
  summary: string;
}

// ============================================================================
// Create & Update Input Types
// ============================================================================

export interface CreateIssueInput {
  title: string;
  description?: string;
  teamId: string;
  priority?: number;
  assigneeId?: string;
  cycleId?: string;
  parentId?: string;
  labelIds?: string[];
  stateId?: string;
  estimate?: number;
  dueDate?: Date;
  startDate?: Date;
}

export interface UpdateIssueInput {
  title?: string;
  description?: string;
  priority?: number;
  assigneeId?: string;
  cycleId?: string;
  parentId?: string;
  labelIds?: string[];
  stateId?: string;
  estimate?: number;
  dueDate?: Date;
  startDate?: Date;
}

export interface IssueUpdate {
  issueId: string;
  update: UpdateIssueInput;
}

export interface Transition {
  issueId: string;
  stateId: string;
  comment?: string;
}

export interface AddCommentInput {
  issueId: string;
  body: string;
}

export interface UpdateProgressInput {
  issueId: string;
  progress: Progress;
  comment?: string;
}

// ============================================================================
// Operation Results & Responses
// ============================================================================

export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface UpdateResult {
  updated: number;
  failed: number;
  errors: OperationError[];
}

export interface OperationError {
  id: string;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface BatchOperationResult {
  total: number;
  successful: number;
  failed: number;
  results: OperationResult<unknown>[];
}

// ============================================================================
// Search & Query Types
// ============================================================================

export interface SearchQuery {
  query: string;
  teamId?: string;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
}

export interface SearchFilters {
  status?: IssueStatus[];
  priority?: number[];
  assigneeId?: string;
  labelIds?: string[];
  cycleId?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface SearchResult {
  issues: Issue[];
  total: number;
  hasMore: boolean;
}

// ============================================================================
// Session & State Management Types
// ============================================================================

export interface SessionConfig {
  apiKey: string;
  persistenceType?: 'memory' | 'disk' | 'redis';
  cacheTTL?: number;
  autoSync?: boolean;
  syncInterval?: number;
}

export interface SessionState {
  sessionId: string;
  userId?: string;
  teams?: Team[];
  context: Map<string, unknown>;
  lastActivity: Date;
  createdAt: Date;
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  expiresAt: Date;
  hits: number;
  createdAt: Date;
}

// ============================================================================
// Configuration & Environment Types
// ============================================================================

export interface ToolkitConfig {
  apiKey: string;
  endpoint?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  cache?: {
    enabled: boolean;
    ttl: number;
    maxSize?: number;
  };
  logging?: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format?: 'json' | 'text';
  };
  features?: {
    autoTransition?: boolean;
    autoAssign?: boolean;
    autoLabel?: boolean;
  };
}

// ============================================================================
// Module System Types
// ============================================================================

export interface ModuleConfig {
  name: string;
  version: string;
  dependencies?: string[];
  operations: string[];
  requiresAuth?: string;
  autoLoad?: boolean;
}

export interface Module {
  name: string;
  config: ModuleConfig;
  operations: Map<string, Operation>;

  initialize(): Promise<void>;
  execute(operationName: string, params: Record<string, unknown>): Promise<unknown>;
  dispose(): Promise<void>;
}

export interface Operation {
  name: string;
  description: string;
  params: Record<string, ParameterInfo>;
  returns: string;
  example?: string;
  execute(params: Record<string, unknown>): Promise<unknown>;
}

export interface ParameterInfo {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

// ============================================================================
// GraphQL Query Types
// ============================================================================

export interface GraphQLRequest {
  query: string;
  variables?: Record<string, unknown>;
}

export interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}

export interface GraphQLError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: string[];
  extensions?: Record<string, unknown>;
}

// ============================================================================
// Utility Types
// ============================================================================

export type Pagination = {
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type SortOrder = 'asc' | 'desc';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  pagination: Pagination;
}

// ============================================================================
// Error Types
// ============================================================================

export class LinearError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode?: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'LinearError';
  }
}

export class ValidationError extends LinearError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends LinearError {
  constructor(message: string = 'Invalid or missing authentication credentials') {
    super('AUTHENTICATION_ERROR', message, 401);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends LinearError {
  constructor(public retryAfter: number = 60) {
    super('RATE_LIMIT_ERROR', `Rate limit exceeded. Retry after ${retryAfter} seconds`, 429);
    this.name = 'RateLimitError';
  }
}
