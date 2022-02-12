# A fork of [deno-git-server](https://github.com/taisukef/deno-git-server)

A configurable git server written in Deno. With this code you can program a git-server running on deno yourself.
If you are looking for a complete out-of-the-box software to run a deno git-server based on this code, you may take a look at [hybriqor git repo server](https://hybriqor.worldapi.org/distributions/git-repo-server).

## Changes to original deno-git-server

* IP whitelist now optional
* Basic auth supported
* Hand back request to parent class if accessing client is not a git client (eg a web browser)
* Display console message from server in git push console output

## Install

1. Install [Git](https://github.com/git/git) and [Deno](https://deno.land)
2. Clone this repo, change into its directory
3. Type this in your console
```
deno run -A --unstable GitServer.js
```
runs on `localhost:7005` by default

## Usage

make a directory and change into it, init git, create a file, make a commit, set remote origin and push.
```console
mkdir test
cd test
git init
touch test.txt
git add .
git commit -m 'initial commit'
git remote add origin http://localhost:7005/test
git push --set-upstream origin master
```
or
```console
git push http://localhost:7005/test master
```

## Links
- [Git](https://github.com/git/git)
- [Deno](https://github.com/denoland)
- [node-git-server](https://www.npmjs.com/package/node-git-server)
