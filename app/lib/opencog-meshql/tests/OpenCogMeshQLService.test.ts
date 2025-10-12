import {describe, expect, it, beforeEach} from 'vitest';
import {OpenCogMeshQLService} from '../OpenCogMeshQLService';
import {MeshQLQueryBuilder} from '../MeshQLQueryBuilder';
import type {MeshNode, OpenCogMeshQLConfig, Atom} from '../types';
import {NodeStatus, CognitiveOperation} from '../types';

describe('OpenCogMeshQLService', () => {
  let service: OpenCogMeshQLService;
  let config: OpenCogMeshQLConfig;
  let nodes: MeshNode[];

  beforeEach(() => {
    nodes = [
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
      {
        id: 'node3',
        endpoint: 'http://localhost:8003',
        status: NodeStatus.Offline,
        capabilities: ['EXECUTE'],
        lastHeartbeat: new Date(),
      },
    ];

    config = {
      meshId: 'test-mesh',
      nodes,
      defaultTimeout: 5000,
      heartbeatIntervalMs: 1000,
    };

    service = new OpenCogMeshQLService(config);
  });

  describe('executeQuery', () => {
    it('should execute query on active nodes', async () => {
      const query = MeshQLQueryBuilder.create()
        .operation('test_operation')
        .parameters({test: 'value'})
        .build();

      const result = await service.executeQuery(query);

      expect(result.success).toBe(true);
      expect(result.executedNodes.length).toBeGreaterThan(0);
      expect(result.executionTimeMs).toBeGreaterThan(0);
    });

    it('should execute query on specific nodes', async () => {
      const query = MeshQLQueryBuilder.create()
        .operation('test_operation')
        .nodes(['node1'])
        .build();

      const result = await service.executeQuery(query);

      expect(result.success).toBe(true);
      expect(result.executedNodes).toEqual(['node1']);
    });

    it('should handle timeout in query', async () => {
      const query = MeshQLQueryBuilder.create()
        .operation('test_operation')
        .timeout(100)
        .build();

      const result = await service.executeQuery(query);

      expect(result.success).toBe(true);
    });

    it('should return errors when no nodes are available', async () => {
      const offlineConfig: OpenCogMeshQLConfig = {
        meshId: 'test-mesh',
        nodes: nodes.map((n) => ({...n, status: NodeStatus.Offline})),
        defaultTimeout: 5000,
        heartbeatIntervalMs: 1000,
      };
      const offlineService = new OpenCogMeshQLService(offlineConfig);

      const query = MeshQLQueryBuilder.create().operation('test_operation').build();

      const result = await offlineService.executeQuery(query);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('node management', () => {
    it('should add a new node to the mesh', () => {
      const newNode: MeshNode = {
        id: 'node4',
        endpoint: 'http://localhost:8004',
        status: NodeStatus.Active,
        capabilities: ['REASON'],
        lastHeartbeat: new Date(),
      };

      service.addNode(newNode);
      const stats = service.getStats();

      expect(stats.totalNodes).toBe(4);
    });

    it('should remove a node from the mesh', () => {
      service.removeNode('node1');
      const stats = service.getStats();

      expect(stats.totalNodes).toBe(2);
    });

    it('should get active nodes', () => {
      const activeNodes = service.getActiveNodes();

      expect(activeNodes.length).toBe(2);
      expect(activeNodes.every((n) => n.status === NodeStatus.Active)).toBe(true);
    });
  });

  describe('atomspace operations', () => {
    it('should add an atom to atomspace', () => {
      const atom: Atom = {
        id: 'atom1',
        type: 'ConceptNode',
        name: 'TestConcept',
        truthValue: {strength: 0.9, confidence: 0.8},
      };

      service.addAtom(atom);
      const retrievedAtom = service.getAtom('atom1');

      expect(retrievedAtom).toEqual(atom);
    });

    it('should query atoms by type', () => {
      const atoms: Atom[] = [
        {id: 'atom1', type: 'ConceptNode', name: 'Concept1'},
        {id: 'atom2', type: 'ConceptNode', name: 'Concept2'},
        {id: 'atom3', type: 'PredicateNode', name: 'Predicate1'},
      ];

      atoms.forEach((atom) => service.addAtom(atom));
      const conceptNodes = service.queryAtomsByType('ConceptNode');

      expect(conceptNodes.length).toBe(2);
      expect(conceptNodes.every((a) => a.type === 'ConceptNode')).toBe(true);
    });

    it('should return undefined for non-existent atom', () => {
      const atom = service.getAtom('non-existent');

      expect(atom).toBeUndefined();
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const stats = service.getStats();

      expect(stats.totalNodes).toBe(3);
      expect(stats.activeNodes).toBe(2);
      expect(stats.totalAtoms).toBe(0);
    });

    it('should update statistics after adding atoms', () => {
      service.addAtom({id: 'atom1', type: 'ConceptNode'});
      service.addAtom({id: 'atom2', type: 'ConceptNode'});

      const stats = service.getStats();

      expect(stats.totalAtoms).toBe(2);
    });
  });
});
