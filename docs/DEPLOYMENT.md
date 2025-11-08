# Linear Toolkit Deployment Guide

Complete guide for deploying Linear Toolkit in various environments.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Cloud Platform Deployment](#cloud-platform-deployment)
4. [Production Configuration](#production-configuration)
5. [Scaling and Performance](#scaling-and-performance)
6. [Monitoring and Observability](#monitoring-and-observability)
7. [Troubleshooting](#troubleshooting)

---

## Local Development

### Prerequisites

- Node.js 16+ or 18+
- npm or yarn
- Linear API key (get from https://linear.app/settings/api)
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/linear-toolkit/linear-toolkit.git
cd linear-toolkit

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### Environment Setup

**.env:**

```env
# Linear API Configuration
LINEAR_API_KEY=lin_api_key_xxxxx
LINEAR_API_URL=https://api.linear.app/graphql

# Cache Configuration
CACHE_ENABLED=true
CACHE_TTL=300
CACHE_MAX_SIZE=1000

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=json

# Webhook Configuration (optional)
WEBHOOK_SECRET=your-webhook-secret
WEBHOOK_PORT=3000
WEBHOOK_PATH=/webhooks

# Module Configuration
MODULES_AUTO_LOAD=false
MODULES_EAGER_LOAD=issues

# Performance Configuration
BATCH_SIZE=50
MAX_RETRIES=3
RETRY_DELAY_MS=100
OPERATION_TIMEOUT_MS=30000

# Feature Flags
FEATURE_CODE_INTEGRATION=true
FEATURE_INTELLIGENCE=true
FEATURE_BATCH_OPERATIONS=true
FEATURE_ANALYTICS=true
```

### Development Server

```bash
# Run in development mode with hot reload
npm run dev

# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run linter
npm run lint

# Type check
npm run type-check
```

### Development Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes
# ... edit files ...

# Run tests and linter
npm test && npm run lint

# Commit changes
git add .
git commit -m "Add my feature"

# Push to remote
git push origin feature/my-feature

# Create pull request on GitHub
# Wait for CI/CD to pass
# Merge to main
```

---

## Docker Deployment

### Dockerfile

**Dockerfile:**

```dockerfile
# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src/ src/
COPY tests/ tests/

# Build TypeScript
RUN npm run build

# Runtime stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copy health check script
COPY --chown=nodejs:nodejs health-check.js .

# Switch to non-root user
USER nodejs

# Expose webhook port (optional)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node health-check.js

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/index.js"]
```

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  linear-toolkit:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: linear-toolkit
    restart: always
    ports:
      - '3000:3000'
    environment:
      LINEAR_API_KEY: ${LINEAR_API_KEY}
      LINEAR_API_URL: https://api.linear.app/graphql
      CACHE_ENABLED: 'true'
      CACHE_TTL: '300'
      LOG_LEVEL: info
      WEBHOOK_SECRET: ${WEBHOOK_SECRET}
      NODE_ENV: production
    volumes:
      - ./logs:/app/logs
      - ./cache:/app/cache
    networks:
      - linear-network
    labels:
      - 'com.example.toolkit=linear-toolkit'

  redis:
    image: redis:7-alpine
    container_name: linear-toolkit-redis
    restart: always
    ports:
      - '6379:6379'
    volumes:
      - redis-data:/data
    networks:
      - linear-network
    command: redis-server --appendonly yes

networks:
  linear-network:
    driver: bridge

volumes:
  redis-data:
```

### Running with Docker

```bash
# Build image
docker build -t linear-toolkit:latest .

# Run container
docker run -d \
  -e LINEAR_API_KEY=your-api-key \
  -e WEBHOOK_SECRET=your-secret \
  -p 3000:3000 \
  --name linear-toolkit \
  linear-toolkit:latest

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f linear-toolkit

# Stop
docker-compose down
```

---

## Cloud Platform Deployment

### AWS Lambda

**handler.ts:**

```typescript
import { LinearAgentClient } from '@linear-toolkit/agent';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

let linearClient: LinearAgentClient;

async function initializeClient() {
  if (!linearClient) {
    linearClient = await LinearAgentClient.create({
      apiKey: process.env.LINEAR_API_KEY,
      cache: { enabled: true, ttl: 300 },
      logging: { level: 'info' },
    });
  }
  return linearClient;
}

export async function webhookHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const linear = await initializeClient();

    // Parse webhook payload
    const payload = JSON.parse(event.body || '{}');

    // Handle webhook
    if (payload.event === 'push') {
      // Link commit to Linear issues
      const result = await linear.executeModuleOperation('linkCommitToIssues', {
        commitHash: payload.commits[0].hash,
        repositoryUrl: payload.repository,
        commitMessage: payload.commits[0].message,
        files: payload.commits[0].files,
      });

      return {
        statusCode: 200,
        body: JSON.stringify(result),
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Unknown event type' }),
    };
  } catch (error) {
    console.error('Lambda error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
```

**serverless.yml:**

```yaml
service: linear-toolkit

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    LINEAR_API_KEY: ${env:LINEAR_API_KEY}
    WEBHOOK_SECRET: ${env:WEBHOOK_SECRET}
    LOG_LEVEL: info

functions:
  webhook:
    handler: dist/handler.webhookHandler
    events:
      - http:
          path: webhooks
          method: post
          cors: true

  getTasks:
    handler: dist/handlers/getTasks.handler
    events:
      - http:
          path: tasks
          method: get
          cors: true

  createIssue:
    handler: dist/handlers/createIssue.handler
    events:
      - http:
          path: issues
          method: post
          cors: true

plugins:
  - serverless-plugin-typescript
  - serverless-offline
```

### Google Cloud Run

**Dockerfile for Cloud Run:**

```dockerfile
FROM node:18-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist
COPY src ./src

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

**Deploy:**

```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/linear-toolkit

# Deploy to Cloud Run
gcloud run deploy linear-toolkit \
  --image gcr.io/PROJECT_ID/linear-toolkit \
  --platform managed \
  --region us-central1 \
  --set-env-vars LINEAR_API_KEY=your-api-key \
  --memory 512Mi \
  --cpu 1 \
  --timeout 30s \
  --allow-unauthenticated
```

### Heroku

**Procfile:**

```
web: node dist/index.js
release: npm run migrate
```

**Deploy:**

```bash
# Login to Heroku
heroku login

# Create app
heroku create linear-toolkit

# Set environment variables
heroku config:set LINEAR_API_KEY=your-api-key
heroku config:set WEBHOOK_SECRET=your-secret
heroku config:set NODE_ENV=production

# Push to Heroku
git push heroku main

# View logs
heroku logs --tail
```

---

## Production Configuration

### Security Best Practices

```typescript
// environment.prod.ts
export const productionConfig = {
  // API Security
  apiKeyRotation: {
    enabled: true,
    rotationIntervalDays: 90,
  },

  // HTTPS only
  https: {
    enabled: true,
    redirectHttp: true,
  },

  // Rate limiting
  rateLimit: {
    enabled: true,
    requestsPerMinute: 100,
    burstLimit: 10,
  },

  // Request validation
  validation: {
    maxPayloadSize: '1mb',
    strictContentType: true,
  },

  // CORS configuration
  cors: {
    origins: [process.env.ALLOWED_ORIGINS],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },

  // Logging
  logging: {
    level: 'warn',
    format: 'json',
    redactSecrets: true,
  },

  // Caching
  cache: {
    enabled: true,
    ttl: 3600,
    maxSize: 10000,
  },

  // Database
  database: {
    poolSize: 20,
    connectionTimeout: 5000,
    ssl: true,
  },

  // Webhooks
  webhooks: {
    timeout: 10000,
    retries: 3,
    signature: {
      required: true,
      algorithm: 'sha256',
    },
  },
};
```

### Load Balancer Configuration

**nginx.conf:**

```nginx
upstream linear-toolkit {
  least_conn;
  server 10.0.1.1:3000;
  server 10.0.1.2:3000;
  server 10.0.1.3:3000;
}

server {
  listen 443 ssl http2;
  server_name linear-toolkit.example.com;

  ssl_certificate /etc/ssl/certs/cert.pem;
  ssl_certificate_key /etc/ssl/private/key.pem;

  # Security headers
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Frame-Options "DENY" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;

  location / {
    proxy_pass http://linear-toolkit;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Timeouts
    proxy_connect_timeout 10s;
    proxy_send_timeout 30s;
    proxy_read_timeout 30s;
  }

  location /health {
    proxy_pass http://linear-toolkit/health;
    access_log off;
  }
}

server {
  listen 80;
  server_name linear-toolkit.example.com;
  return 301 https://$server_name$request_uri;
}
```

---

## Scaling and Performance

### Horizontal Scaling

```bash
# Kubernetes deployment
kubectl create deployment linear-toolkit \
  --image=linear-toolkit:latest \
  --replicas=3

# Scale up
kubectl scale deployment linear-toolkit --replicas=5

# Configure auto-scaling
kubectl autoscale deployment linear-toolkit \
  --min=3 \
  --max=10 \
  --cpu-percent=70
```

**kubernetes-deployment.yaml:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: linear-toolkit
spec:
  replicas: 3
  selector:
    matchLabels:
      app: linear-toolkit
  template:
    metadata:
      labels:
        app: linear-toolkit
    spec:
      containers:
      - name: linear-toolkit
        image: linear-toolkit:latest
        ports:
        - containerPort: 3000
        env:
        - name: LINEAR_API_KEY
          valueFrom:
            secretKeyRef:
              name: linear-secrets
              key: api-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Caching Strategy

```typescript
// Redis caching for distributed deployments
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: 0,
  maxRetriesPerRequest: null,
});

// Configure cache manager to use Redis
const cache = new CacheManager(300, 10000);
cache.setBackend(redis);
```

---

## Monitoring and Observability

### Health Checks

**health-check.js:**

```javascript
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  method: 'GET',
  timeout: 5000,
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.end();
```

**health endpoint:**

```typescript
app.get('/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cache: cache.getStats(),
  };

  res.json(health);
});

app.get('/ready', async (req, res) => {
  try {
    // Check Linear API connectivity
    await graphqlClient.query(
      { query: 'query { viewer { id } }' },
      false
    );

    res.json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false, error: error.message });
  }
});
```

### Metrics and Logging

```typescript
import pino from 'pino';
import pinoHttp from 'pino-http';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      singleLine: false,
    },
  },
});

