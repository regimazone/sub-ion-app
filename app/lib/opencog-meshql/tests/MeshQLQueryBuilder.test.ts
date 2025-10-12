import {describe, expect, it} from 'vitest';
import {MeshQLQueryBuilder} from '../MeshQLQueryBuilder';

describe('MeshQLQueryBuilder', () => {
  it('should build a basic query with operation', () => {
    const query = MeshQLQueryBuilder.create().operation('test_operation').build();

    expect(query.operation).toBe('test_operation');
    expect(query.parameters).toEqual({});
  });

  it('should build a query with nodes', () => {
    const nodeIds = ['node1', 'node2', 'node3'];
    const query = MeshQLQueryBuilder.create()
      .operation('test_operation')
      .nodes(nodeIds)
      .build();

    expect(query.nodes).toEqual(nodeIds);
  });

  it('should build a query with parameters', () => {
    const params = {key1: 'value1', key2: 42};
    const query = MeshQLQueryBuilder.create()
      .operation('test_operation')
      .parameters(params)
      .build();

    expect(query.parameters).toEqual(params);
  });

  it('should build a query with timeout', () => {
    const query = MeshQLQueryBuilder.create()
      .operation('test_operation')
      .timeout(5000)
      .build();

    expect(query.timeout).toBe(5000);
  });

  it('should build a query with retry policy', () => {
    const retryPolicy = {
      maxAttempts: 3,
      backoffMs: 1000,
      backoffMultiplier: 2,
    };
    const query = MeshQLQueryBuilder.create()
      .operation('test_operation')
      .retry(retryPolicy)
      .build();

    expect(query.retryPolicy).toEqual(retryPolicy);
  });

  it('should build a complete query with all options', () => {
    const query = MeshQLQueryBuilder.create()
      .operation('complex_operation')
      .nodes(['node1', 'node2'])
      .parameters({param1: 'value1'})
      .timeout(10000)
      .retry({maxAttempts: 3, backoffMs: 1000, backoffMultiplier: 2})
      .build();

    expect(query.operation).toBe('complex_operation');
    expect(query.nodes).toEqual(['node1', 'node2']);
    expect(query.parameters).toEqual({param1: 'value1'});
    expect(query.timeout).toBe(10000);
    expect(query.retryPolicy).toEqual({
      maxAttempts: 3,
      backoffMs: 1000,
      backoffMultiplier: 2,
    });
  });

  it('should throw error when building without operation', () => {
    const builder = MeshQLQueryBuilder.create();

    expect(() => builder.build()).toThrow('Operation is required for meshQL query');
  });

  it('should merge parameters when called multiple times', () => {
    const query = MeshQLQueryBuilder.create()
      .operation('test_operation')
      .parameters({key1: 'value1'})
      .parameters({key2: 'value2'})
      .build();

    expect(query.parameters).toEqual({key1: 'value1', key2: 'value2'});
  });
});
