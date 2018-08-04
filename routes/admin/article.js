var router = require('koa-router')();

var DB=require('../../model/db.js');
var tools=require('../../model/tools.js');

//图片上传模块

const multer = require('koa-multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {


        cb(null, 'public/upload');   /*配置图片上传的目录*/
    },
    filename: function (req, file, cb) {   /*图片上传完成重命名*/
        var fileFormat = (file.originalname).split(".");   /*获取后缀名  分割数组*/
        cb(null,Date.now() + "." + fileFormat[fileFormat.length - 1]);
    }
})
var upload = multer({ storage: storage });





router.get('/',async (ctx)=>{


    var page=ctx.query.page ||1;

    var pageSize=12;

    //查询总数量

    var count= await  DB.count('article',{});
    var result=await DB.find('article',{},{},{
        page:page,
        pageSize:pageSize,
        sortJson:{
            'add_time':-1
        }
    });
    await  ctx.render('admin/article/index',{
        list: result,
        page:page,
        totalPages:Math.ceil(count/pageSize)
    });
})




router.get('/add',async (ctx)=>{

    //查询分类数据

    var catelist=await DB.find('articlecate',{});

    console.log(tools.cateToList(catelist));

    await  ctx.render('admin/article/add',{

        catelist:tools.cateToList(catelist)
    });



})

//router.get('/ueditor',async (ctx)=>{
//
//    await  ctx.render('admin/article/ueditor');
//
//})
//post接收数据
router.post('/doAdd', upload.single('img_url'),async (ctx)=>{

    //ctx.body = {
    //    filename:ctx.req.file?ctx.req.file.filename : '',  //返回文件名
    //    body:ctx.req.body
    //}
    let pid=ctx.req.body.pid;
    let catename=ctx.req.body.catename.trim();
    let title=ctx.req.body.title.trim();
    let price=ctx.req.body.price;
    let img_url=ctx.req.file? ctx.req.file.path.substr(7) :'';

    let add_time=tools.getTime();

    //console.log(img_url);
    //属性的简写
    let json={
        pid,catename,title,price,img_url,add_time
    }

    var result=DB.insert('article',json);

    //跳转
    ctx.redirect(ctx.state.__HOST__+'/admin/article');




})


router.get('/edit',async (ctx)=>{

    //查询分类数据
    var id=ctx.query.id;
    //分类
    var catelist=await DB.find('articlecate',{});
    //当前要编辑的数据
    var articlelist=await DB.find('article',{"_id":DB.getObjectId(id)});
    await  ctx.render('admin/article/edit',{
        catelist:tools.cateToList(catelist),
        list:articlelist[0],
        prevPage :ctx.state.G.prevPage   /*保存上一页的值*/
    });

})


router.post('/doEdit', upload.single('img_url'),async (ctx)=>{

    let prevPage=ctx.req.body.prevPage || '';  /*上一页的地址*/
    let id=ctx.req.body.id;
    let pid=ctx.req.body.pid;
    let catename=ctx.req.body.catename.trim();
    let title=ctx.req.body.title.trim();
    let price=ctx.req.body.price;
    let img_url=ctx.req.file? ctx.req.file.path.substr(7) :'';
    //属性的简写
    //注意是否修改了图片
    if(img_url){
        var json={
            pid,catename,title,price,img_url
        }
    }else{
        var json={
            pid,catename,title,price
        }
    }

    DB.update('article',{"_id":DB.getObjectId(id)},json);


    //跳转
    if(prevPage){
        ctx.redirect(prevPage);

    }else{
        ctx.redirect(ctx.state.__HOST__+'/admin/article');
    }


})




module.exports=router.routes();