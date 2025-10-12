import {describe, expect, it} from 'vitest';
import {HyperGraphQLBuilder} from '../HyperGraphQLBuilder';
import {LinkType} from '../types';

describe('HyperGraphQLBuilder', () => {
  it('should build a basic traverse query', () => {
    const query = HyperGraphQLBuilder.create()
      .operation('traverse')
      .startFrom('atom-1')
      .build();

    expect(query.operation).toBe('traverse');
    expect(query.startAtomId).toBe('atom-1');
    expect(query.direction).toBe('both');
    expect(query.depth).toBe(1);
  });

  it('should build a query with custom direction', () => {
    const query = HyperGraphQLBuilder.create()
      .operation('traverse')
      .startFrom('atom-1')
      .direction('incoming')
      .build();

    expect(query.direction).toBe('incoming');
  });

  it('should build a query with custom depth', () => {
    const query = HyperGraphQLBuilder.create()
      .operation('traverse')
      .startFrom('atom-1')
      .depth(3)
      .build();

    expect(query.depth).toBe(3);
  });

  it('should build a match query with pattern', () => {
    const pattern = HyperGraphQLBuilder.pattern({
      type: 'ConceptNode',
      name: 'Subscription',
    });

    const query = HyperGraphQLBuilder.create()
      .operation('match')
      .pattern(pattern)
      .build();

    expect(query.operation).toBe('match');
    expect(query.pattern).toEqual({
      type: 'ConceptNode',
      name: 'Subscription',
    });
  });

  it('should build a find query with filters', () => {
    const query = HyperGraphQLBuilder.create()
      .operation('find')
      .filter({
        field: 'type',
        operator: 'equals',
        value: 'ConceptNode',
      })
      .filter({
        field: 'name',
        operator: 'contains',
        value: 'Test',
      })
      .build();

    expect(query.operation).toBe('find');
    expect(query.filters).toHaveLength(2);
    expect(query.filters![0].field).toBe('type');
    expect(query.filters![1].field).toBe('name');
  });

  it('should build a complex query with all options', () => {
    const pattern = HyperGraphQLBuilder.pattern({
      type: 'InheritanceLink',
      linkType: LinkType.InheritanceLink,
    });

    const query = HyperGraphQLBuilder.create()
      .operation('traverse')
      .startFrom('root-atom')
      .direction('outgoing')
      .depth(5)
      .pattern(pattern)
      .filter({
        field: 'type',
        operator: 'equals',
        value: 'InheritanceLink',
      })
      .build();

    expect(query.operation).toBe('traverse');
    expect(query.startAtomId).toBe('root-atom');
    expect(query.direction).toBe('outgoing');
    expect(query.depth).toBe(5);
    expect(query.pattern).toBeDefined();
    expect(query.filters).toHaveLength(1);
  });

  it('should throw error when building without operation', () => {
    const builder = HyperGraphQLBuilder.create();

    expect(() => builder.build()).toThrow('Operation is required for HyperGraphQL query');
  });

  it('should create pattern with link type', () => {
    const pattern = HyperGraphQLBuilder.pattern({
      linkType: LinkType.EvaluationLink,
      type: 'EvaluationLink',
    });

    expect(pattern.linkType).toBe(LinkType.EvaluationLink);
    expect(pattern.type).toBe('EvaluationLink');
  });

  it('should create pattern with outgoing atoms', () => {
    const innerPattern = HyperGraphQLBuilder.pattern({
      type: 'ConceptNode',
      name: 'Child',
    });

    const pattern = HyperGraphQLBuilder.pattern({
      type: 'InheritanceLink',
      outgoing: [innerPattern],
    });

    expect(pattern.outgoing).toHaveLength(1);
    expect(pattern.outgoing![0].type).toBe('ConceptNode');
  });
});
