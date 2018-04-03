# postcss-auto-imgmq

> 根据图片名或图片路径自动添加媒体查询到样式表

## 常见场景

* `retina`屏高清图片自动适配
* 根据屏幕尺寸替换背景图片
* 其他媒体查询条件相关图片样式自动生成

## 如何使用

1.从`npm`安装

```bash
npm install -D postcss-auto-imgmq
```

2.添加到`postcss`插件列表（以`webpack`为例）

```javascript
const imgmq = require('postcss-auto-imgmq');

// ...

module: {
    rules:[
        {
            test: /\.css$/,
            use: [{
                loader: 'style-loader'
            },{
                loader: 'css-loader'
            },{
                loader: 'postcss-loader',
                options: {
                    plugins:[
                        imgmq({
                            // options
                        })
                    ]
                }
            }]
        }
    ]
}
```

3.将高清图片放入静态资源目录

以默认配置为例，在`ball.png`的当前所在目录将高清图片命名为`ball@3x.png`  
或 在`ball.png`的当前所在目录新建名为`3x`的文件夹，放入与之同名的高清图片  
媒体查询即会自动生成并插入

**注：原图与适配图必须都存在才会生成样式**

Eg：
原css代码

```stylesheet
.ball .one .imgBox {
    width: 50%;
    background-image: url("./img/ball_1.png");
}

.ball .two .imgBox {
    width: 100%;
    background-image: url("./img/ball_2.png");
}
```

插件处理后

```stylesheet
.ball .one .imgBox {
    width: 50%;
    background-image: url("./img/ball_1.png");
}

.ball .two .imgBox {
    width: 100%;
    background-image: url("./img/ball_2.png");
}

@media (-webkit-min-device-pixel-ratio:3),(min-device-pixel-ratio:3) {
.ball .one .imgBox {
    background-image: url('img/ball_1@3x.png');
}
.ball .two .imgBox {
    background-image: url('img/3x/ball_2.png');
}
}
```

## options

* detectPostfix

自动检测的图片名后缀，默认值`@3x`  
设置为`null`或`false`或空字符串`''`则不根据图片名后缀自动检测

* detectDirname

自动检测的目录名，默认值`3x`  
设置为`null`或`false`或空字符串`''`则不根据目录名自动检测

* mediaQuery

自动插入的媒体查询条件，默认值`(-webkit-min-device-pixel-ratio:3),(min-device-pixel-ratio:3)`

### 注意事项

尚未在除`win10`之外的平台上运行过  