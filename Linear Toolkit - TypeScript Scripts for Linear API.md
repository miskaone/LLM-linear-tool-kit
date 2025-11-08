# Linear Toolkit - TypeScript Scripts for Linear API



I'll create a comprehensive TypeScript toolkit that provides CLI scripts for interacting with Linear's API, similar to what an MCP server would offer. This toolkit will be modular, type-safe, and easy to extend.



## Project Structure



```
linear-toolkit/ ├── src/ │   ├── client/ │   │   └── linear-client.ts      # Core API client │   ├── types/ │   │   └── linear.types.ts       # TypeScript types │   ├── scripts/ │   │   ├── create-issue.ts       # Create a new issue │   │   ├── list-issues.ts        # List issues with filters │   │   ├── update-issue.ts       # Update an existing issue │   │   ├── get-issue.ts          # Get issue details │   │   ├── list-teams.ts         # List available teams │   │   └── list-projects.ts      # List projects │   ├── utils/ │   │   └── config.ts             # Configuration helper │   └── index.ts                  # Main entry point ├── .env.example ├── package.json ├── tsconfig.json └── README.md 
```



## Implementation



### 1. `package.json`



```json
{
  "name": "linear-toolkit",
  "version": "1.0.0",
  "description": "TypeScript toolkit for Linear API with CLI scripts",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "create-issue": "tsx src/scripts/create-issue.ts",
    "list-issues": "tsx src/scripts/list-issues.ts",
    "update-issue": "tsx src/scripts/update-issue.ts",
    "get-issue": "tsx src/scripts/get-issue.ts",
    "list-teams": "tsx src/scripts/list-teams.ts",
    "list-projects": "tsx src/scripts/list-projects.ts",
    "cli": "tsx src/index.ts"
  },
  "keywords": ["linear", "api", "typescript", "cli", "toolkit"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "dotenv": "^16.4.5",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.11.19",
    "tsx": "^4.7.1",
    "typescript": "^5.3.3"
  }
}
```



### 2. `tsconfig.json`



```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```



### 3. `.env.example`



```text
LINEAR_API_KEY=your_linear_api_key_here
LINEAR_TEAM_ID=your_default_team_id
```



### 4. `src/types/linear.types.ts`



```typescript
// Linear API Type Definitions
export interface LinearClientConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface Issue {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  state: {
    id: string;
    name: string;
    type: string;
  };
  priority: number;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  creator: {
    id: string;
    name: string;
    email: string;
  };
  labels: {
    nodes: Array<{
      id: string;
      name: string;
      color: string;
    }>;
  };
  team: {
    id: string;
    name: string;
    key: string;
  };
  project?: {
    id: string;
    name: string;
  };
  cycle?: {
    id: string;
    number: number;
  };
  estimate?: number;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  archivedAt?: string;
  url: string;
}

export interface Team {
  id: string;
  name: string;
  key: string;
  description?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  state: string;
  teams: {
    nodes: Team[];
  };
}

export interface CreateIssueInput {
  title: string;
  description?: string;
  teamId: string;
  assigneeId?: string;
  projectId?: string;
  priority?: number;
  labelIds?: string[];
  estimate?: number;
  dueDate?: string;
}

export interface UpdateIssueInput {
  id: string;
  title?: string;
  description?: string;
  stateId?: string;
  assigneeId?: string;
  projectId?: string;
  priority?: number;
  labelIds?: string[];
  estimate?: number;
  dueDate?: string;
  archived?: boolean;
}

export interface ListIssuesFilter {
  teamId?: string;
  assigneeId?: string;
  projectId?: string;
  stateType?: 'backlog' | 'unstarted' | 'started' | 'completed' | 'canceled';
  priority?: number;
  limit?: number;
  search?: string;
}

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    extensions?: Record<string, unknown>;
  }>;
}
```



### 5. `src/utils/config.ts`



```typescript
import * as dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const ConfigSchema = z.object({
  LINEAR_API_KEY: z.string().min(1, 'LINEAR_API_KEY is required'),
  LINEAR_TEAM_ID: z.string().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

export function getConfig(): Config {
  try {
    return ConfigSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Configuration error:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

export function validateApiKey(apiKey: string): boolean {
  return /^lin_api_[a-zA-Z0-9]+$/.test(apiKey);
}
```



### 6. `src/client/linear-client.ts`



