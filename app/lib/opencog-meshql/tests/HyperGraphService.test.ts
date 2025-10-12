import {describe, expect, it, beforeEach} from 'vitest';
import {OpenCogMeshQLService} from '../OpenCogMeshQLService';
import {HyperGraphQLBuilder} from '../HyperGraphQLBuilder';
import {NodeStatus, LinkType} from '../types';
import type {Link, Atom} from '../types';

describe('OpenCogMeshQLService - HyperGraph functionality', () => {
  let service: OpenCogMeshQLService;

  beforeEach(() => {
    const config = {
      meshId: 'test-mesh',
      nodes: [
        {
          id: 'node1',
          endpoint: 'http://localhost:8001',
          status: NodeStatus.Active,
          capabilities: ['PERCEIVE', 'REASON'],
          lastHeartbeat: new Date(),
        },
      ],
      defaultTimeout: 5000,
      heartbeatIntervalMs: 1000,
    };
    service = new OpenCogMeshQLService(config);
  });

  describe('Link management', () => {
    it('should add a link to the hypergraph', () => {
      const atom1: Atom = {
        id: 'atom-1',
        type: 'ConceptNode',
        name: 'Human',
      };
      
      const atom2: Atom = {
        id: 'atom-2',
        type: 'ConceptNode',
        name: 'Animal',
      };

      service.addAtom(atom1);
      service.addAtom(atom2);

      const link: Link = {
        id: 'link-1',
        type: LinkType.InheritanceLink,
        outgoing: ['atom-1', 'atom-2'],
      };

      service.addLink(link);

      const retrievedLink = service.getLink('link-1');
      expect(retrievedLink).toBeDefined();
      expect(retrievedLink?.outgoing).toEqual(['atom-1', 'atom-2']);
    });

    it('should track incoming links', () => {
      const link: Link = {
        id: 'link-1',
        type: LinkType.InheritanceLink,
        outgoing: ['atom-1', 'atom-2'],
      };

      service.addLink(link);

      const incomingLinks = service.getIncomingLinks('atom-2');
      expect(incomingLinks).toHaveLength(1);
      expect(incomingLinks[0].id).toBe('link-1');
    });

    it('should track outgoing links', () => {
      const link: Link = {
        id: 'link-1',
        type: LinkType.InheritanceLink,
        outgoing: ['atom-1', 'atom-2'],
      };

      service.addLink(link);

      const outgoingLinks = service.getOutgoingLinks('atom-1');
      expect(outgoingLinks).toHaveLength(1);
      expect(outgoingLinks[0].id).toBe('link-1');
    });

    it('should handle multiple links to same atom', () => {
      const link1: Link = {
        id: 'link-1',
        type: LinkType.InheritanceLink,
        outgoing: ['atom-1', 'atom-2'],
      };

      const link2: Link = {
        id: 'link-2',
        type: LinkType.SimilarityLink,
        outgoing: ['atom-1', 'atom-3'],
      };

      service.addLink(link1);
      service.addLink(link2);

      const outgoingLinks = service.getOutgoingLinks('atom-1');
      expect(outgoingLinks).toHaveLength(2);
    });
  });

  describe('HyperGraphQL queries', () => {
    beforeEach(() => {
      // Create a simple graph structure
      // atom-1 -> link-1 -> atom-2 -> link-2 -> atom-3
      const atom1: Atom = {
        id: 'atom-1',
        type: 'ConceptNode',
        name: 'Root',
      };
      const atom2: Atom = {
        id: 'atom-2',
        type: 'ConceptNode',
        name: 'Middle',
      };
      const atom3: Atom = {
        id: 'atom-3',
        type: 'ConceptNode',
        name: 'Leaf',
      };

      service.addAtom(atom1);
      service.addAtom(atom2);
      service.addAtom(atom3);

      const link1: Link = {
        id: 'link-1',
        type: LinkType.InheritanceLink,
        outgoing: ['atom-1', 'atom-2'],
      };
      const link2: Link = {
        id: 'link-2',
        type: LinkType.InheritanceLink,
        outgoing: ['atom-2', 'atom-3'],
      };

      service.addLink(link1);
      service.addLink(link2);
    });

    it('should traverse graph from a starting atom', () => {
      const query = HyperGraphQLBuilder.create()
        .operation('traverse')
        .startFrom('atom-1')
        .direction('outgoing')
        .depth(1)
        .build();

      const result = service.executeHyperGraphQuery(query);

      expect(result.atoms.length).toBeGreaterThan(0);
      expect(result.links.length).toBeGreaterThan(0);
    });

    it('should traverse with limited depth', () => {
      const query1 = HyperGraphQLBuilder.create()
        .operation('traverse')
        .startFrom('atom-1')
        .depth(1)
        .build();

      const result1 = service.executeHyperGraphQuery(query1);
      const depth1Count = result1.atoms.length;

      const query2 = HyperGraphQLBuilder.create()
        .operation('traverse')
        .startFrom('atom-1')
        .depth(2)
        .build();

      const result2 = service.executeHyperGraphQuery(query2);
      const depth2Count = result2.atoms.length;

      expect(depth2Count).toBeGreaterThanOrEqual(depth1Count);
    });

    it('should match pattern in hypergraph', () => {
      const pattern = HyperGraphQLBuilder.pattern({
        type: 'ConceptNode',
      });

      const query = HyperGraphQLBuilder.create()
        .operation('match')
        .pattern(pattern)
        .build();

      const result = service.executeHyperGraphQuery(query);

      expect(result.atoms.length).toBe(3);
      result.atoms.forEach((atom) => {
        expect(atom.type).toBe('ConceptNode');
      });
    });

    it('should match pattern with specific name', () => {
      const pattern = HyperGraphQLBuilder.pattern({
        type: 'ConceptNode',
        name: 'Root',
      });

      const query = HyperGraphQLBuilder.create()
        .operation('match')
        .pattern(pattern)
        .build();

      const result = service.executeHyperGraphQuery(query);

      expect(result.atoms.length).toBe(1);
      expect(result.atoms[0].name).toBe('Root');
    });

    it('should find atoms with filters', () => {
      const query = HyperGraphQLBuilder.create()
        .operation('find')
        .filter({
          field: 'type',
          operator: 'equals',
          value: 'ConceptNode',
        })
        .build();

      const result = service.executeHyperGraphQuery(query);

      expect(result.atoms.length).toBe(3);
    });

    it('should find atoms with name contains filter', () => {
      const query = HyperGraphQLBuilder.create()
        .operation('find')
        .filter({
          field: 'name',
          operator: 'contains',
          value: 'oo',
        })
        .build();

      const result = service.executeHyperGraphQuery(query);

      expect(result.atoms.length).toBe(1);
      expect(result.atoms[0].name).toBe('Root');
    });

    it('should throw error for traverse without startAtomId', () => {
      const query = HyperGraphQLBuilder.create()
        .operation('traverse')
        .build();

      expect(() => service.executeHyperGraphQuery(query)).toThrow(
        'startAtomId is required for traverse operation'
      );
    });

    it('should throw error for match without pattern', () => {
      const query = HyperGraphQLBuilder.create()
        .operation('match')
        .build();

      expect(() => service.executeHyperGraphQuery(query)).toThrow(
        'pattern is required for match operation'
      );
    });
  });

  describe('Statistics', () => {
    it('should include links in statistics', () => {
      const link: Link = {
        id: 'link-1',
        type: LinkType.InheritanceLink,
        outgoing: ['atom-1', 'atom-2'],
      };

      service.addLink(link);

      const stats = service.getStats();
      expect(stats.totalLinks).toBe(1);
    });
  });

  describe('Complex graph structures', () => {
    it('should handle inheritance hierarchy', () => {
      // Create: Animal -> Mammal -> Human
      const animal: Atom = {
        id: 'animal',
        type: 'ConceptNode',
        name: 'Animal',
      };
      const mammal: Atom = {
        id: 'mammal',
        type: 'ConceptNode',
        name: 'Mammal',
      };
      const human: Atom = {
        id: 'human',
        type: 'ConceptNode',
        name: 'Human',
      };

      service.addAtom(animal);
      service.addAtom(mammal);
      service.addAtom(human);

      const link1: Link = {
        id: 'link-animal-mammal',
        type: LinkType.InheritanceLink,
        outgoing: ['mammal', 'animal'],
      };
      const link2: Link = {
        id: 'link-mammal-human',
        type: LinkType.InheritanceLink,
        outgoing: ['human', 'mammal'],
      };

      service.addLink(link1);
      service.addLink(link2);

      const query = HyperGraphQLBuilder.create()
        .operation('traverse')
        .startFrom('animal')
        .direction('incoming')
        .depth(3)
        .build();

      const result = service.executeHyperGraphQuery(query);

      expect(result.atoms.length).toBeGreaterThan(1);
    });

    it('should handle evaluation links', () => {
      const predicate: Atom = {
        id: 'pred-1',
        type: 'PredicateNode',
        name: 'hasSubscription',
      };
      const customer: Atom = {
        id: 'customer-1',
        type: 'ConceptNode',
        name: 'Customer123',
      };

      service.addAtom(predicate);
      service.addAtom(customer);

      const evalLink: Link = {
        id: 'eval-1',
        type: LinkType.EvaluationLink,
        outgoing: ['pred-1', 'customer-1'],
        truthValue: {
          strength: 0.95,
          confidence: 0.9,
        },
      };

      service.addLink(evalLink);

      const result = service.getLink('eval-1');
      expect(result).toBeDefined();
      expect(result?.truthValue?.strength).toBe(0.95);
    });
  });
});
