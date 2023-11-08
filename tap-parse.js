// cjs style
const { Parser } = require('tap-parser')
// or, you can do it this way:
// import { Parser } from 'tap-parser'
// or this way:
// import { Parser } from 'https://unpkg.com/tap-parser@latest/dist/esm/index.js'
const p = new Parser(results => console.dir(results))

// p.on('child', function (childParser) {
//     console.log(`# Subtest: ${childParser.name}`)
//     childParser.on('line', (line) => {
//         console.log(`childparserLine: ${line}`)
//     })
// })

// p.on('assert', function (assert) {
//     console.log(assert)
// })

// p.on('comment', function (comment) {
//     console.log(comment)
// })
p.on('plan', function (plan) {
    console.log(plan)
})
p.on('version', (version) => {
    console.log(`TAP version ${version}`)
})
p.on('line', function (line) {
    const tapLineRegex = /^\s*(ok|not ok|\#)\s*\d*\s*-?\s+.*/;
        if(tapLineRegex.test(line)){
        console.log(line.replace(/\n\s*$/, ''))
    }
})

process.stdin.pipe(p)