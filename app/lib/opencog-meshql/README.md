# OpenCog meshQL - Distributed Service-Daemon Architecture

This module implements OpenCog as a distributed service-daemon mesh with a custom query language (meshQL) for coordinating cognitive operations across multiple nodes.

## Overview

OpenCog meshQL provides a distributed cognitive architecture that allows you to:

- **Distribute cognitive operations** across multiple service daemons (nodes)
- **Query and coordinate** nodes using the meshQL query language
- **Manage atomspace** in a distributed manner
- **Schedule jobs** across the mesh with fault tolerance

## Architecture

### Components

1. **OpenCogMeshQLService**: Core service managing the distributed mesh and atomspace
2. **MeshQLScheduler**: Job scheduler that distributes work across mesh nodes
3. **MeshQLQueryBuilder**: Fluent API for building meshQL queries
4. **Types**: TypeScript types and interfaces for the mesh architecture

### Key Concepts

#### Mesh Nodes
Nodes are individual service daemons in the distributed system. Each node has:
- Unique ID and endpoint
- Status (Active, Idle, Busy, Offline)
- Capabilities (cognitive operations it can perform)
- Heartbeat for health monitoring

#### meshQL Queries
Queries define operations to be executed across the mesh:
- **Operation**: The cognitive operation to perform
- **Nodes**: Target nodes (or auto-select from active nodes)
- **Parameters**: Operation-specific parameters
- **Timeout**: Maximum execution time
- **Retry Policy**: Automatic retry configuration

#### Atomspace
Distributed knowledge representation using atoms:
- **Atoms**: Basic units of knowledge with type, name, and values
- **Truth Values**: Probabilistic reasoning with strength and confidence
- **Attention Values**: Focus management with short/long-term importance

## Usage

### Basic Setup

```typescript
import {
  OpenCogMeshQLService,
  MeshQLScheduler,
  MeshQLQueryBuilder,
  NodeStatus,
} from '~/lib/opencog-meshql';

// Configure mesh nodes
const config = {
  meshId: 'my-mesh',
  nodes: [
    {
      id: 'node1',
      endpoint: 'http://localhost:8001',
      status: NodeStatus.Active,
      capabilities: ['PERCEIVE', 'REASON'],
      lastHeartbeat: new Date(),
    },
    {
      id: 'node2',
      endpoint: 'http://localhost:8002',
      status: NodeStatus.Active,
      capabilities: ['LEARN', 'PLAN'],
      lastHeartbeat: new Date(),
    },
  ],
  defaultTimeout: 5000,
  heartbeatIntervalMs: 1000,
};

// Create service
const meshService = new OpenCogMeshQLService(config);
```

### Building and Executing Queries

```typescript
// Build a query
const query = MeshQLQueryBuilder.create()
  .operation('process_subscription')
  .nodes(['node1', 'node2'])
  .parameters({
    subscriptionId: 'gid://shopify/Subscription/123',
    action: 'renew',
  })
  .timeout(10000)
  .retry({
    maxAttempts: 3,
    backoffMs: 1000,
    backoffMultiplier: 2,
  })
  .build();

// Execute query
const result = await meshService.executeQuery(query);

if (result.success) {
  console.log('Query executed successfully');
  console.log('Executed on nodes:', result.executedNodes);
  console.log('Execution time:', result.executionTimeMs, 'ms');
  console.log('Results:', result.data);
} else {
  console.error('Query failed:', result.errors);
}
```

### Using as Job Scheduler

```typescript
import {MeshQLScheduler} from '~/lib/opencog-meshql';
import {logger} from '~/utils/logger.server';

// Create scheduler
const scheduler = new MeshQLScheduler(logger, config);

// Enqueue a job
await scheduler.enqueue(myJob, {
  dispatchDeadline: {seconds: 600},
});
```

### Managing Nodes

```typescript
// Add a node
meshService.addNode({
  id: 'node3',
  endpoint: 'http://localhost:8003',
  status: NodeStatus.Active,
  capabilities: ['EXECUTE'],
  lastHeartbeat: new Date(),
});

// Remove a node
meshService.removeNode('node3');

// Get active nodes
const activeNodes = meshService.getActiveNodes();
console.log('Active nodes:', activeNodes.length);
```

### Working with Atomspace

```typescript
// Add atoms to the distributed atomspace
meshService.addAtom({
  id: 'subscription-concept',
  type: 'ConceptNode',
  name: 'SubscriptionContract',
  truthValue: {
    strength: 0.95,
    confidence: 0.9,
  },
  attentionValue: {
    sti: 100,  // Short-term importance
    lti: 50,   // Long-term importance
    vlti: 10,  // Very long-term importance
  },
});

// Query atoms
const atom = meshService.getAtom('subscription-concept');
const conceptNodes = meshService.queryAtomsByType('ConceptNode');
```

### Configuration

Add meshQL scheduler to your app configuration:

```typescript
// config/index.ts
export const config: Configuration = {
  // ...other config
  jobs: {
    scheduler: 'MESHQL',
    config: {
      meshId: 'production-mesh',
      nodes: [
        // Define your mesh nodes
      ],
      defaultTimeout: 30000,
      heartbeatIntervalMs: 5000,
    },
  },
};
```

## Cognitive Operations

The system supports various cognitive operations:

- **PERCEIVE**: Gather and process sensory input
- **REASON**: Logical inference and deduction
- **LEARN**: Pattern recognition and knowledge acquisition
- **PLAN**: Goal-directed action planning
- **EXECUTE**: Action execution and implementation

## Monitoring and Statistics

```typescript
// Get mesh statistics
const stats = meshService.getStats();
console.log('Total nodes:', stats.totalNodes);
console.log('Active nodes:', stats.activeNodes);
console.log('Total atoms:', stats.totalAtoms);
```

## Error Handling

meshQL provides comprehensive error reporting:

```typescript
const result = await meshService.executeQuery(query);

if (!result.success) {
  result.errors?.forEach((error) => {
    console.error(
      `Error on node ${error.nodeId}:`,
      error.message,
      'at',
      error.timestamp
    );
  });
}
```

## Testing

The module includes comprehensive test coverage:

```bash
npm run test app/lib/opencog-meshql
```

## Future Enhancements

Potential areas for expansion:

1. **Network Communication**: Implement actual HTTP/WebSocket communication between nodes
2. **Consensus Protocols**: Add distributed consensus for atomspace synchronization
3. **Load Balancing**: Implement smart job distribution based on node capabilities and load
4. **Persistence**: Add distributed persistence for atomspace
5. **Monitoring Dashboard**: Create real-time visualization of mesh operations
6. **Security**: Add authentication and authorization for node communication

## References

- [OpenCog Project](https://opencog.org/)
- [Atomspace Documentation](https://wiki.opencog.org/w/Atomspace)
- [Pattern Matcher](https://wiki.opencog.org/w/Pattern_matcher)
