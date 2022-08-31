const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const pkg = require('../../package.json');

fs.readdirSync(path.resolve(process.cwd(), "plugins"))
.filter( f => fs.statSync(path.resolve(process.cwd(), "plugins/" + f)).isDirectory() )
.forEach(folder => {
    if(!( fs.existsSync(path.resolve(process.cwd(), "plugins/" + f + "/package.json")) && fs.statSync(path.resolve(process.cwd(), "plugins/" + f + "/package.json")).isFile() )) return;
    const package = require(path.relative(__dirname, path.resolve(process.cwd(), "plugins/" + f + "/package.json")));
    Object.keys(package.dependencies)
    .filter(d => !Object.keys(pkg.dependencies).includes(d))
    .forEach(d => {
        exec(`
            cd ${process.cwd()}
            npm install ${d}
        `)
    })
});