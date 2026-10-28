import { mapSerperOrganicResult } from '../src/server/services/serper.service';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}

const result = mapSerperOrganicResult(
  {
    title: 'Example Competitor',
    link: 'https://example.test/competitor',
    snippet: 'A business serving the requested area.',
  },
  2
);

assert(result?.position === 3, 'preserves the provider result ranking');
assert(result?.name === 'Example Competitor', 'maps the provider title');
assert(result?.url === 'https://example.test/competitor', 'maps a valid result URL');
assert(result?.snippet === 'A business serving the requested area.', 'maps the result description');
assert(
  mapSerperOrganicResult({ title: 'Unsafe result', link: 'javascript:alert(1)' }, 0) === null,
  'rejects non-HTTP result links'
);
assert(
  mapSerperOrganicResult({ link: 'https://example.test' }, 0) === null,
  'ignores results without a title'
);

console.log('Serper competitor tests passed.');
