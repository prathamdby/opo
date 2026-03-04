#!/usr/bin/env node
import{writeFileSync as l,mkdirSync as h,readFileSync as m,existsSync as w}from"node:fs";import{join as c}from"node:path";import{execSync as f}from"node:child_process";var a=process.cwd(),p=".opencode/";function i(e,o){let n=c(a,e);l(n,o,"utf8"),console.log(`  wrote  ${e}`)}function d(){try{return f("git remote get-url origin",{stdio:["pipe","pipe","pipe"]}).toString().trim().replace(/^git@github\.com:/,"").replace(/^https:\/\/github\.com\//,"").replace(/\.git$/,"")}catch{return"<owner>/<repo>"}}(async()=>{let[o,n,u]=await Promise.all([fetch("https://raw.githubusercontent.com/prathamdby/opo/main/.github/workflows/agent.yml").then((t)=>{if(!t.ok)throw Error("HTTP "+t.status);return t.text()}),fetch("https://raw.githubusercontent.com/prathamdby/opo/main/opencode.jsonc").then((t)=>{if(!t.ok)throw Error("HTTP "+t.status);return t.text()}),fetch("https://raw.githubusercontent.com/prathamdby/opo/main/AGENTS.md").then((t)=>{if(!t.ok)throw Error("HTTP "+t.status);return t.text()})]);h(c(a,".github","workflows"),{recursive:!0}),i(".github/workflows/agent.yml",o),i("opencode.jsonc",n),i("AGENTS.md",u);let r=c(a,".gitignore"),s=w(r)?m(r,"utf8"):"";if(!s.includes(p))l(r,s+(s.endsWith(`
`)?"":`
`)+p+`
`,"utf8"),console.log("  patched .gitignore");let g=d();console.log(`
opo installed. Complete these steps to activate:

  1. Add secret  →  https://github.com/${g}/settings/secrets/actions/new
                    Name:  OPENCODE_ZEN_API_KEY
                    Value: your key from https://opencode.ai/zen

  2. Allow PRs   →  https://github.com/${g}/settings/actions
                    Workflow permissions → enable
                    "Allow GitHub Actions to create and approve pull requests"

  3. Commit and push the new files, then trigger via:
                    gh workflow run agent.yml -f task="your task here"
                    or comment /opo <task> on any issue
`)})().catch((e)=>{process.stderr.write("error: "+(e instanceof Error?e.message:String(e))+`
`),process.exit(1)});
