import { describe, it, expect } from 'vitest';
import {
  defineEntity,
  defineEndpoint,
  defineScreen,
  defineComponent,
  defineWorkflow,
  defineAuth,
  delegateToAgent,
  allBlockTools,
  orchestratorTools,
  userInterviewTools,
  uxDesignTools,
  backendDatabaseTools,
  backendApiTools,
  backendLogicTools,
  backendInfraTools,
} from '../block-tools';

describe('Block Tools', () => {
  describe('Data Layer Tools', () => {
    it('defineEntity has correct schema', () => {
      expect(defineEntity.name).toBe('define_entity');
      expect(defineEntity.input_schema.required).toContain('name');
      expect(defineEntity.input_schema.required).toContain('fields');
      expect(defineEntity.input_schema.required).toContain('tableName');
    });
  });

  describe('API Layer Tools', () => {
    it('defineEndpoint has correct schema', () => {
      expect(defineEndpoint.name).toBe('define_endpoint');
      expect(defineEndpoint.input_schema.properties.method.enum).toContain('GET');
      expect(defineEndpoint.input_schema.properties.method.enum).toContain('POST');
      expect(defineEndpoint.input_schema.required).toContain('path');
      expect(defineEndpoint.input_schema.required).toContain('auth');
    });
  });

  describe('UX Layer Tools', () => {
    it('defineScreen has correct schema', () => {
      expect(defineScreen.name).toBe('define_screen');
      expect(defineScreen.input_schema.required).toContain('name');
      expect(defineScreen.input_schema.required).toContain('route');
      expect(defineScreen.input_schema.required).toContain('regions');
    });

    it('defineComponent has correct schema', () => {
      expect(defineComponent.name).toBe('define_component');
      expect(defineComponent.input_schema.required).toContain('name');
      expect(defineComponent.input_schema.required).toContain('props');
      expect(defineComponent.input_schema.required).toContain('layout');
    });
  });

  describe('Workflow Layer Tools', () => {
    it('defineWorkflow has correct schema', () => {
      expect(defineWorkflow.name).toBe('define_workflow');
      expect(defineWorkflow.input_schema.required).toContain('trigger');
      expect(defineWorkflow.input_schema.required).toContain('steps');
    });
  });

  describe('Infrastructure Layer Tools', () => {
    it('defineAuth has correct schema', () => {
      expect(defineAuth.name).toBe('define_auth');
      expect(defineAuth.input_schema.properties.provider.enum).toContain('clerk');
      expect(defineAuth.input_schema.required).toContain('methods');
    });
  });

  describe('Orchestration Tools', () => {
    it('delegateToAgent has correct schema', () => {
      expect(delegateToAgent.name).toBe('delegate_to_agent');
      expect(delegateToAgent.input_schema.properties.agent.enum).toContain('user-interview');
      expect(delegateToAgent.input_schema.properties.agent.enum).toContain('principal-developer');
      expect(delegateToAgent.input_schema.required).toContain('task');
    });
  });

  describe('Tool Collections', () => {
    it('orchestratorTools has 4 tools', () => {
      expect(orchestratorTools.length).toBe(4);
    });

    it('userInterviewTools has 3 tools', () => {
      expect(userInterviewTools.length).toBe(3);
    });

    it('uxDesignTools has 4 tools', () => {
      expect(uxDesignTools.length).toBe(4);
    });

    it('backendDatabaseTools has 4 tools', () => {
      expect(backendDatabaseTools.length).toBe(4);
    });

    it('backendApiTools has 1 tool', () => {
      expect(backendApiTools.length).toBe(1);
    });

    it('backendLogicTools has 1 tool', () => {
      expect(backendLogicTools.length).toBe(1);
    });

    it('backendInfraTools has 3 tools', () => {
      expect(backendInfraTools.length).toBe(3);
    });

    it('allBlockTools has all expected tools', () => {
      const expectedTools = [
        'define_entity',
        'define_relationship',
        'define_endpoint',
        'define_workflow',
        'define_screen',
        'define_component',
        'define_auth',
        'delegate_to_agent',
        'finalize_spec',
      ];

      for (const tool of expectedTools) {
        expect(allBlockTools[tool as keyof typeof allBlockTools]).toBeDefined();
      }
    });
  });
});
