const path = require('path')
const plugin = require('../index')

const css = `
.ball .one .imgBox {
    width: 50%;
    background-image: url("./img/ball_1.png");
}

.ball .two .imgBox {
    width: 100%;
    background-image: url("./img/ball_2.png");
}
`

plugin.process(css, null, { from: path.join(__dirname, 'test.js') }).then(result => {
    console.log(result.css)
})