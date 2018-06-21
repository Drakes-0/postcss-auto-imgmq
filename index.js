const exists = require('fs').existsSync
const path = require('path')
const postcss = require('postcss')
const defaultConfig = require('./defaultConfig')
const package = require('./package.json')

const bgImgReg = /url\(([^\)\s]+?)\)/i
const HDFILE_POSTFIX = 'POSTFIX'
const HDFILE_DIR = 'DIR'

const getFilePath = resource =>
    resource.source && resource.source.input
        ? resource.source.input.file
        : null

const getImgPath = (filePath, imgPath) => {

    if (imgPath.startsWith(`"`) || imgPath.startsWith(`'`))
        imgPath = imgPath.substr(1, imgPath.length - 2)

    let queryString = ''

    if (imgPath.indexOf('?') > 0) {
        queryString = imgPath.substring(imgPath.indexOf('?'))
        imgPath = imgPath.replace(queryString, '')
    }

    let relativePath = imgPath
    let absolutePath = path.join(filePath, `${imgPath.startsWith(`./`) ? '.' : '../'}${imgPath}`)

    return { relativePath, absolutePath, queryString }
}

const getPostfixPath = (dirname, filename, detectPostfix, extname) =>
    !!detectPostfix ? path.join(dirname, [filename, detectPostfix, extname].join('')) : null

const getDirPath = (dirname, detectDirname, filename, extname) =>
    !!detectDirname ? path.join(dirname, ['./', detectDirname, '/', filename, extname].join('')) : null

const getTargetPath = (imgPath, config, type) => {
    let extname = path.extname(imgPath)
    let dirname = path.dirname(imgPath)
    let filename = path.basename(imgPath, extname).replace(/@[1-9]{1}x$/i, '')

    switch (type) {
        case HDFILE_POSTFIX:
            return getPostfixPath(dirname, filename, config.detectPostfix, extname)
        case HDFILE_DIR:
            return getDirPath(dirname, config.detectDirname, filename, extname)
        default:
            return [{
                type: HDFILE_POSTFIX,
                path: getPostfixPath(dirname, filename, config.detectPostfix, extname)
            }, {
                type: HDFILE_DIR,
                path: getDirPath(dirname, config.detectDirname, filename, extname)
            }]
    }
}

const getExistsPath = (pathArray, config, relativePath) => {
    let existsPath = null

    for (let i = 0; i < pathArray.length; i++) {
        if (pathArray[i].path && exists(pathArray[i].path)) {
            existsPath = getTargetPath(relativePath, config, pathArray[i].type).replace(/\\/g, '/')
            break
        }
    }

    return existsPath
}

module.exports = postcss.plugin(package.name, opts => {
    let config = Object.assign(Object.create(null), defaultConfig, opts)

    return (root, result) => {

        if (!config.detectPostfix && !config.detectDirname) return root

        let filePath = getFilePath(root)

        if (!filePath || /node_modules/.test(filePath)) return root

        let resultArray = []

        root.walkRules(rule => {

            rule.walkDecls(/^background(-image)?$/, decl => {
                try {
                    let match = bgImgReg.exec(decl.value)

                    if (Array.isArray(match) && match.length > 1 && match[1].indexOf('data:') < 0) {
                        let { relativePath, absolutePath, queryString } = getImgPath(filePath, match[1])

                        if (exists(absolutePath)) {
                            let highDefinition = getExistsPath(getTargetPath(absolutePath, config), config, relativePath)
                            highDefinition && resultArray.push(
                                {
                                    selector: rule.selector,
                                    selectors: rule.selectors,
                                    raws: rule.raws,
                                    highDefinition: `${highDefinition}${queryString}`,
                                    declRaws: decl.raws
                                }
                            )
                        } else {
                            result.warn('WARNING: IMAGE NOT FOUND , Path: ' + absolutePath)
                        }
                    }
                } catch (e) {
                    result.warn(e)
                }
            })
        })

        if (resultArray.length) {
            let newAtRule = postcss.atRule({
                name: 'media',
                params: config.mediaQuery
            })

            let rules = resultArray.map(({ selector, selectors, raws, highDefinition, declRaws }) => {
                let newRule = postcss.rule({
                    selector,
                    selectors,
                    raws
                })

                return newRule.append(postcss.decl({
                    prop: 'background-image',
                    value: `url('${highDefinition}')`,
                    raws: declRaws
                }))
            })

            root.append(newAtRule.append(...rules))
        }

        return root
    }
})

module.exports.process = function (css, pluginOpts, postcssOpts) {
    return postcss([this(pluginOpts)]).process(css, postcssOpts)
}