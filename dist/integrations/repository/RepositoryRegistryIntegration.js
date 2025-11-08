"use strict";
/**
 * Repository Registry Integration Module
 * Exposes repository discovery and querying as Linear Toolkit operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryRegistryIntegration = void 0;
const BaseModule_1 = require("@modules/BaseModule");
class RepositoryRegistryIntegration extends BaseModule_1.BaseModule {
    constructor(graphqlClient, session, registry) {
        super('repositories', {
            name: 'repositories',
            version: '1.0.0',
            operations: [
                'listRepositories',
                'searchRepositories',
                'getRepository',
                'getRepositoryStats',
                'getLanguages',
                'getRepositoriesByLanguage',
                'refreshRegistry',
            ],
            dependencies: [],
        }, graphqlClient, session);
        this.registry = registry;
    }
    setupOperations() {
        // List repositories operation
        this.registerOperation(this.createOperation('listRepositories', 'List all repositories in the organization', {
            filter: {
                name: 'filter',
                type: 'string',
                required: false,
                description: 'Filter: active, archived, or all (default: active)',
            },
            limit: {
                name: 'limit',
                type: 'number',
                required: false,
                description: 'Maximum number of repos to return (default: no limit)',
            },
        }, this.listRepositories.bind(this), `
await repositoryModule.execute('listRepositories', {
  filter: 'active',
  limit: 10
});
        `));
        // Search repositories operation
        this.registerOperation(this.createOperation('searchRepositories', 'Search repositories by name or description', {
            query: {
                name: 'query',
                type: 'string',
                required: true,
                description: 'Search query (searches name and description)',
            },
            language: {
                name: 'language',
                type: 'string',
                required: false,
                description: 'Filter by programming language',
            },
            limit: {
                name: 'limit',
                type: 'number',
                required: false,
                description: 'Maximum results to return',
            },
        }, this.searchRepositories.bind(this), `
await repositoryModule.execute('searchRepositories', {
  query: 'auth',
  language: 'typescript'
});
        `));
        // Get specific repository operation
        this.registerOperation(this.createOperation('getRepository', 'Get details for a specific repository', {
            name: {
                name: 'name',
                type: 'string',
                required: true,
                description: 'Repository name (e.g., backend, frontend)',
            },
        }, this.getRepository.bind(this), `
await repositoryModule.execute('getRepository', {
  name: 'backend'
});
        `));
        // Get registry statistics operation
        this.registerOperation(this.createOperation('getRepositoryStats', 'Get organization repository statistics', {}, this.getRepositoryStats.bind(this), `
await repositoryModule.execute('getRepositoryStats');
        `));
        // Get available languages operation
        this.registerOperation(this.createOperation('getLanguages', 'Get all programming languages used in the organization', {}, this.getLanguages.bind(this), `
await repositoryModule.execute('getLanguages');
        `));
        // Get repositories by language operation
        this.registerOperation(this.createOperation('getRepositoriesByLanguage', 'Get all repositories using a specific programming language', {
            language: {
                name: 'language',
                type: 'string',
                required: true,
                description: 'Programming language (e.g., typescript, python, go)',
            },
        }, this.getRepositoriesByLanguage.bind(this), `
await repositoryModule.execute('getRepositoriesByLanguage', {
  language: 'typescript'
});
        `));
        // Refresh registry operation
        this.registerOperation(this.createOperation('refreshRegistry', 'Manually refresh the repository registry from GitHub', {
            force: {
                name: 'force',
                type: 'boolean',
                required: false,
                description: 'Force refresh even if cache is valid (default: false)',
            },
        }, this.refreshRegistry.bind(this), `
await repositoryModule.execute('refreshRegistry', {
  force: true
});
        `));
    }
    async listRepositories(params) {
        const { filter = 'active', limit } = params;
        try {
            const repos = this.registry.listRepositories({
                filter: filter || 'active',
                limit: limit,
            });
            const stats = this.registry.getStats();
            this.logger.info(`Listed ${repos.length} repositories`);
            return {
                repos,
                total: repos.length,
                cached: true,
                cacheAge: stats.cacheAge,
            };
        }
        catch (error) {
            this.logger.error('Failed to list repositories', error);
            throw error;
        }
    }
    async searchRepositories(params) {
        const { query, language, limit } = params;
        try {
            const repos = this.registry.search(query, {
                language,
                limit: limit,
            });
            this.logger.info(`Found ${repos.length} repositories matching query: ${query}`);
            return {
                repos,
                total: repos.length,
                query,
            };
        }
        catch (error) {
            this.logger.error('Failed to search repositories', error);
            throw error;
        }
    }
    async getRepository(params) {
        const { name } = params;
        try {
            const repo = this.registry.getRepository(name);
            this.logger.info(`Retrieved repository: ${name} (found: ${!!repo})`);
            return {
                repo: repo || null,
                found: !!repo,
            };
        }
        catch (error) {
            this.logger.error('Failed to get repository', error);
            throw error;
        }
    }
    async getRepositoryStats(_params) {
        try {
            const stats = this.registry.getStats();
            this.logger.info(`Retrieved registry statistics`);
            return stats;
        }
        catch (error) {
            this.logger.error('Failed to get repository stats', error);
            throw error;
        }
    }
    async getLanguages(_params) {
        try {
            const languages = this.registry.getLanguages();
            this.logger.info(`Retrieved ${languages.length} unique languages`);
            return {
                languages,
                count: languages.length,
            };
        }
        catch (error) {
            this.logger.error('Failed to get languages', error);
            throw error;
        }
    }
    async getRepositoriesByLanguage(params) {
        const { language } = params;
        try {
            const repos = this.registry.getByLanguage(language);
            this.logger.info(`Retrieved ${repos.length} repositories for language: ${language}`);
            return {
                language,
                repos,
                total: repos.length,
            };
        }
        catch (error) {
            this.logger.error('Failed to get repositories by language', error);
            throw error;
        }
    }
    async refreshRegistry(params) {
        const { force = false } = params;
        try {
            await this.registry.refreshRegistry(force);
            const stats = this.registry.getStats();
            this.logger.info(`Registry refreshed (${stats.totalRepos} repos)`);
            return {
                status: 'refreshed',
                timestamp: new Date(),
            };
        }
        catch (error) {
            this.logger.error('Failed to refresh registry', error);
            throw error;
        }
    }
}
exports.RepositoryRegistryIntegration = RepositoryRegistryIntegration;
//# sourceMappingURL=RepositoryRegistryIntegration.js.map