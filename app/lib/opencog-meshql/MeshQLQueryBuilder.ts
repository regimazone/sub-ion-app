import type {MeshQLQuery, RetryPolicy} from './types';

/**
 * Builder for constructing meshQL queries
 */
export class MeshQLQueryBuilder {
  private query: Partial<MeshQLQuery> = {};

  /**
   * Set the operation for the query
   */
  operation(op: string): this {
    this.query.operation = op;
    return this;
  }

  /**
   * Specify which nodes should execute the query
   */
  nodes(nodeIds: string[]): this {
    this.query.nodes = nodeIds;
    return this;
  }

  /**
   * Add parameters to the query
   */
  parameters(params: Record<string, unknown>): this {
    this.query.parameters = {...this.query.parameters, ...params};
    return this;
  }

  /**
   * Set timeout for query execution
   */
  timeout(ms: number): this {
    this.query.timeout = ms;
    return this;
  }

  /**
   * Configure retry policy
   */
  retry(policy: RetryPolicy): this {
    this.query.retryPolicy = policy;
    return this;
  }

  /**
   * Build the final query
   */
  build(): MeshQLQuery {
    if (!this.query.operation) {
      throw new Error('Operation is required for meshQL query');
    }

    return {
      operation: this.query.operation,
      nodes: this.query.nodes,
      parameters: this.query.parameters || {},
      timeout: this.query.timeout,
      retryPolicy: this.query.retryPolicy,
    };
  }

  /**
   * Create a new builder instance
   */
  static create(): MeshQLQueryBuilder {
    return new MeshQLQueryBuilder();
  }
}
