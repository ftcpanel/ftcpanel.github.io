import { describe, expect, it } from 'vitest';
import { searchEvents } from './events.ts';

const ev = (code: string, name: string, city: string, state: string, country: string, start = '2026-11-21') => ({
	code,
	name,
	start,
	ongoing: false,
	finished: false,
	location: { city, state, country }
});

const events = [
	ev('KZASQ1', 'Astana FIRST Regional', 'Astana', 'AST', 'Kazakhstan'),
	ev('USTXHOQ1', 'Houston Qualifier', 'Houston', 'TX', 'USA'),
	ev('CAONQ', 'Toronto Qualifier', 'Toronto', 'ON', 'Canada'),
	ev('TRISQ', 'İstanbul Qualifier', 'İstanbul', '34', 'Türkiye')
];

const codes = (text: string) => searchEvents(events, text).map((e) => e.code);

describe('searchEvents', () => {
	it('finds events by country, full state/province name, and city', () => {
		expect(codes('kazakhstan')).toEqual(['KZASQ1']);
		expect(codes('Texas')).toEqual(['USTXHOQ1']);
		expect(codes('ontario')).toEqual(['CAONQ']);
		expect(codes('united states')).toEqual(['USTXHOQ1']);
	});

	it('ignores accents and case, and needs every word to match', () => {
		expect(codes('istanbul')).toEqual(['TRISQ']);
		expect(codes('turkey')).toEqual(['TRISQ']);
		expect(codes('qualifier texas')).toEqual(['USTXHOQ1']);
		expect(codes('qualifier kazakhstan')).toEqual([]);
	});

	it('matches word prefixes, not inner substrings', () => {
		expect(codes('hous')).toEqual(['USTXHOQ1']);
		expect(codes('ston')).toEqual([]);
	});
});
