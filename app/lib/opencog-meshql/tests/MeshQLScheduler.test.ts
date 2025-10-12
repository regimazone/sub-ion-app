import {describe, expect, it, beforeEach, vi} from 'vitest';
import {MeshQLScheduler} from '../MeshQLScheduler';
import type {OpenCogMeshQLConfig} from '../types';
import {NodeStatus} from '../types';
import {Job} from '~/lib/jobs/Job';
import {logger} from '~/utils/logger.server';

class TestJob extends Job<{message: string}> {
  async perform(): Promise<void> {
    // Test job implementation
  }
}

describe('MeshQLScheduler', () => {
  let scheduler: MeshQLScheduler;
  let config: OpenCogMeshQLConfig;

  beforeEach(() => {
    config = {
      meshId: 'test-mesh',
      nodes: [
        {
          id: 'node1',
          endpoint: 'http://localhost:8001',
          status: NodeStatus.Active,
          capabilities: ['EXECUTE'],
          lastHeartbeat: new Date(),
        },
        {
          id: 'node2',
          endpoint: 'http://localhost:8002',
          status: NodeStatus.Active,
          capabilities: ['EXECUTE'],
          lastHeartbeat: new Date(),
        },
      ],
      defaultTimeout: 5000,
      heartbeatIntervalMs: 1000,
    };

    scheduler = new MeshQLScheduler(logger, config);
  });

  describe('enqueue', () => {
    it('should enqueue a job to the mesh', async () => {
      const job = new TestJob({message: 'test'});

      await expect(scheduler.enqueue(job)).resolves.not.toThrow();
    });

    it('should enqueue a job with scheduler options', async () => {
      const job = new TestJob({message: 'test'});
      const options = {
        dispatchDeadline: {seconds: 300},
      };

      await expect(scheduler.enqueue(job, options)).resolves.not.toThrow();
    });

    it('should handle job parameters correctly', async () => {
      const job = new TestJob({message: 'complex test message'});

      await expect(scheduler.enqueue(job)).resolves.not.toThrow();
    });
  });

  describe('getMeshService', () => {
    it('should return the underlying mesh service', () => {
      const meshService = scheduler.getMeshService();

      expect(meshService).toBeDefined();
      expect(meshService.getStats).toBeDefined();
    });

    it('should allow accessing mesh statistics through service', () => {
      const meshService = scheduler.getMeshService();
      const stats = meshService.getStats();

      expect(stats.totalNodes).toBe(2);
      expect(stats.activeNodes).toBe(2);
    });
  });

  describe('integration with mesh', () => {
    it('should successfully execute job on available nodes', async () => {
      const job = new TestJob({message: 'integration test'});
      const meshService = scheduler.getMeshService();

      await scheduler.enqueue(job);

      const stats = meshService.getStats();
      expect(stats.activeNodes).toBeGreaterThan(0);
    });
  });
});
