import type {Logger} from 'pino';
import type {Job} from '~/lib/jobs';
import {Scheduler, type SchedulerOptions} from '~/lib/jobs/schedulers/Scheduler';
import {OpenCogMeshQLService} from './OpenCogMeshQLService';
import {MeshQLQueryBuilder} from './MeshQLQueryBuilder';
import type {OpenCogMeshQLConfig} from './types';

/**
 * Scheduler that distributes jobs across OpenCog mesh nodes using meshQL
 */
export class MeshQLScheduler extends Scheduler<void> {
  private meshService: OpenCogMeshQLService;

  constructor(logger: Logger, config: OpenCogMeshQLConfig) {
    super(logger);
    this.meshService = new OpenCogMeshQLService(config);
    this.logger.info({config}, 'Initialized MeshQLScheduler');
  }

  /**
   * Enqueue a job to be executed on the distributed mesh
   */
  async enqueue(job: Job, options: SchedulerOptions = {}): Promise<void> {
    this.logger.info({job, options}, 'Enqueuing job to meshQL');

    try {
      // Build a meshQL query for the job
      const query = MeshQLQueryBuilder.create()
        .operation(`execute_job:${job.jobName}`)
        .parameters({
          jobName: job.jobName,
          parameters: job.parameters,
          queue: job.queue,
        })
        .timeout(options.dispatchDeadline?.seconds ? options.dispatchDeadline.seconds * 1000 : 600000)
        .build();

      // Execute the query on the mesh
      const result = await this.meshService.executeQuery(query);

      if (!result.success) {
        const errorMessages = result.errors?.map((e) => e.message).join(', ');
        throw new Error(`Failed to execute job on mesh: ${errorMessages}`);
      }

      this.logger.info(
        {
          jobName: job.jobName,
          executedNodes: result.executedNodes,
          executionTimeMs: result.executionTimeMs,
        },
        'Successfully executed job on mesh',
      );
    } catch (error) {
      this.logger.error({error, job}, 'Failed to enqueue job to meshQL');
      throw error;
    }
  }

  /**
   * Get the underlying mesh service for advanced operations
   */
  getMeshService(): OpenCogMeshQLService {
    return this.meshService;
  }
}
