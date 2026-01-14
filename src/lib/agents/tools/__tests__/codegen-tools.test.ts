import { describe, it, expect } from 'vitest';
import {
  delegateCodegen,
  validateCode,
  finalizeProject,
  generateFile,
  generateSchema,
  generateApi,
  generateComponent,
  generatePage,
  connectComponents,
  fixImports,
  codeOrchestratorTools,
  schemaGeneratorTools,
  apiGeneratorTools,
  componentGeneratorTools,
  integrationAgentTools,
  allCodegenTools,
} from '../codegen-tools';

describe('Code Generation Tools', () => {
  describe('Code Orchestrator Tools', () => {
    it('delegateCodegen has correct schema', () => {
      expect(delegateCodegen.name).toBe('delegate_codegen');
      expect(delegateCodegen.input_schema.properties.agent.enum).toContain('schema-generator');
      expect(delegateCodegen.input_schema.properties.agent.enum).toContain('api-generator');
      expect(delegateCodegen.input_schema.properties.agent.enum).toContain('component-generator');
      expect(delegateCodegen.input_schema.properties.agent.enum).toContain('integration-agent');
      expect(delegateCodegen.input_schema.required).toContain('agent');
      expect(delegateCodegen.input_schema.required).toContain('task');
    });

    it('validateCode has correct schema', () => {
      expect(validateCode.name).toBe('validate_code');
      expect(validateCode.input_schema.properties.checkTypes).toBeDefined();
      expect(validateCode.input_schema.properties.checkImports).toBeDefined();
      expect(validateCode.input_schema.required).toContain('files');
    });

    it('finalizeProject has correct schema', () => {
      expect(finalizeProject.name).toBe('finalize_project');
      expect(finalizeProject.input_schema.properties.projectName).toBeDefined();
      expect(finalizeProject.input_schema.properties.includeReadme).toBeDefined();
      expect(finalizeProject.input_schema.required).toContain('projectName');
    });
  });

  describe('File Generation Tools', () => {
    it('generateFile has correct schema', () => {
      expect(generateFile.name).toBe('generate_file');
      expect(generateFile.input_schema.properties.path).toBeDefined();
      expect(generateFile.input_schema.properties.content).toBeDefined();
      expect(generateFile.input_schema.required).toContain('path');
      expect(generateFile.input_schema.required).toContain('content');
    });
  });

  describe('Schema Generator Tools', () => {
    it('generateSchema has correct schema', () => {
      expect(generateSchema.name).toBe('generate_schema');
      expect(generateSchema.input_schema.properties.entities).toBeDefined();
      expect(generateSchema.input_schema.properties.relationships).toBeDefined();
      expect(generateSchema.input_schema.properties.indexes).toBeDefined();
      expect(generateSchema.input_schema.required).toContain('entities');
    });
  });

  describe('API Generator Tools', () => {
    it('generateApi has correct schema', () => {
      expect(generateApi.name).toBe('generate_api');
      expect(generateApi.input_schema.properties.tableName).toBeDefined();
      expect(generateApi.input_schema.properties.endpoints).toBeDefined();
      expect(generateApi.input_schema.required).toContain('tableName');
      expect(generateApi.input_schema.required).toContain('endpoints');
    });
  });

  describe('Component Generator Tools', () => {
    it('generateComponent has correct schema', () => {
      expect(generateComponent.name).toBe('generate_component');
      expect(generateComponent.input_schema.properties.name).toBeDefined();
      expect(generateComponent.input_schema.properties.props).toBeDefined();
      expect(generateComponent.input_schema.properties.convexQueries).toBeDefined();
      expect(generateComponent.input_schema.required).toContain('name');
      expect(generateComponent.input_schema.required).toContain('description');
    });

    it('generatePage has correct schema', () => {
      expect(generatePage.name).toBe('generate_page');
      expect(generatePage.input_schema.properties.route).toBeDefined();
      expect(generatePage.input_schema.properties.components).toBeDefined();
      expect(generatePage.input_schema.properties.dataFetching).toBeDefined();
      expect(generatePage.input_schema.required).toContain('route');
      expect(generatePage.input_schema.required).toContain('name');
    });
  });

  describe('Integration Tools', () => {
    it('connectComponents has correct schema', () => {
      expect(connectComponents.name).toBe('connect_components');
      expect(connectComponents.input_schema.properties.connections).toBeDefined();
      expect(connectComponents.input_schema.required).toContain('connections');
    });

    it('fixImports has correct schema', () => {
      expect(fixImports.name).toBe('fix_imports');
      expect(fixImports.input_schema.properties.file).toBeDefined();
      expect(fixImports.input_schema.properties.addImports).toBeDefined();
      expect(fixImports.input_schema.properties.removeImports).toBeDefined();
      expect(fixImports.input_schema.required).toContain('file');
    });
  });

  describe('Tool Collections', () => {
    it('codeOrchestratorTools has 4 tools', () => {
      expect(codeOrchestratorTools.length).toBe(4);
    });

    it('schemaGeneratorTools has 2 tools', () => {
      expect(schemaGeneratorTools.length).toBe(2);
    });

    it('apiGeneratorTools has 2 tools', () => {
      expect(apiGeneratorTools.length).toBe(2);
    });

    it('componentGeneratorTools has 3 tools', () => {
      expect(componentGeneratorTools.length).toBe(3);
    });

    it('integrationAgentTools has 3 tools', () => {
      expect(integrationAgentTools.length).toBe(3);
    });

    it('allCodegenTools has all expected tools', () => {
      const expectedTools = [
        'delegate_codegen',
        'validate_code',
        'finalize_project',
        'generate_file',
        'generate_schema',
        'generate_api',
        'generate_component',
        'generate_page',
        'connect_components',
        'fix_imports',
      ];

      for (const tool of expectedTools) {
        expect(allCodegenTools[tool as keyof typeof allCodegenTools]).toBeDefined();
      }
    });
  });
});
