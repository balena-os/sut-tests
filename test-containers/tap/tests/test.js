const t = require('tap')


async function main(){
    t.test('this is a child test', t => {
        t.comment(` We want this comment to stay`)
        console.log(`We don't want this comment to stay`)
        t.pass('this passes')
        //t.fail('this fails')
        t.ok(true, 'this passes if truthy')
        t.equal(5, 5, 'this passes if the values are equal')
        t.end()
    })

}

main();
