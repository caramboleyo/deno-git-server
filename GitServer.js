// Git server doc: https://git-scm.com/docs/http-protocol/2.16.6

import GitProxy from './GitProxy.js';
import WebServer from './WebServer.js';
import { existsDirSync, fetchJSON, basicAuth } from './WebUtil.js';
const settings = await fetchJSON('settings.json');

const REPO_PATH = settings?.repoPath || 'repos';
const IP_WHITELIST = settings?.ipWhiteList || { "::1": { "name": "me" }};
const PORT = settings?.port || 7005;

const SIDEBAND = String.fromCharCode(2);

async function myAuthFunction(user, pass) {
	console.log('>>>auth', user, pass);
	return true;
}

async function myPushWelcome() {
	return "\n\tWelcome to deno-git-server\n\tProblems go here: https://github.com/caramboleyo/deno-git-server/issues\n\n";
}

async function myPush() {
	return "\n\tYour push has been processed.\n\tWe could provide additional notes here now.\n\n";
}

class GitServer extends WebServer {

	async handle(req) {
		if (req.headers.get('user-agent').substr(0,3) != 'git') {
			console.log('FUT');
			return super.handle(req);
		}
		if (settings.useWhiteList) {
			const name = IP_WHITELIST[req.remoteAddr];
			console.log("access from " + JSON.stringify(name) + " - req.remoteAddr " + req.remoteAddr);
			if (!name) {
				return new Response('IP address not permitted.', {
					status: 403
				});
			}
		} else {
			console.log(`Access from ${req.remoteAddr}`);
		}
		if (settings.useAuthentication) {
			if (req.headers.get('authorization')) {
				const { username, password } = await basicAuth(req.headers.get('authorization'));
				if (! await eval(settings.authenticationCall)(username, password)) {
					return new Response('', {
						status: 401,
						headers: new Headers({
							'Content-Type': 'text/plain',
							"WWW-Authenticate": 'Basic realm="authorization needed"'
						})
					});
				}
			} else {
				return new Response('', {
					status: 401,
					headers: new Headers({
						'Content-Type': 'text/plain',
						"WWW-Authenticate": 'Basic realm="authorization needed"'
					})
				});
			}
		}

		const n = req.path.indexOf("/", 1);
		const repo = req.path.substring(1, n);
		if (repo.indexOf("..") >= 0) {
			return null;
		}
		const service = req.path.substring(n + 1);

		if (service == "info/refs") {
			const pservice = req.getQueryParam("service");
			console.log(REPO_PATH + repo)
			if (pservice == "git-receive-pack" && !existsDirSync(REPO_PATH + repo)) {
				await GitProxy.init(REPO_PATH + repo);
			}
			const res = await GitProxy.service(pservice, true, REPO_PATH + repo);
			return this.createResponseGitAdvertise(res, pservice, "advertisement");
		}

		const text = new Uint8Array(await req.arrayBuffer());
		const res = await GitProxy.service(service, false, REPO_PATH + repo, text);
		return this.createResponseGit(res, service, "result");
	}

	async createResponseGitAdvertise(text, service, type) {
		text = new TextDecoder().decode(text);
		const code = service == "git-upload-pack" ? "001e" : "001f";
		let response = code + "# service=" + service + "\n0000" + text;

		if (settings.onPushWelcome) {
			response += this.packSideband(await eval(settings.onPushWelcome)());
		}

		return this.createResponse(
			response,
			"application/x-" + service + "-" + type,
		);
	}

	packSideband(s) {
		s = SIDEBAND + s;
		const n = (4 + s.length).toString(16);
		return Array(4 - n.length + 1).join('0') + n + s;
	}

	async createResponseGit(text, service, type) {
		if (settings.onPush) {
			text = new TextDecoder().decode(text);
			// this response is already closed when it ends with eight zeros
			// we then cut of the last four of them, append our text and than readd them
			if (text.substr(-8,8) == '00000000') {
				text = text.substr(0,text.length-4);
			}
			text += this.packSideband(await eval(settings.onPush)());
			text += '0000';
		}
		return this.createResponse(text, "application/x-" + service + "-" + type);
	}
}
new GitServer(PORT);
