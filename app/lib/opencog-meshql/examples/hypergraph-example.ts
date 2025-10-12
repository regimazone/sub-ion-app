/**
 * Example demonstrating HyperGraphQL usage
 * This file shows how to use the hypergraph features for knowledge representation
 */

import {
  OpenCogMeshQLService,
  HyperGraphQLBuilder,
  NodeStatus,
  LinkType,
} from '../index';
import type {Atom, Link} from '../types';

// Example 1: Create a knowledge graph for subscription management
export function exampleSubscriptionKnowledgeGraph() {
  const config = {
    meshId: 'subscription-knowledge-mesh',
    nodes: [
      {
        id: 'knowledge-node-1',
        endpoint: 'http://localhost:8001',
        status: NodeStatus.Active,
        capabilities: ['REASON', 'LEARN'],
        lastHeartbeat: new Date(),
      },
    ],
    defaultTimeout: 5000,
    heartbeatIntervalMs: 1000,
  };

  const service = new OpenCogMeshQLService(config);

  // Create concept nodes
  const subscriptionConcept: Atom = {
    id: 'concept-subscription',
    type: 'ConceptNode',
    name: 'Subscription',
    truthValue: {strength: 1.0, confidence: 0.95},
  };

  const customerConcept: Atom = {
    id: 'concept-customer',
    type: 'ConceptNode',
    name: 'Customer',
    truthValue: {strength: 1.0, confidence: 0.95},
  };

  const productConcept: Atom = {
    id: 'concept-product',
    type: 'ConceptNode',
    name: 'Product',
    truthValue: {strength: 1.0, confidence: 0.95},
  };

  // Add atoms to atomspace
  service.addAtom(subscriptionConcept);
  service.addAtom(customerConcept);
  service.addAtom(productConcept);

  // Create relationships using links
  const customerHasSubscription: Link = {
    id: 'link-customer-subscription',
    type: LinkType.EvaluationLink,
    outgoing: ['concept-customer', 'concept-subscription'],
    truthValue: {strength: 0.9, confidence: 0.85},
  };

  const subscriptionForProduct: Link = {
    id: 'link-subscription-product',
    type: LinkType.EvaluationLink,
    outgoing: ['concept-subscription', 'concept-product'],
    truthValue: {strength: 0.95, confidence: 0.9},
  };

  service.addLink(customerHasSubscription);
  service.addLink(subscriptionForProduct);

  return service;
}

// Example 2: Traverse the knowledge graph
export function exampleGraphTraversal(service: OpenCogMeshQLService) {
  // Traverse from customer concept outward
  const query = HyperGraphQLBuilder.create()
    .operation('traverse')
    .startFrom('concept-customer')
    .direction('outgoing')
    .depth(2)
    .build();

  const result = service.executeHyperGraphQuery(query);

  console.log('Traversal Results:');
  console.log('- Found atoms:', result.atoms.length);
  console.log('- Found links:', result.links.length);

  return result;
}

// Example 3: Pattern matching for inference
export function examplePatternMatching(service: OpenCogMeshQLService) {
  // Find all concept nodes
  const pattern = HyperGraphQLBuilder.pattern({
    type: 'ConceptNode',
  });

  const query = HyperGraphQLBuilder.create()
    .operation('match')
    .pattern(pattern)
    .build();

  const result = service.executeHyperGraphQuery(query);

  console.log('Pattern Matching Results:');
  console.log('- Matched atoms:', result.atoms.length);
  result.atoms.forEach((atom) => {
    console.log(`  - ${atom.name} (${atom.type})`);
  });

  return result;
}

// Example 4: Complex inheritance hierarchy
export function exampleInheritanceHierarchy() {
  const config = {
    meshId: 'inheritance-mesh',
    nodes: [
      {
        id: 'reasoning-node',
        endpoint: 'http://localhost:8001',
        status: NodeStatus.Active,
        capabilities: ['REASON'],
        lastHeartbeat: new Date(),
      },
    ],
    defaultTimeout: 5000,
    heartbeatIntervalMs: 1000,
  };

  const service = new OpenCogMeshQLService(config);

  // Create entity hierarchy: Human -> Mammal -> Animal -> LivingThing
  const concepts = [
    {id: 'entity-human', name: 'Human'},
    {id: 'entity-mammal', name: 'Mammal'},
    {id: 'entity-animal', name: 'Animal'},
    {id: 'entity-living', name: 'LivingThing'},
  ];

  concepts.forEach((concept) => {
    service.addAtom({
      id: concept.id,
      type: 'ConceptNode',
      name: concept.name,
      truthValue: {strength: 1.0, confidence: 0.9},
    });
  });

  // Create inheritance links
  const inheritanceLinks = [
    {from: 'entity-human', to: 'entity-mammal'},
    {from: 'entity-mammal', to: 'entity-animal'},
    {from: 'entity-animal', to: 'entity-living'},
  ];

  inheritanceLinks.forEach((rel, index) => {
    service.addLink({
      id: `inheritance-${index}`,
      type: LinkType.InheritanceLink,
      outgoing: [rel.from, rel.to],
      truthValue: {strength: 0.95, confidence: 0.9},
    });
  });

  // Query to find all ancestors of Human
  const query = HyperGraphQLBuilder.create()
    .operation('traverse')
    .startFrom('entity-human')
    .direction('outgoing')
    .depth(5)
    .build();

  const result = service.executeHyperGraphQuery(query);

  console.log('Inheritance Hierarchy Traversal:');
  console.log('Ancestors of Human:');
  result.atoms.forEach((atom) => {
    if (atom.id !== 'entity-human') {
      console.log(`  - ${atom.name}`);
    }
  });

  return {service, result};
}

// Example 5: Finding specific relationships with filters
export function exampleFilteredSearch(service: OpenCogMeshQLService) {
  const query = HyperGraphQLBuilder.create()
    .operation('find')
    .filter({
      field: 'type',
      operator: 'equals',
      value: LinkType.EvaluationLink,
    })
    .build();

  const result = service.executeHyperGraphQuery(query);

  console.log('Filtered Search Results:');
  console.log('- Found EvaluationLinks:', result.links.length);

  return result;
}