// Structured logging
logger.info(
  {
    module: 'GitIntegration',
    operation: 'linkCommitToIssues',
    issueCount: 3,
    duration: 245,
  },
  'Commit linked successfully'
);

// HTTP request logging
app.use(pinoHttp({ logger }));
```

### Alerting Configuration

**Prometheus alerts.yml:**

```yaml
groups:
  - name: linear-toolkit
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"

      - alert: LowCacheHitRate
        expr: cache_hit_rate < 0.5
        for: 10m
        annotations:
          summary: "Cache hit rate below 50%"

      - alert: SlowOperations
        expr: operation_duration_p99 > 30000
        for: 5m
        annotations:
          summary: "Operation latency exceeds 30s"

      - alert: ApiQuotaExceeded
        expr: linear_api_calls_remaining < 100
        for: 5m
        annotations:
          summary: "Linear API quota running low"
```

---

## Troubleshooting

### Common Issues

**Issue: High memory usage**

```bash
# Check memory stats
curl http://localhost:3000/health | jq '.memory'

# Solution: Reduce cache size
export CACHE_MAX_SIZE=500

# Restart application
docker restart linear-toolkit
```

**Issue: Slow API responses**

```bash
# Check operation metrics
curl http://localhost:3000/metrics | grep operation_duration

