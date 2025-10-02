// Minimal cheerio stub for tests. Implements only what our scraper uses.
export function load(html: string) {
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, 'text/html');

	function wrap(elements: Element[]) {
		return {
			each(cb: (index: number, el: Element) => void) {
				elements.forEach((el, i) => cb(i, el));
			},
			attr(name: string) {
				return elements[0]?.getAttribute?.(name) ?? undefined;
			},
			text() {
				return elements.map((el) => el.textContent || '').join('');
			},
			first() {
				const first = elements[0];
				return {
					text: () => first?.textContent || '',
					attr: (name: string) => first?.getAttribute?.(name) ?? undefined,
				};
			},
		};
	}

	const $ = (selector: string | Element) => {
		if (typeof selector === 'string') {
			const nodeList = doc.querySelectorAll(selector);
			return wrap(Array.from(nodeList));
		}
		return wrap([selector]);
	};

	return $;
}
