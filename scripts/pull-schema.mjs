// Pulls FTC Scout's GraphQL schema via introspection into schema.graphql.
// Run with `npm run schema`, then `npm run codegen`.
import { writeFile } from 'node:fs/promises';
import { buildClientSchema, getIntrospectionQuery, printSchema } from 'graphql';

const res = await fetch('https://api.ftcscout.org/graphql', {
	method: 'POST',
	headers: { 'content-type': 'application/json' },
	body: JSON.stringify({ query: getIntrospectionQuery() })
});
if (!res.ok) throw new Error(`Introspection failed: HTTP ${res.status}`);
const { data, errors } = await res.json();
if (errors?.length) throw new Error(`Introspection failed: ${errors[0].message}`);

await writeFile('schema.graphql', printSchema(buildClientSchema(data)) + '\n');
console.log('schema.graphql updated');
