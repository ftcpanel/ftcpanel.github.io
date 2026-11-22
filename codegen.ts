import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
	schema: 'schema.graphql',
	// All GraphQL documents live in src/lib/api.
	documents: ['src/lib/api/**/*.ts', '!src/lib/api/gql/**'],
	ignoreNoDocuments: true,
	generates: {
		'src/lib/api/gql/': {
			preset: 'client',
			presetConfig: { fragmentMasking: false },
			config: {
				// Documents as plain strings: no graphql-js runtime in the client bundle.
				documentMode: 'string',
				useTypeImports: true,
				enumsAsTypes: true,
				scalars: { Date: 'string', DateTime: 'string' }
			}
		}
	}
};

export default config;
