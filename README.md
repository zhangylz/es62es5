运行效果 npm run build


环境搭建方式



搭建本地 es6转es5 
https://www.cnblogs.com/sunyang-001/p/10829851.html
步骤：
1. 首先创建项目工程目录
2. 然后新建2个文件夹，一个是src文件夹 ，一个是dist文件夹
	src:书写ES6的文件夹
	dist:利用babel编译成的ES5代码的文件夹
3. 新建一个index.html文件，需要在页面引入dist下的index.js文件
4. 输入npm init -y,生成一个package.json文件
5. 输入npm install -g babel-cli，全局安装babel-cli命令行，出现下图提示，安装成功
6. 然后安装ES5打包工具，输入npm install --save-dev babel-preset-es2015 babel-cli命令，然后重新打开package.json文件，出现如下两行说明安装成功。
7. 在根目录下创建.babelrc文件，输入json格式的对象
8. 输入babel src/index.js -o dist/index.js即可将ES6语法转换为ES5语法，打开dist文件夹下的index.js文件查看，已经转化成功
9. 为了避免每次都要输入babel src/index.js -o dist/index.js命令，可以将其放在package.json文件下，scripts就是放命令的地方，可以将其修改为如下命令
10. 输入npm run build命令即可转换成功

为了进一步的压缩代码 
步骤：
1. npm install terser
2. npx terser -c -m -o test.min.js -- test.js
npm install terser