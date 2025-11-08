/**
 * Repository Registry - Organization-wide repository discovery and management
 * Auto-discovers repos from GitHub organization, caches results, and provides query APIs
 */
export interface RepositoryMetadata {
    name: string;
    url: string;
    owner: string;
    description?: string;
    language?: string;
    private: boolean;
    archived: boolean;
    lastUpdated: Date;
    defaultBranch: string;
    stars: number;
    forks: number;
    openIssuesCount: number;
}
export interface RepositoryQueryOptions {
    filter?: 'active' | 'archived' | 'all';
    language?: string;
    search?: string;
    limit?: number;
}
export interface RegistryStats {
    totalRepos: number;
    activeRepos: number;
    archivedRepos: number;
    languages: Record<string, number>;
    cachedAt: Date;
    cacheAge: string;
}
/**
 * RepositoryRegistry - Manages organization-wide repository discovery
 *
 * Features:
 * - Auto-discovers repos from configured GitHub org
 * - Caches results with configurable TTL
 * - Provides search and filter capabilities
 * - Tracks metadata (language, archived status, etc.)
 * - Supports per-repo configuration overrides
 */
export declare class RepositoryRegistry {
    private logger;
    private cache;
    private org;
    private githubToken;
    private registryCache;
    private lastRefresh;
    private cacheTTL;
    constructor(org: string, githubToken: string, cacheTTL?: number);
    /**
     * Initialize registry - auto-discover repos from GitHub org
     */
    initialize(): Promise<void>;
    /**
     * Refresh registry by querying GitHub API
     */
    refreshRegistry(force?: boolean): Promise<void>;
    /**
     * Fetch repositories from GitHub API
     * Uses pagination to handle large organizations
     */
    private fetchRepositoriesFromGitHub;
    /**
     * List all repositories with optional filtering
     */
    listRepositories(options?: RepositoryQueryOptions): RepositoryMetadata[];
    /**
     * Get specific repository by name
     */
    getRepository(name: string): RepositoryMetadata | undefined;
    /**
     * Get repository by URL
     */
    getRepositoryByUrl(url: string): RepositoryMetadata | undefined;
    /**
     * Get registry statistics
     */
    getStats(): RegistryStats;
    /**
     * Check if repository exists
     */
    hasRepository(name: string): boolean;
    /**
     * Get all unique languages
     */
    getLanguages(): string[];
    /**
     * Search repositories by criteria
     */
    search(query: string, options?: RepositoryQueryOptions): RepositoryMetadata[];
    /**
     * Get all repositories in specific language
     */
    getByLanguage(language: string): RepositoryMetadata[];
    /**
     * Helper: Format time difference for display
     */
    private formatTimeDifference;
    /**
     * Get org name
     */
    getOrg(): string;
    /**
     * Get total repository count
     */
    getCount(): number;
}
//# sourceMappingURL=RepositoryRegistry.d.ts.map