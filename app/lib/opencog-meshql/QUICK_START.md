# OpenCog meshQL Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Import the Components

```typescript
import {
  OpenCogMeshQLService,
  MeshQLQueryBuilder,
  MeshQLScheduler,
  NodeStatus,
} from '~/lib/opencog-meshql';
```

### Step 2: Configure Your Mesh

```typescript
const config = {
  meshId: 'my-app-mesh',
  nodes: [
    {
      id: 'worker-1',
      endpoint: 'http://localhost:8001',
      status: NodeStatus.Active,
      capabilities: ['PERCEIVE', 'REASON'],
      lastHeartbeat: new Date(),
    },
    {
      id: 'worker-2',
      endpoint: 'http://localhost:8002',
      status: NodeStatus.Active,
      capabilities: ['LEARN', 'EXECUTE'],
      lastHeartbeat: new Date(),
    },
  ],
  defaultTimeout: 10000,
  heartbeatIntervalMs: 2000,
};
```

### Step 3: Create the Service

```typescript
const meshService = new OpenCogMeshQLService(config);
```

### Step 4: Build and Execute a Query

```typescript
// Build a query
const query = MeshQLQueryBuilder.create()
  .operation('process_data')
  .parameters({userId: '123', action: 'update'})
  .timeout(5000)
  .build();

// Execute it
const result = await meshService.executeQuery(query);

// Check results
if (result.success) {
  console.log('✅ Success!');
  console.log('Nodes used:', result.executedNodes);
  console.log('Time taken:', result.executionTimeMs, 'ms');
  console.log('Data:', result.data);
} else {
  console.error('❌ Failed:', result.errors);
}
```

## 🔧 As a Job Scheduler

Use it to distribute jobs across your mesh:

```typescript
import {MeshQLScheduler} from '~/lib/opencog-meshql';
import {logger} from '~/utils/logger.server';

// Create scheduler
const scheduler = new MeshQLScheduler(logger, config);

// Schedule a job
await scheduler.enqueue(myJob, {
  dispatchDeadline: {seconds: 600},
});
```

## 📊 Working with Atomspace

Store and query knowledge in the distributed atomspace:

```typescript
// Add knowledge
meshService.addAtom({
  id: 'user-concept-123',
  type: 'ConceptNode',
  name: 'ActiveUser',
  truthValue: {
    strength: 0.95,
    confidence: 0.9,
  },
});

// Retrieve knowledge
const atom = meshService.getAtom('user-concept-123');

// Query by type
const concepts = meshService.queryAtomsByType('ConceptNode');
```

## 📈 Monitoring

Get real-time statistics:

```typescript
const stats = meshService.getStats();
console.log(`Nodes: ${stats.activeNodes}/${stats.totalNodes}`);
console.log(`Atoms: ${stats.totalAtoms}`);
```

## 🎯 Common Patterns

### Pattern 1: Execute on Specific Nodes

```typescript
const query = MeshQLQueryBuilder.create()
  .operation('specialized_task')
  .nodes(['worker-1']) // Only run on worker-1
  .parameters({data: 'value'})
  .build();
```

### Pattern 2: With Retry Policy

```typescript
const query = MeshQLQueryBuilder.create()
  .operation('critical_operation')
  .retry({
    maxAttempts: 3,
    backoffMs: 1000,
    backoffMultiplier: 2,
  })
  .build();
```

### Pattern 3: Distributed Cognitive Pipeline

```typescript
// Step 1: Perceive
const perceiveQuery = MeshQLQueryBuilder.create()
  .operation('PERCEIVE')
  .parameters({source: 'data-stream'})
  .build();

const perceived = await meshService.executeQuery(perceiveQuery);

// Step 2: Reason
const reasonQuery = MeshQLQueryBuilder.create()
  .operation('REASON')
  .parameters({input: perceived.data})
  .build();

const reasoned = await meshService.executeQuery(reasonQuery);

// Step 3: Execute
const executeQuery = MeshQLQueryBuilder.create()
  .operation('EXECUTE')
  .parameters({plan: reasoned.data})
  .build();

await meshService.executeQuery(executeQuery);
```

## 🔐 Node Management

```typescript
// Add a node dynamically
meshService.addNode({
  id: 'worker-3',
  endpoint: 'http://localhost:8003',
  status: NodeStatus.Active,
  capabilities: ['PLAN'],
  lastHeartbeat: new Date(),
});

// Remove a node
meshService.removeNode('worker-3');

// Get active nodes
const activeNodes = meshService.getActiveNodes();
```

## ⚙️ Configuration in App

Update your `config/index.ts`:

```typescript
export const config: Configuration = {
  // ...other config
  jobs: {
    scheduler: 'MESHQL',
    config: {
      meshId: 'production-mesh',
      nodes: [
        // Your production nodes
      ],
      defaultTimeout: 30000,
      heartbeatIntervalMs: 5000,
    },
  },
};
```

## 🧪 Testing

Run the tests:

```bash
npm run test app/lib/opencog-meshql
```

## 📖 More Information

- Full documentation: `app/lib/opencog-meshql/README.md`
- Implementation details: `OPENCOG_MESHQL_IMPLEMENTATION.md`
- Test examples: `app/lib/opencog-meshql/tests/`

## 🎓 Cognitive Operations

Available operations:
- **PERCEIVE**: Process input data
- **REASON**: Logical inference
- **LEARN**: Pattern recognition
- **PLAN**: Goal-directed planning
- **EXECUTE**: Action implementation

Use these in your queries:

```typescript
const query = MeshQLQueryBuilder.create()
  .operation('REASON')
  .parameters({
    premises: ['All users need validation', 'User123 is a user'],
    goal: 'infer_validation_need',
  })
  .build();
```

---

**That's it!** You're now ready to use OpenCog meshQL for distributed cognitive operations. 🎉
