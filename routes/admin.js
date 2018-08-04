/**
 * Created by wanghuapeng on 2017/11/20 0020.
 */
var router = require('koa-router')();
//引入模块
var url=require('url');

const ueditor = require('koa2-ueditor');

//配置中间件 获取url的地址
router.use(async (ctx,next)=>{
    //console.log(ctx.request.header.host);

    //模板引擎配置全局的变量
    ctx.state.__HOST__='http://'+ctx.request.header.host;
    //console.log(ctx.request.url);  //   /admin/user
    var pathname=url.parse(ctx.request.url).pathname.substring(1);

    //左侧菜单选中
    var splitUrl=pathname.split('/');
    //全局的userinfo
    ctx.state.G={
        url:splitUrl,
        userinfo:ctx.session.userinfo,
        prevPage:ctx.request.headers['referer']   /*上一页的地址*/
    }

    //权限判断
    if(ctx.session.userinfo){
        //配置全局信息
        await  next();
    }else{  //没有登录跳转到登录页面
        if(pathname=='admin/login' || pathname=='admin/login/doLogin'  || pathname=='admin/login/code'){
            await  next();
        }else{
            ctx.redirect('/admin/login');
        }
    }

})


var index=require('./admin/index.js');
var login=require('./admin/login.js');

var manage=require('./admin/manage.js');
var articlecate=require('./admin/articlecate.js');
var article=require('./admin/article.js');

var nav=require('./admin/nav.js');
var dishes = require('./admin/dishes.js');

//后台的首页
router.use(index);
router.use('/login',login);
router.use('/manage',manage);
router.use('/articlecate',articlecate);
router.use('/article',article);

router.use('/nav',nav);

router.use('/dishes',dishes);

//ueditor.config.js配置图片post的地址
router.all('/editorUpload', ueditor(['public', {
    "imageAllowFiles": [".png", ".jpg", ".jpeg"],
    "imagePathFormat": "/upload/ueditor/image/{yyyy}{mm}{dd}/{filename}"  // 保存为原文件名
}]))

module.exports=router.routes();