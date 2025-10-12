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
