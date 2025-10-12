# HyperGraphQL Implementation Guide

## Overview

HyperGraphQL extends the OpenCog meshQL implementation with a powerful query language for traversing and querying hypergraph structures. This enables sophisticated knowledge representation and reasoning capabilities within the distributed mesh architecture.

## What is a HyperGraph?

A hypergraph is a generalization of a graph where edges (called "links" in OpenCog) can connect any number of vertices (called "atoms"). This allows for more expressive knowledge representation than traditional graphs.

### Key Concepts

- **Atoms**: Basic units of knowledge (nodes in the graph)
- **Links**: Hyperedges that connect multiple atoms
- **Truth Values**: Probabilistic weights on atoms and links
- **Attention Values**: Focus management (STI, LTI, VLTI)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              HyperGraphQL Layer                         │
│  (Query Language for Graph Operations)                  │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│           OpenCogMeshQLService                          │
│  ┌───────────────┐      ┌──────────────────┐           │
│  │   Atomspace   │      │  Link Indices    │           │
│  │  (Atoms Map)  │      │  - Incoming      │           │
│  │               │◄────►│  - Outgoing      │           │
│  └───────────────┘      └──────────────────┘           │
│                                                          │
│  ┌──────────────────────────────────────────┐          │
│  │         HyperGraph Operations            │          │
│  │  - Traverse  - Match  - Find             │          │
│  └──────────────────────────────────────────┘          │
└──────────────────────────────────────────────────────────┘
```

## Link Types

HyperGraphQL supports various link types for different relationships:

### Common Link Types

```typescript
enum LinkType {
  InheritanceLink = 'InheritanceLink',    // A inherits from B
  SimilarityLink = 'SimilarityLink',      // A is similar to B
  EvaluationLink = 'EvaluationLink',      // Predicate evaluation
  ImplicationLink = 'ImplicationLink',    // A implies B
  ListLink = 'ListLink',                  // Ordered list
  ExecutionLink = 'ExecutionLink',        // Executable operation
  MemberLink = 'MemberLink',              // Set membership
  SubsetLink = 'SubsetLink',              // Subset relationship
}
```

### Example: Inheritance Hierarchy

```typescript
// Human inherits from Mammal
const inheritanceLink: Link = {
  id: 'human-mammal-link',
  type: LinkType.InheritanceLink,
  outgoing: ['human-atom', 'mammal-atom'],
  truthValue: {strength: 1.0, confidence: 0.95},
};
```

## Query Operations

### 1. Traverse

Navigate the graph from a starting point.

```typescript
const query = HyperGraphQLBuilder.create()
  .operation('traverse')
  .startFrom('atom-id')
  .direction('outgoing')  // or 'incoming' or 'both'
  .depth(3)
  .build();

const result = service.executeHyperGraphQuery(query);
```

**Use Cases:**
- Find all descendants in an inheritance hierarchy
- Discover related concepts
- Map knowledge neighborhoods

### 2. Match

Find atoms/links matching a specific pattern.

```typescript
const pattern = HyperGraphQLBuilder.pattern({
  type: 'ConceptNode',
  name: 'Subscription',
  truthValueMin: 0.8,
});

const query = HyperGraphQLBuilder.create()
  .operation('match')
  .pattern(pattern)
  .build();

const result = service.executeHyperGraphQuery(query);
```

**Use Cases:**
- Find all atoms of a specific type
- Locate concepts with high truth values
- Pattern-based inference

### 3. Find

Search using filters.

```typescript
const query = HyperGraphQLBuilder.create()
  .operation('find')
  .filter({
    field: 'type',
    operator: 'equals',
    value: 'ConceptNode',
  })
  .filter({
    field: 'name',
    operator: 'contains',
    value: 'Customer',
  })
  .build();

const result = service.executeHyperGraphQuery(query);
```

**Use Cases:**
- Search by attributes
- Complex filtering
- Data mining

## Practical Examples

### Example 1: Building a Knowledge Base

```typescript
import {
  OpenCogMeshQLService,
  HyperGraphQLBuilder,
  LinkType,
  NodeStatus,
} from '~/lib/opencog-meshql';

// Setup
const service = new OpenCogMeshQLService({
  meshId: 'kb-mesh',
  nodes: [{
    id: 'kb-node',
    endpoint: 'http://localhost:8001',
    status: NodeStatus.Active,
    capabilities: ['REASON'],
    lastHeartbeat: new Date(),
  }],
  defaultTimeout: 5000,
  heartbeatIntervalMs: 1000,
});

// Add concepts
service.addAtom({
  id: 'human',
  type: 'ConceptNode',
  name: 'Human',
});

service.addAtom({
  id: 'mortal',
  type: 'ConceptNode',
  name: 'Mortal',
});

