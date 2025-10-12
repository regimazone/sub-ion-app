import type pino from 'pino';
import {logger as defaultLogger} from '~/utils/logger.server';
import type {
  MeshNode,
  MeshQLQuery,
  MeshQLResult,
  MeshQLError,
  OpenCogMeshQLConfig,
  Atom,
} from './types';
import {NodeStatus} from './types';

/**
 * Base service for OpenCog distributed cognitive operations using meshQL
 */
export class OpenCogMeshQLService {
  private log: pino.Logger;
  private config: OpenCogMeshQLConfig;
  private nodes: Map<string, MeshNode>;
  private atomspace: Map<string, Atom>;

  constructor(config: OpenCogMeshQLConfig) {
    this.config = config;
    this.log = (config.logger || defaultLogger).child({
      service: 'OpenCogMeshQLService',
      meshId: config.meshId,
    });
    this.nodes = new Map(config.nodes.map((node) => [node.id, node]));
    this.atomspace = new Map();
  }

  /**
   * Execute a meshQL query across the distributed mesh
   */
  async executeQuery<T = unknown>(query: MeshQLQuery): Promise<MeshQLResult<T>> {
    const startTime = Date.now();
    const executedNodes: string[] = [];
    const errors: MeshQLError[] = [];

    this.log.info({query}, 'Executing meshQL query');

    try {
      // Determine target nodes
      const targetNodes = query.nodes
        ? query.nodes.map((id) => this.nodes.get(id)).filter(Boolean)
        : Array.from(this.nodes.values()).filter(
            (node) => node.status === NodeStatus.Active || node.status === NodeStatus.Idle,
          );

      if (targetNodes.length === 0) {
        throw new Error('No available nodes to execute query');
      }

      // Execute query on each node
      const results = await Promise.allSettled(
        (targetNodes as MeshNode[]).map(async (node) => {
          executedNodes.push(node.id);
          return this.executeOnNode(node, query);
        }),
      );

      // Collect results and errors
      const successfulResults: unknown[] = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulResults.push(result.value);
        } else {
          errors.push({
            nodeId: targetNodes[index]!.id,
            message: result.reason?.message || 'Unknown error',
            timestamp: new Date(),
          });
        }
      });

      const executionTimeMs = Date.now() - startTime;

      if (errors.length > 0 && successfulResults.length === 0) {
        this.log.error({errors, executionTimeMs}, 'All nodes failed to execute query');
        return {
          success: false,
          errors,
          executedNodes,
          executionTimeMs,
        };
      }

      this.log.info(
        {executedNodes, executionTimeMs},
        'Successfully executed meshQL query',
      );

      return {
        success: true,
        data: successfulResults as T,
        errors: errors.length > 0 ? errors : undefined,
        executedNodes,
        executionTimeMs,
      };
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.log.error({error, executionTimeMs}, 'Failed to execute meshQL query');

      return {
        success: false,
        errors: [
          {
            nodeId: 'coordinator',
            message: errorMessage,
            timestamp: new Date(),
          },
        ],
        executedNodes,
        executionTimeMs,
      };
    }
  }

  /**
   * Execute query on a specific node
   */
  private async executeOnNode(node: MeshNode, query: MeshQLQuery): Promise<unknown> {
    this.log.debug({nodeId: node.id, query}, 'Executing query on node');

    // Update node status
    node.status = NodeStatus.Busy;

    try {
      // Simulate execution with timeout
      const timeout = query.timeout || this.config.defaultTimeout;
      const result = await this.executeWithTimeout(
        () => this.performOperation(node, query),
        timeout,
      );

      node.status = NodeStatus.Active;
      return result;
    } catch (error) {
      node.status = NodeStatus.Active;
      throw error;
    }
  }

  /**
   * Perform the actual operation on a node
   */
  private async performOperation(
    node: MeshNode,
    query: MeshQLQuery,
  ): Promise<unknown> {
    // This is where the actual cognitive operation would be performed
    // For now, return a simulated result
    return {
      nodeId: node.id,
      operation: query.operation,
      result: 'Operation completed',
      parameters: query.parameters,
    };
  }

  /**
   * Execute a function with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timeout')), timeoutMs),
      ),
    ]);
  }

  /**
   * Add a node to the mesh
   */
  addNode(node: MeshNode): void {
    this.log.info({nodeId: node.id}, 'Adding node to mesh');
    this.nodes.set(node.id, node);
  }

  /**
   * Remove a node from the mesh
   */
  removeNode(nodeId: string): void {
    this.log.info({nodeId}, 'Removing node from mesh');
    this.nodes.delete(nodeId);
  }

  /**
   * Get all active nodes
   */
  getActiveNodes(): MeshNode[] {
    return Array.from(this.nodes.values()).filter(
      (node) => node.status === NodeStatus.Active,
    );
  }

  /**
   * Add an atom to the distributed atomspace
   */
  addAtom(atom: Atom): void {
    this.log.debug({atomId: atom.id}, 'Adding atom to atomspace');
    this.atomspace.set(atom.id, atom);
  }

  /**
   * Get an atom from the atomspace
   */
  getAtom(atomId: string): Atom | undefined {
    return this.atomspace.get(atomId);
  }

  /**
   * Query atoms by type
   */
  queryAtomsByType(type: string): Atom[] {
    return Array.from(this.atomspace.values()).filter((atom) => atom.type === type);
  }

  /**
   * Get mesh statistics
   */
  getStats(): {
    totalNodes: number;
    activeNodes: number;
    totalAtoms: number;
  } {
    return {
      totalNodes: this.nodes.size,
      activeNodes: this.getActiveNodes().length,
      totalAtoms: this.atomspace.size,
    };
  }
}
