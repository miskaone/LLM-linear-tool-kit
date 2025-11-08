/**
 * Repository Registry Integration Module
 * Exposes repository discovery and querying as Linear Toolkit operations
 */
import { BaseModule } from '@modules/BaseModule';
import { GraphQLClient } from '@core/client/GraphQLClient';
import { SessionManager } from '@core/client/SessionManager';
import { RepositoryRegistry } from './RepositoryRegistry';
export declare class RepositoryRegistryIntegration extends BaseModule {
    private registry;
    constructor(graphqlClient: GraphQLClient, session: SessionManager, registry: RepositoryRegistry);
    protected setupOperations(): void;
    private listRepositories;
    private searchRepositories;
    private getRepository;
    private getRepositoryStats;
    private getLanguages;
    private getRepositoriesByLanguage;
    private refreshRegistry;
}
//# sourceMappingURL=RepositoryRegistryIntegration.d.ts.map