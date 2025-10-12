import type pino from 'pino';
import {logger as defaultLogger} from '~/utils/logger.server';
import type {
  MeshNode,
  MeshQLQuery,
  MeshQLResult,
  MeshQLError,
  OpenCogMeshQLConfig,
  Atom,
  Link,
  HyperGraphQLQuery,
  HyperGraphQLResult,
  AtomPattern,
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
  private links: Map<string, Link>;
  private incomingIndex: Map<string, Set<string>>; // atomId -> Set of link IDs pointing to it
  private outgoingIndex: Map<string, Set<string>>; // atomId -> Set of link IDs from it

  constructor(config: OpenCogMeshQLConfig) {
    this.config = config;
    this.log = (config.logger || defaultLogger).child({
      service: 'OpenCogMeshQLService',
      meshId: config.meshId,
    });
    this.nodes = new Map(config.nodes.map((node) => [node.id, node]));
    this.atomspace = new Map();
    this.links = new Map();
    this.incomingIndex = new Map();
    this.outgoingIndex = new Map();
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
    totalLinks: number;
  } {
    return {
      totalNodes: this.nodes.size,
      activeNodes: this.getActiveNodes().length,
      totalAtoms: this.atomspace.size,
      totalLinks: this.links.size,
    };
  }

  /**
   * Add a link to the hypergraph
   */
  addLink(link: Link): void {
    this.log.debug({linkId: link.id, outgoing: link.outgoing}, 'Adding link to hypergraph');
    
    // Add to links map
    this.links.set(link.id, link);
    
    // Update indices
    for (const atomId of link.outgoing) {
      // Update incoming index for target atoms
      if (!this.incomingIndex.has(atomId)) {
        this.incomingIndex.set(atomId, new Set());
      }
      this.incomingIndex.get(atomId)!.add(link.id);
      
      // Update outgoing index
      if (!this.outgoingIndex.has(atomId)) {
        this.outgoingIndex.set(atomId, new Set());
      }
      this.outgoingIndex.get(atomId)!.add(link.id);
    }
  }

  /**
   * Get a link by ID
   */
  getLink(linkId: string): Link | undefined {
    return this.links.get(linkId);
  }

  /**
   * Get all incoming links to an atom
   */
  getIncomingLinks(atomId: string): Link[] {
    const linkIds = this.incomingIndex.get(atomId);
    if (!linkIds) return [];
    
    return Array.from(linkIds)
      .map((id) => this.links.get(id))
      .filter((link): link is Link => link !== undefined);
  }

  /**
   * Get all outgoing links from an atom
   */
  getOutgoingLinks(atomId: string): Link[] {
    const linkIds = this.outgoingIndex.get(atomId);
    if (!linkIds) return [];
    
    return Array.from(linkIds)
      .map((id) => this.links.get(id))
      .filter((link): link is Link => link !== undefined);
  }

  /**
   * Execute a HyperGraphQL query to traverse and query the hypergraph
   */
  executeHyperGraphQuery(query: HyperGraphQLQuery): HyperGraphQLResult {
    this.log.info({query}, 'Executing HyperGraphQL query');

    switch (query.operation) {
      case 'traverse':
        return this.traverseGraph(query);
      case 'match':
        return this.matchPattern(query);
      case 'find':
        return this.findAtoms(query);
      default:
        throw new Error(`Unknown HyperGraphQL operation: ${query.operation}`);
    }
  }

  /**
   * Traverse the hypergraph from a starting atom
   */
  private traverseGraph(query: HyperGraphQLQuery): HyperGraphQLResult {
    if (!query.startAtomId) {
      throw new Error('startAtomId is required for traverse operation');
    }

    const visited = new Set<string>();
    const atoms: Atom[] = [];
    const links: Link[] = [];
    const queue: Array<{atomId: string; depth: number}> = [
      {atomId: query.startAtomId, depth: 0},
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (visited.has(current.atomId) || current.depth > (query.depth || 1)) {
        continue;
      }

      visited.add(current.atomId);
      
      const atom = this.getAtom(current.atomId);
      if (atom) {
        atoms.push(atom);
      }

      if (current.depth < (query.depth || 1)) {
        const nextLinks: Link[] = [];
        
        if (query.direction === 'incoming' || query.direction === 'both') {
          nextLinks.push(...this.getIncomingLinks(current.atomId));
        }
        
        if (query.direction === 'outgoing' || query.direction === 'both') {
          nextLinks.push(...this.getOutgoingLinks(current.atomId));
        }

        for (const link of nextLinks) {
          if (!visited.has(link.id)) {
            links.push(link);
            visited.add(link.id);
            
            // Add connected atoms to queue
            for (const connectedId of link.outgoing) {
              if (!visited.has(connectedId)) {
                queue.push({atomId: connectedId, depth: current.depth + 1});
              }
            }
          }
        }
      }
    }

    return {atoms, links};
  }

  /**
   * Match a pattern in the hypergraph
   */
  private matchPattern(query: HyperGraphQLQuery): HyperGraphQLResult {
    if (!query.pattern) {
      throw new Error('pattern is required for match operation');
    }

    const atoms: Atom[] = [];
    const links: Link[] = [];

    // Simple pattern matching implementation
    for (const atom of this.atomspace.values()) {
      if (this.matchesPattern(atom, query.pattern)) {
        atoms.push(atom);
      }
    }

    for (const link of this.links.values()) {
      if (this.matchesPattern(link, query.pattern)) {
        links.push(link);
      }
    }

    return {atoms, links};
  }

  /**
   * Find atoms based on filters
   */
  private findAtoms(query: HyperGraphQLQuery): HyperGraphQLResult {
    const atoms: Atom[] = [];
    const links: Link[] = [];

    for (const atom of this.atomspace.values()) {
      if (this.matchesFilters(atom, query.filters || [])) {
        atoms.push(atom);
      }
    }

    for (const link of this.links.values()) {
      if (this.matchesFilters(link, query.filters || [])) {
        links.push(link);
      }
    }

    return {atoms, links};
  }

  /**
   * Check if an atom matches a pattern
   */
  private matchesPattern(atom: Atom, pattern: AtomPattern): boolean {
    if (pattern.type && atom.type !== pattern.type) {
      return false;
    }

    if (pattern.name && atom.name !== pattern.name) {
      return false;
    }

    if (pattern.truthValueMin && (!atom.truthValue || atom.truthValue.strength < pattern.truthValueMin)) {
      return false;
    }

    if (pattern.attentionMin && (!atom.attentionValue || atom.attentionValue.sti < pattern.attentionMin)) {
      return false;
    }

    return true;
  }

  /**
   * Check if an atom matches filters
   */
  private matchesFilters(atom: Atom, filters: Array<{field: string; operator: string; value: unknown}>): boolean {
    for (const filter of filters) {
      if (filter.field === 'type' && filter.operator === 'equals') {
        if (atom.type !== filter.value) return false;
      } else if (filter.field === 'name' && filter.operator === 'equals') {
        if (atom.name !== filter.value) return false;
      } else if (filter.field === 'name' && filter.operator === 'contains') {
        if (!atom.name || !atom.name.includes(String(filter.value))) return false;
      }
    }
    return true;
  }
}