// Create relationship: All humans are mortal
service.addLink({
  id: 'human-mortal',
  type: LinkType.InheritanceLink,
  outgoing: ['human', 'mortal'],
  truthValue: {strength: 1.0, confidence: 1.0},
});
```

### Example 2: Querying Relationships

```typescript
// Find what 'human' inherits from
const query = HyperGraphQLBuilder.create()
  .operation('traverse')
  .startFrom('human')
  .direction('outgoing')
  .depth(1)
  .build();

const result = service.executeHyperGraphQuery(query);

result.links.forEach((link) => {
  if (link.type === LinkType.InheritanceLink) {
    console.log(`Human inherits from: ${link.outgoing[1]}`);
  }
});
```

### Example 3: Complex Pattern Matching

```typescript
// Find all high-confidence inheritance relationships
const pattern = HyperGraphQLBuilder.pattern({
  linkType: LinkType.InheritanceLink,
  truthValueMin: 0.9,
});

const query = HyperGraphQLBuilder.create()
  .operation('match')
  .pattern(pattern)
  .build();

const result = service.executeHyperGraphQuery(query);
console.log(`Found ${result.links.length} high-confidence inheritance links`);
```

## API Reference

### HyperGraphQLBuilder

#### Methods

- `operation(op)` - Set operation type ('traverse', 'match', 'find')
- `startFrom(atomId)` - Set starting atom for traversal
- `direction(dir)` - Set direction ('incoming', 'outgoing', 'both')
- `depth(d)` - Set maximum traversal depth
- `pattern(p)` - Add pattern to match
- `filter(f)` - Add filter
- `build()` - Build the query

#### Static Methods

- `create()` - Create new builder instance
- `pattern(config)` - Create a pattern object

### OpenCogMeshQLService

#### HyperGraph Methods

- `addLink(link)` - Add a link to the hypergraph
- `getLink(linkId)` - Get link by ID
- `getIncomingLinks(atomId)` - Get all incoming links to an atom
- `getOutgoingLinks(atomId)` - Get all outgoing links from an atom
- `executeHyperGraphQuery(query)` - Execute a HyperGraphQL query

## Performance Considerations

### Indexing

The implementation uses bidirectional indexing for fast link lookups:

```typescript
// Incoming index: atomId -> Set of link IDs pointing to it
private incomingIndex: Map<string, Set<string>>;

// Outgoing index: atomId -> Set of link IDs from it
private outgoingIndex: Map<string, Set<string>>;
```

This enables O(1) lookup of incoming/outgoing links for any atom.

### Traversal

- Traversal uses breadth-first search (BFS)
- Visited set prevents cycles
- Depth limit prevents runaway queries
- Early termination when depth exceeded

## Integration with meshQL

HyperGraphQL works seamlessly alongside meshQL:

```typescript
// Use meshQL for distributed job execution
const meshQuery = MeshQLQueryBuilder.create()
  .operation('process_data')
  .parameters({data: 'value'})
  .build();

await service.executeQuery(meshQuery);

// Use HyperGraphQL for knowledge queries
const graphQuery = HyperGraphQLBuilder.create()
  .operation('traverse')
  .startFrom('concept-1')
  .build();

const result = service.executeHyperGraphQuery(graphQuery);
```

## Best Practices

1. **Use Appropriate Depth**: Start with small depths (1-2) and increase as needed
2. **Index Management**: Links are automatically indexed on creation
3. **Truth Values**: Use truth values to represent confidence in relationships
4. **Pattern Specificity**: Make patterns as specific as possible for better performance
5. **Direction Control**: Use specific directions ('incoming' or 'outgoing') when possible

## Future Enhancements

Potential additions to HyperGraphQL:

1. **Advanced Pattern Matching**: Regular expressions, variable binding
2. **Aggregate Operations**: Count, sum, average over results
3. **Path Finding**: Shortest path, all paths algorithms
4. **Subgraph Extraction**: Extract connected components
5. **Graph Algorithms**: Centrality, clustering, community detection
6. **Persistence**: Save/load hypergraph state
7. **Distributed Queries**: Execute queries across multiple mesh nodes

## Resources

- [OpenCog Atomspace](https://wiki.opencog.org/w/Atomspace)
- [Pattern Matcher](https://wiki.opencog.org/w/Pattern_matcher)
- [meshQL Documentation](./README.md)
- [Quick Start Guide](./QUICK_START.md)
- [Examples](./examples/hypergraph-example.ts)

## Support

For issues or questions:
1. Review the examples in `examples/hypergraph-example.ts`
2. Check test files for usage patterns
3. Consult the main README.md
4. Review OPENCOG_MESHQL_IMPLEMENTATION.md for architecture details