```typescript
import { getConfig } from '../utils/config';
import type {
  Issue,
  Team,
  Project,
  CreateIssueInput,
  UpdateIssueInput,
  ListIssuesFilter,
  GraphQLResponse,
} from '../types/linear.types';

export class LinearClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    const config = getConfig();
    this.apiKey = apiKey || config.LINEAR_API_KEY;
    this.baseUrl = 'https://api.linear.app/graphql';
    
    if (!this.apiKey) {
      throw new Error('Linear API key is required. Set LINEAR_API_KEY environment variable.');
    }
  }

  private async request<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = (await response.json()) as GraphQLResponse<T>;
    
    if (result.errors) {
      throw new Error(`GraphQL error: ${result.errors.map(e => e.message).join(', ')}`);
    }

    if (!result.data) {
      throw new Error('No data returned from Linear API');
    }

    return result.data;
  }

  // Issue operations
  async createIssue(input: CreateIssueInput): Promise<Issue> {
    const query = `
      mutation CreateIssue($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue {
            id
            identifier
            title
            description
            state {
              id
              name
              type
            }
            priority
            assignee {
              id
              name
              email
            }
            creator {
              id
              name
              email
            }
            labels {
              nodes {
                id
                name
                color
              }
            }
            team {
              id
              name
              key
            }
            project {
              id
              name
            }
            createdAt
            updatedAt
            url
          }
        }
      }
    `;

    const data = await this.request<{ issueCreate: { issue: Issue } }>(query, { input });
    return data.issueCreate.issue;
  }

  async updateIssue(input: UpdateIssueInput): Promise<Issue> {
    const { id, ...updateData } = input;
    const query = `
      mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
        issueUpdate(id: $id, input: $input) {
          success
          issue {
            id
            identifier
            title
            description
            state {
              id
              name
              type
            }
            priority
            assignee {
              id
              name
              email
            }
            creator {
              id
              name
              email
            }
            labels {
              nodes {
                id
                name
                color
              }
            }
            team {
              id
              name
              key
            }
            project {
              id
              name
            }
            createdAt
            updatedAt
            url
          }
        }
      }
    `;

    const data = await this.request<{ issueUpdate: { issue: Issue } }>(query, {
      id,
      input: updateData,
    });
    return data.issueUpdate.issue;
  }

  async getIssue(id: string): Promise<Issue> {
    const query = `
      query GetIssue($id: String!) {
        issue(id: $id) {
          id
          identifier
          title
          description
          state {
            id
            name
            type
          }
          priority
          assignee {
            id
            name
            email
          }
          creator {
            id
            name
            email
          }
          labels {
            nodes {
              id
              name
              color
            }
          }
          team {
            id
            name
            key
          }
          project {
            id
            name
          }
          createdAt
          updatedAt
          url
        }
      }
    `;

    const data = await this.request<{ issue: Issue }>(query, { id });
    return data.issue;
  }

  async listIssues(filter: ListIssuesFilter = {}): Promise<Issue[]> {
    const {
      teamId,
      assigneeId,
      projectId,
      stateType,
      priority,
      limit = 50,
      search,
    } = filter;

    const query = `
      query ListIssues(
        $filter: IssueFilter
        $first: Int
      ) {
        issues(filter: $filter, first: $first) {
          nodes {
            id
            identifier
            title
            description
            state {
              id
              name
              type
            }
            priority
            assignee {
              id
              name
              email
            }
            creator {
              id
              name
              email
            }
            labels {
              nodes {
                id
                name
                color
              }
            }
            team {
              id
              name
              key
            }
            project {
              id
              name
            }
            createdAt
            updatedAt
            url
          }
        }
      }
    `;

    const filterInput: Record<string, unknown> = {};
    if (teamId) filterInput.team = { id: { eq: teamId } };
    if (assigneeId) filterInput.assignee = { id: { eq: assigneeId } };
    if (projectId) filterInput.project = { id: { eq: projectId } };
    if (stateType) filterInput.state = { type: { eq: stateType } };
    if (priority !== undefined) filterInput.priority = { eq: priority };
    if (search) filterInput.search = search;

    const data = await this.request<{ issues: { nodes: Issue[] } }>(query, {
      filter: filterInput,
      first: limit,
    });

    return data.issues.nodes;
  }

  // Team operations
  async listTeams(): Promise<Team[]> {
    const query = `
      query ListTeams {
        teams {
          nodes {
            id
            name
            key
            description
          }
        }
      }
    `;

    const data = await this.request<{ teams: { nodes: Team[] } }>(query);
    return data.teams.nodes;
  }

  // Project operations
  async listProjects(teamId?: string): Promise<Project[]> {
    const query = `
      query ListProjects($filter: ProjectFilter) {
        projects(filter: $filter) {
          nodes {
            id
            name
            description
            state
            teams {
              nodes {
                id
                name
                key
              }
            }
          }
        }
      }
    `;

    const filter = teamId ? { teams: { id: { eq: teamId } } } : {};
    const data = await this.request<{ projects: { nodes: Project[] } }>(query, { filter });
    return data.projects.nodes;
  }

  // Utility methods
  async findTeamByKey(key: string): Promise<Team | null> {
    const teams = await this.listTeams();
    return teams.find((t) => t.key === key) || null;
  }

  async findTeamByName(name: string): Promise<Team | null> {
    const teams = await this.listTeams();
    return teams.find((t) => t.name.toLowerCase() === name.toLowerCase()) || null;
  }
}
```



