import type {Logger} from 'pino';

/**
 * Represents a node in the distributed OpenCog mesh
 */
export interface MeshNode {
  id: string;
  endpoint: string;
  status: NodeStatus;
  capabilities: string[];
  lastHeartbeat: Date;
}

/**
 * Node status in the mesh
 */
export enum NodeStatus {
  Active = 'ACTIVE',
  Idle = 'IDLE',
  Busy = 'BUSY',
  Offline = 'OFFLINE',
}

/**
 * A distributed query in meshQL format
 */
export interface MeshQLQuery {
  operation: string;
  nodes?: string[];
  parameters?: Record<string, unknown>;
  timeout?: number;
  retryPolicy?: RetryPolicy;
}

/**
 * Retry policy for meshQL operations
 */
export interface RetryPolicy {
  maxAttempts: number;
  backoffMs: number;
  backoffMultiplier: number;
}

/**
 * Result of a meshQL query execution
 */
export interface MeshQLResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: MeshQLError[];
  executedNodes: string[];
  executionTimeMs: number;
}

/**
 * Error from meshQL execution
 */
export interface MeshQLError {
  nodeId: string;
  message: string;
  code?: string;
  timestamp: Date;
}

/**
 * Configuration for OpenCog meshQL service
 */
export interface OpenCogMeshQLConfig {
  meshId: string;
  nodes: MeshNode[];
  defaultTimeout: number;
  heartbeatIntervalMs: number;
  logger?: Logger;
}

/**
 * Cognitive operation types supported by OpenCog
 */
export enum CognitiveOperation {
  Perceive = 'PERCEIVE',
  Reason = 'REASON',
  Learn = 'LEARN',
  Plan = 'PLAN',
  Execute = 'EXECUTE',
}

/**
 * Atom representation in OpenCog atomspace
 */
export interface Atom {
  id: string;
  type: string;
  name?: string;
  truthValue?: TruthValue;
  attentionValue?: AttentionValue;
}

/**
 * Truth value for probabilistic reasoning
 */
export interface TruthValue {
  strength: number;
  confidence: number;
}

/**
 * Attention value for focus management
 */
export interface AttentionValue {
  sti: number; // Short-term importance
  lti: number; // Long-term importance
  vlti: number; // Very long-term importance
}

/**
 * Link representation in OpenCog hypergraph (hyperedge)
 * Links connect atoms to form relationships
 */
export interface Link extends Atom {
  outgoing: string[]; // Array of atom IDs that this link connects
}

/**
 * Common link types in OpenCog hypergraph
 */
export enum LinkType {
  InheritanceLink = 'InheritanceLink',
  SimilarityLink = 'SimilarityLink',
  EvaluationLink = 'EvaluationLink',
  ImplicationLink = 'ImplicationLink',
  ListLink = 'ListLink',
  ExecutionLink = 'ExecutionLink',
  MemberLink = 'MemberLink',
  SubsetLink = 'SubsetLink',
}

/**
 * HyperGraphQL query for traversing the hypergraph
 */
export interface HyperGraphQLQuery {
  operation: 'traverse' | 'match' | 'find';
  pattern?: AtomPattern;
  startAtomId?: string;
  direction?: 'incoming' | 'outgoing' | 'both';
  depth?: number;
  filters?: HyperGraphFilter[];
}

/**
 * Pattern for matching atoms in the hypergraph
 */
export interface AtomPattern {
  type?: string;
  name?: string;
  linkType?: LinkType;
  outgoing?: AtomPattern[];
  truthValueMin?: number;
  attentionMin?: number;
}

/**
 * Filter for hypergraph queries
 */
export interface HyperGraphFilter {
  field: 'type' | 'name' | 'truthValue' | 'attentionValue';
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan';
  value: unknown;
}

/**
 * Result of a HyperGraphQL query
 */
export interface HyperGraphQLResult {
  atoms: Atom[];
  links: Link[];
  paths?: AtomPath[];
}

/**
 * Path through the hypergraph
 */
export interface AtomPath {
  atoms: string[]; // Ordered array of atom IDs
  links: string[]; // Links connecting the atoms
}

/**
 * Help article from the help center
 */
export interface HelpArticle {
  id: string;
  categoryId: string;
  title: string;
  content: string;
  url: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Help category
 */
export interface HelpCategory {
  id: string;
  name: string;
  description: string;
  order: number;
}

/**
 * Help section
 */
export interface HelpSection {
  id: string;
  categoryId: string;
  name: string;
  articles: HelpArticle[];
}

/**
 * Knowledge graph statistics
 */
export interface KnowledgeGraphStats {
  totalAtoms: number;
  totalLinks: number;
  categories: number;
  articles: number;
  tags: number;
  lastSync?: Date;
}
