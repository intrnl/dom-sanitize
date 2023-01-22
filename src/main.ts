import { DEFAULT_OPTIONS, sanitize } from '../lib';

const input = document.getElementById('html-input') as HTMLTextAreaElement;
const output = document.getElementById('sanitize-input') as HTMLTextAreaElement;

const doSanitize = (html: string) => {
	const sanitized = sanitize(html, DEFAULT_OPTIONS);

	const template = document.createElement('template');
	template.content.appendChild(sanitized);

	return template.innerHTML;
};

output.value = doSanitize(input.value!);

input.addEventListener('input', (ev) => {
	output.value = doSanitize(input.value!);
});