### 7. `src/scripts/create-issue.ts`



```typescript
#!/usr/bin/env tsx
import { LinearClient } from '../client/linear-client';
import { getConfig } from '../utils/config';

async function main() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
      console.error('Usage: npm run create-issue -- <title> [description] [options]');
      console.error('\nOptions:');
      console.error('  --team-id <id>     Team ID (or set LINEAR_TEAM_ID in .env)');
      console.error('  --priority <0-4>   Priority level (default: 0)');
      console.error('  --assignee <id>    Assignee user ID');
      console.error('  --project <id>     Project ID');
      console.error('  --estimate <num>   Story points estimate');
      console.error('\nExample:');
      console.error('  npm run create-issue -- "Fix bug" "Description here" --priority 2');
      process.exit(1);
    }

    const title = args[0];
    let description = args[1];
    
    // Parse options
    const options: Record<string, string> = {};
    for (let i = description && !description.startsWith('--') ? 2 : 1; i < args.length; i += 2) {
      if (args[i].startsWith('--') && i + 1 < args.length) {
        options[args[i].replace('--', '')] = args[i + 1];
      }
    }

    const config = getConfig();
    const client = new LinearClient();

    const teamId = options['team-id'] || config.LINEAR_TEAM_ID;
    if (!teamId) {
      console.error('Error: Team ID is required. Set LINEAR_TEAM_ID in .env or use --team-id');
      process.exit(1);
    }

    // If description looks like an option flag, treat it as null
    if (description?.startsWith('--')) {
      description = undefined;
    }

    const issue = await client.createIssue({
      title,
      description,
      teamId,
      priority: options.priority ? parseInt(options.priority) : undefined,
      assigneeId: options.assignee,
      projectId: options.project,
      estimate: options.estimate ? parseInt(options.estimate) : undefined,
    });

    console.log('✅ Issue created successfully!');
    console.log(`\nIssue: ${issue.identifier}`);
    console.log(`Title: ${issue.title}`);
    console.log(`URL: ${issue.url}`);
    console.log(`State: ${issue.state.name}`);
    console.log(`Priority: ${issue.priority}`);
    if (issue.assignee) {
      console.log(`Assignee: ${issue.assignee.name}`);
    }
    if (issue.project) {
      console.log(`Project: ${issue.project.name}`);
    }

  } catch (error) {
    console.error('❌ Error creating issue:');
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main();
```



### 8. `src/scripts/list-issues.ts`



```typescript
#!/usr/bin/env tsx
import { LinearClient } from '../client/linear-client';
import { getConfig } from '../utils/config';
import type { ListIssuesFilter } from '../types/linear.types';

async function main() {
  try {
    const args = process.argv.slice(2);
    const options: Record<string, string> = {};

    // Parse options
    for (let i = 0; i < args.length; i += 2) {
      if (args[i].startsWith('--') && i + 1 < args.length) {
        options[args[i].replace('--', '')] = args[i + 1];
      }
    }

    const config = getConfig();
    const client = new LinearClient();

    const filter: ListIssuesFilter = {
      teamId: options['team-id'] || config.LINEAR_TEAM_ID,
      assigneeId: options.assignee,
      projectId: options.project,
      stateType: options['state-type'] as ListIssuesFilter['stateType'],
      priority: options.priority ? parseInt(options.priority) : undefined,
      limit: options.limit ? parseInt(options.limit) : 20,
      search: options.search,
    };

    const issues = await client.listIssues(filter);

    if (issues.length === 0) {
      console.log('No issues found.');
      return;
    }

    console.log(`\nFound ${issues.length} issues:\n`);

    issues.forEach((issue) => {
      const priority = '🔴'.repeat(Math.max(0, issue.priority));
      const assignee = issue.assignee ? `@${issue.assignee.name}` : 'Unassigned';
      const project = issue.project ? `[${issue.project.name}]` : '';
      
      console.log(
        `${issue.identifier} ${priority} ${issue.title} ${project}`
      );
      console.log(`  State: ${issue.state.name} | Assignee: ${assignee}`);
      console.log(`  URL: ${issue.url}\n`);
    });

  } catch (error) {
    console.error('❌ Error listing issues:');
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main();
```