# Enable query caching
export CACHE_TTL=600

# Check Linear API rate limits
echo "API quota remaining:" $(curl https://api.linear.app/graphql \
  -H "Authorization: Bearer $LINEAR_API_KEY" \
  -d '{"query":"query{viewer{id}}"}'
)
```

**Issue: Webhook delivery failures**

```bash
# Check webhook logs
docker-compose logs linear-toolkit | grep webhook

# Verify webhook secret
echo $WEBHOOK_SECRET

# Test webhook manually
curl -X POST http://localhost:3000/webhooks \
  -H "Content-Type: application/json" \
  -d '{"event":"push","repository":"test"}'
```

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=debug
export DEBUG=linear-toolkit:*

# Run with verbose output
npm run dev

# Check all environment variables
env | grep LINEAR

# Verify API connectivity
curl -X POST https://api.linear.app/graphql \
  -H "Authorization: Bearer $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query":"query{viewer{id name}}"}'
```

---

## Next Steps

1. Choose your deployment target (Local, Docker, Cloud, Kubernetes)
2. Configure environment variables
3. Set up monitoring and alerting
4. Configure webhooks and integrations
5. Load test your deployment
6. Monitor performance metrics
7. Set up backup and disaster recovery procedures

For more information, see [INTEGRATION_GUIDES.md](./INTEGRATION_GUIDES.md) and [API.md](./API.md).
