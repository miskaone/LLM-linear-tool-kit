"use strict";
/**
 * Repository Registry - Organization-wide repository discovery and management
 * Auto-discovers repos from GitHub organization, caches results, and provides query APIs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryRegistry = void 0;
const logger_1 = require("@utils/logger");
const cache_1 = require("@utils/cache");
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
class RepositoryRegistry {
    constructor(org, githubToken, cacheTTL = 3600000) {
        this.lastRefresh = null;
        this.org = org;
        this.githubToken = githubToken;
        this.cacheTTL = cacheTTL; // Default 1 hour
        this.logger = (0, logger_1.getLogger)('RepositoryRegistry');
        this.cache = (0, cache_1.getCache)();
        this.registryCache = new Map();
    }
    /**
     * Initialize registry - auto-discover repos from GitHub org
     */
    async initialize() {
        try {
            this.logger.info(`Initializing repository registry for org: ${this.org}`);
            await this.refreshRegistry();
            this.logger.info(`Registry initialized with ${this.registryCache.size} repositories`);
        }
        catch (error) {
            this.logger.error('Failed to initialize registry', error);
            throw error;
        }
    }
    /**
     * Refresh registry by querying GitHub API
     */
    async refreshRegistry(force = false) {
        // Check if cache is still valid
        if (!force && this.lastRefresh) {
            const age = Date.now() - this.lastRefresh.getTime();
            if (age < this.cacheTTL) {
                this.logger.debug('Registry cache still valid, skipping refresh');
                return;
            }
        }
        try {
            this.logger.info('Refreshing repository registry from GitHub');
            const repos = await this.fetchRepositoriesFromGitHub();
            this.registryCache.clear();
            for (const repo of repos) {
                this.registryCache.set(repo.name, repo);
            }
            this.lastRefresh = new Date();
            this.logger.info(`Registry refreshed with ${this.registryCache.size} repositories`);
        }
        catch (error) {
            this.logger.error('Failed to refresh registry', error);
            throw error;
        }
    }
    /**
     * Fetch repositories from GitHub API
     * Uses pagination to handle large organizations
     */
    async fetchRepositoriesFromGitHub() {
        const repos = [];
        let page = 1;
        const perPage = 100;
        while (true) {
            const url = `https://api.github.com/orgs/${this.org}/repos?page=${page}&per_page=${perPage}&sort=updated&direction=desc`;
            try {
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `token ${this.githubToken}`,
                        'Accept': 'application/vnd.github.v3+json',
                    },
                });
                if (!response.ok) {
                    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
                }
                const data = await response.json();
                if (data.length === 0) {
                    break; // No more pages
                }
                for (const repo of data) {
                    repos.push({
                        name: repo.name,
                        url: repo.html_url,
                        owner: repo.owner.login,
                        description: repo.description || undefined,
                        language: repo.language || undefined,
                        private: repo.private,
                        archived: repo.archived,
                        lastUpdated: new Date(repo.updated_at),
                        defaultBranch: repo.default_branch,
                        stars: repo.stargazers_count,
                        forks: repo.forks_count,
                        openIssuesCount: repo.open_issues_count,
                    });
                }
                page++;
                // Respect GitHub rate limiting
                const remaining = parseInt(response.headers.get('x-ratelimit-remaining') || '60', 10);
                if (remaining < 10) {
                    this.logger.warn('Approaching GitHub API rate limit, pausing refresh');
                    break;
                }
            }
            catch (error) {
                this.logger.error(`Failed to fetch repositories page ${page}`, error);
                throw error;
            }
        }
        return repos;
    }
    /**
     * List all repositories with optional filtering
     */
    listRepositories(options = {}) {
        let results = Array.from(this.registryCache.values());
        // Apply filter
        if (options.filter === 'active') {
            results = results.filter(repo => !repo.archived);
        }
        else if (options.filter === 'archived') {
            results = results.filter(repo => repo.archived);
        }
        // Apply language filter
        if (options.language) {
            results = results.filter(repo => repo.language?.toLowerCase() === options.language?.toLowerCase());
        }
        // Apply search filter
        if (options.search) {
            const searchLower = options.search.toLowerCase();
            results = results.filter(repo => repo.name.toLowerCase().includes(searchLower) ||
                repo.description?.toLowerCase().includes(searchLower));
        }
        // Sort by last updated
        results.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
        // Apply limit
        if (options.limit && options.limit > 0) {
            results = results.slice(0, options.limit);
        }
        return results;
    }
    /**
     * Get specific repository by name
     */
    getRepository(name) {
        return this.registryCache.get(name);
    }
    /**
     * Get repository by URL
     */
    getRepositoryByUrl(url) {
        for (const repo of this.registryCache.values()) {
            if (repo.url === url || repo.url === url.replace('.git', '')) {
                return repo;
            }
        }
        return undefined;
    }
    /**
     * Get registry statistics
     */
    getStats() {
        const repos = Array.from(this.registryCache.values());
        const activeRepos = repos.filter(r => !r.archived);
        const archivedRepos = repos.filter(r => r.archived);
        const languages = {};
        for (const repo of repos) {
            if (repo.language) {
                languages[repo.language] = (languages[repo.language] || 0) + 1;
            }
        }
        const cacheAge = this.lastRefresh
            ? this.formatTimeDifference(Date.now() - this.lastRefresh.getTime())
            : 'never';
        return {
            totalRepos: repos.length,
            activeRepos: activeRepos.length,
            archivedRepos: archivedRepos.length,
            languages,
            cachedAt: this.lastRefresh || new Date(),
            cacheAge,
        };
    }
    /**
     * Check if repository exists
     */
    hasRepository(name) {
        return this.registryCache.has(name);
    }
    /**
     * Get all unique languages
     */
    getLanguages() {
        const languages = new Set();
        for (const repo of this.registryCache.values()) {
            if (repo.language) {
                languages.add(repo.language);
            }
        }
        return Array.from(languages).sort();
    }
    /**
     * Search repositories by criteria
     */
    search(query, options = {}) {
        return this.listRepositories({
            ...options,
            search: query,
        });
    }
    /**
     * Get all repositories in specific language
     */
    getByLanguage(language) {
        return this.listRepositories({ language });
    }
    /**
     * Helper: Format time difference for display
     */
    formatTimeDifference(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (days > 0)
            return `${days}d ago`;
        if (hours > 0)
            return `${hours}h ago`;
        if (minutes > 0)
            return `${minutes}m ago`;
        return `${seconds}s ago`;
    }
    /**
     * Get org name
     */
    getOrg() {
        return this.org;
    }
    /**
     * Get total repository count
     */
    getCount() {
        return this.registryCache.size;
    }
}
exports.RepositoryRegistry = RepositoryRegistry;
//# sourceMappingURL=RepositoryRegistry.js.map