### 9. `src/scripts/update-issue.ts`



```typescript
#!/usr/bin/env tsx
import { LinearClient } from '../client/linear-client';
import type { UpdateIssueInput } from '../types/linear.types';

async function main() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.error('Usage: npm run update-issue -- <issue-id> <field> <value> [field value...]');
      console.error('\nFields:');
      console.error('  title, description, state, assignee, project, priority, estimate, dueDate');
      console.error('\nExamples:');
      console.error('  npm run update-issue -- ENG-123 title "New title"');
      console.error('  npm run update-issue -- ENG-123 priority 3 state "In Progress"');
      process.exit(1);
    }

    const issueId = args[0];
    const updates: Record<string, string> = {};

    // Parse field-value pairs
    for (let i = 1; i < args.length; i += 2) {
      if (i + 1 < args.length) {
        updates[args[i]] = args[i + 1];
      }
    }

    const client = new LinearClient();

    // Build update input
    const updateInput: UpdateIssueInput = { id: issueId };

    if (updates.title) updateInput.title = updates.title;
    if (updates.description) updateInput.description = updates.description;
    if (updates.priority) updateInput.priority = parseInt(updates.priority);
    if (updates.estimate) updateInput.estimate = parseInt(updates.estimate);
    if (updates.assignee) updateInput.assigneeId = updates.assignee;
    if (updates.project) updateInput.projectId = updates.project;
    if (updates.dueDate) updateInput.dueDate = updates.dueDate;
    if (updates.state) {
      // Find state ID by name (simplified - in production you'd query available states)
      console.warn('Note: State name provided. In production, map this to a state ID.');
    }

    const issue = await client.updateIssue(updateInput);

    console.log('✅ Issue updated successfully!');
    console.log(`\nIssue: ${issue.identifier}`);
    console.log(`Title: ${issue.title}`);
    console.log(`State: ${issue.state.name}`);
    console.log(`Priority: ${issue.priority}`);
    console.log(`URL: ${issue.url}`);

  } catch (error) {
    console.error('❌ Error updating issue:');
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main();
```



### 10. `src/scripts/get-issue.ts`



```typescript
#!/usr/bin/env tsx
import { LinearClient } from '../client/linear-client';

async function main() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length !== 1) {
      console.error('Usage: npm run get-issue -- <issue-id>');
      console.error('\nExample:');
      console.error('  npm run get-issue -- ENG-123');
      process.exit(1);
    }

    const issueId = args[0];
    const client = new LinearClient();

    const issue = await client.getIssue(issueId);

    console.log(`\nIssue: ${issue.identifier}`);
    console.log(`Title: ${issue.title}`);
    console.log(`URL: ${issue.url}`);
    console.log(`State: ${issue.state.name} (${issue.state.type})`);
    console.log(`Priority: ${'🔴'.repeat(Math.max(0, issue.priority))}`);
    console.log(`Team: ${issue.team.name} (${issue.team.key})`);
    
    if (issue.description) {
      console.log(`\nDescription:\n${issue.description}`);
    }
    
    if (issue.assignee) {
      console.log(`\nAssignee: ${issue.assignee.name} (${issue.assignee.email})`);
    }
    
    if (issue.project) {
      console.log(`Project: ${issue.project.name}`);
    }
    
    if (issue.labels.nodes.length > 0) {
      console.log(`Labels: ${issue.labels.nodes.map(l => l.name).join(', ')}`);
    }
    
    console.log(`\nCreated: ${new Date(issue.createdAt).toLocaleString()}`);
    console.log(`Updated: ${new Date(issue.updatedAt).toLocaleString()}`);

  } catch (error) {
    console.error('❌ Error getting issue:');
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main();
```



### 11. `src/scripts/list-teams.ts`



```typescript
#!/usr/bin/env tsx
import { LinearClient } from '../client/linear-client';

async function main() {
  try {
    const client = new LinearClient();
    const teams = await client.listTeams();

    if (teams.length === 0) {
      console.log('No teams found.');
      return;
    }

    console.log(`\nAvailable teams:\n`);
    
    teams.forEach((team) => {
      console.log(`  ${team.name} (${team.key})`);
      console.log(`  ID: ${team.id}`);
      if (team.description) {
        console.log(`  Description: ${team.description}`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error listing teams:');
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main();
```