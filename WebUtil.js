import { decode } from 'https://deno.land/std@0.125.0/encoding/base64.ts';

export function parseURL(url) {
	const n = url.indexOf("://");
	if (n < 0) {
		return null;
	}
	const protocol = url.substring(0, n + 3);
	const n2 = url.indexOf(":", n + 3);
	const n3 = url.indexOf("/", n + 3);
	if (n3 < 0) {
		const port = n2 < 0 ? 80 : parseInt(url.substring(n2 + 1));
		const host = n2 < 0 ? url.substring(n + 3) : url.substring(n + 3, n2);
		const path = "/";
		const query = null;
		return { protocol, port, host, path, query };
	}
	const port = n2 < 0 ? 80 : parseInt(url.substring(n2 + 1, n3));
	const host = n2 < 0 ? url.substring(n + 3, n3) : url.substring(n + 3, n2);
	const n4 = url.indexOf("?", n3);
	const path = n4 < 0 ? url.substring(n3) : url.substring(n3, n4);
	const query = n4 < 0 ? null : url.substring(n4 + 1);

	if (protocol == "file://") {
		const regexp = /(?<scheme>.+):\/\/(?<basename>.+)\/(?<filename>.+)/;
		const dirname = url.match(regexp).groups.basename + "/";
		return { protocol, port, host, path, query, dirname };
	}
	return { protocol, port, host, path: decodeURI(path), query };
};

export function getQueryParam(query, name) {
	// query = location.search
	name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	const regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
	const res = regex.exec("?" + query);
	return res ? decodeURIComponent(res[1].replace(/\+/g, " ")) : "";
};

export function existsDirSync(path) { // for Deno
	try {
		Deno.readDirSync(path);
		return true;
	} catch (e) {
		return false;
	}
};

export async function fetchJSON(path) {
	try {
		if (globalThis.Deno) {
			return JSON.parse(await Deno.readTextFile(path));
		} else {
			return await (await fetch(path)).json();
		}
	} catch (e) {
		return null;
	}
}

export function basicAuth(authHeader) {
	const tokens = authHeader.split(' ');
	if (tokens[0] === 'Basic') {
		const splitHash = new TextDecoder().decode(decode(tokens[1])).split(':');
		const username = splitHash.shift();
		const password = splitHash.join(':');
		return {
			username, password
		};
	} else {
		throw Error('Unknown auth.');
	}
}
