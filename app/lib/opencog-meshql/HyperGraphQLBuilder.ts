import type {
  HyperGraphQLQuery,
  AtomPattern,
  HyperGraphFilter,
  LinkType,
} from './types';

/**
 * Builder for constructing HyperGraphQL queries to traverse and query the hypergraph
 */
export class HyperGraphQLBuilder {
  private query: Partial<HyperGraphQLQuery> = {};

  /**
   * Set the operation type
   */
  operation(op: 'traverse' | 'match' | 'find'): this {
    this.query.operation = op;
    return this;
  }

  /**
   * Set the starting atom for traversal
   */
  startFrom(atomId: string): this {
    this.query.startAtomId = atomId;
    return this;
  }

  /**
   * Set traversal direction
   */
  direction(dir: 'incoming' | 'outgoing' | 'both'): this {
    this.query.direction = dir;
    return this;
  }

  /**
   * Set maximum traversal depth
   */
  depth(d: number): this {
    this.query.depth = d;
    return this;
  }

  /**
   * Add a pattern to match
   */
  pattern(p: AtomPattern): this {
    this.query.pattern = p;
    return this;
  }

  /**
   * Add a filter to the query
   */
  filter(filter: HyperGraphFilter): this {
    if (!this.query.filters) {
      this.query.filters = [];
    }
    this.query.filters.push(filter);
    return this;
  }

  /**
   * Build the final query
   */
  build(): HyperGraphQLQuery {
    if (!this.query.operation) {
      throw new Error('Operation is required for HyperGraphQL query');
    }

    return {
      operation: this.query.operation,
      pattern: this.query.pattern,
      startAtomId: this.query.startAtomId,
      direction: this.query.direction || 'both',
      depth: this.query.depth || 1,
      filters: this.query.filters,
    };
  }

  /**
   * Create a new builder instance
   */
  static create(): HyperGraphQLBuilder {
    return new HyperGraphQLBuilder();
  }

  /**
   * Create a pattern for matching atoms
   */
  static pattern(config: {
    type?: string;
    name?: string;
    linkType?: LinkType;
    outgoing?: AtomPattern[];
  }): AtomPattern {
    return {
      type: config.type,
      name: config.name,
      linkType: config.linkType,
      outgoing: config.outgoing,
    };
  }
}
