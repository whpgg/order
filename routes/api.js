var router = require('koa-router')();
var tools = require('../model/tools');
var DB=require('../model/db.js');
router.get('/',async (ctx)=>{

    ctx.body="api接口";

})
//菜单详情
router.get('/productlist',async (ctx)=>{
    var catelist=await DB.find('articlecate',{});//分类列表
    
    var articlelist=await DB.find('article',{});//菜品列表
    for(var i=0;i<catelist.length;i++){
        catelist[i].list=[];
        for(var j=0;j<articlelist.length;j++){
            if(catelist[i]._id==articlelist[j].pid){
                catelist[i].list.push(articlelist[j]);
            }
        }

    }
    ctx.body={
        result:catelist
    };
})
router.get('/productcontent',async (ctx)=>{//菜单详情
    var id=ctx.query.id;
    var articlelist=await DB.find('dishes',{"pid":id});
    ctx.body={
        result:articlelist
    };
})
router.post('/addCart',async (ctx)=>{
    //接收客户端提交的数据 、主要做的操作就是增加数据

    // console.log(ctx.request.body);

    var addData=ctx.request.body;
    try{
        var num_post = addData.num;
        var uid =addData.uid;
        var product_id = addData.product_id;
        var hasData = await DB.find('cart',{'uid':uid,'product_id':product_id});
        if(hasData.length>0){
            await DB.update('cart',{'uid':uid,'product_id':product_id},{'num':parseFloat(hasData[0].num)+parseFloat(num_post)});
        }else{
            var result = await DB.insert('cart',addData);
        }
        ctx.body={"success":'true',"msg":"增加数据成功"};

    }catch(err){
        ctx.body={"success":'false',"msg":"增加数据失败"};
    }

})
//获取购物车数量
router.get('/cartCount',async ctx=>{ 
    
    var uid=ctx.query.uid; 
    var result=await DB.find('cart',{'uid':uid});


    //console.log(result);
    var sum=0;
    for(var i=0;i<result.length;i++){
        sum+=result[i].num;
    }
    ctx.body={"success":true,"result":sum};
})
//购物车
router.get('/cartlist',async ctx=>{
    

    var uid=ctx.query.uid;

    var result=await DB.find('cart',{'uid':uid});
    ctx.body={"success":'true',"result":result};

})

//增加购物车数据
router.get('/incCart',async ctx=>{
    var uid=ctx.query.uid;
    var product_id=ctx.query.product_id;
    var num=parseInt(ctx.query.num);
    var result=await DB.update('cart',{'uid':uid,'product_id':product_id},{"num":num+1});
    // console.log(result);
    ctx.body={"success":true};
})


//减少购物车数据
router.get('/decCart',async ctx=>{    
    ctx.body="api接口";
    var uid=ctx.query.uid;
    var product_id=ctx.query.product_id;
    var num=parseInt(ctx.query.num);
    if(num<=1){
        var result=await DB.remove('cart',{'uid':uid,'product_id':product_id}); 
    }else{
        var result=await DB.update('cart',{'uid':uid,'product_id':product_id},{"num":num-1}); 
    }
    ctx.body={"success":true};
})
//增加用户餐位信息

router.post('/addPeopleInfo',async ctx=>{

    var data=ctx.request.body;

    //console.log(data);
    try{
        var uid=data.uid;
        
        var p_num=data.p_num;

		 var p_mark=data.p_mark;

        var hasData=await DB.find('peopleinfo',{'uid':uid});

        if(hasData.length>0){
            await DB.update('peopleinfo',{'uid':uid},{'p_num':p_num,'p_mark':p_mark})
        }else{
            var result=await DB.insert('peopleinfo',data);
        }
        ctx.body={"success":'true',"msg":"增加数据成功"};

    }catch(err){
        ctx.body={"success":'false',"msg":"增加数据失败"};
    }

})


//用餐人数列表
router.get('/peopleInfoList',async ctx=>{
    var uid=ctx.query.uid;
    var result=await DB.find('peopleinfo',{'uid':uid});
    ctx.body={"success":'true',"result":result};
})

//提交订单
router.post('/addOrder',async ctx=>{

    var data=ctx.request.body;

    

    try{

        //获取数据
        var uid=data.uid;

        var p_num=data.p_num;

        var p_mark=data.p_mark;  /*备注口味信息*/

        var order=  ctx.request.body.order?JSON.parse( ctx.request.body.order):'';  /*菜品信息*/

        var order_id=tools.getOrderId();

        var total_price=data.total_price;

        var total_num=data.total_num;

        var order_status=0;   //0表示  未确认    1 表示已经确认      2表示取消

        var pay_status=0;   //0表示未支付  1表示已经支付
        var d=new Date();
        //判断当前桌子下面有没有  没有取消并且未支付的订单    如果有的话更新   没有增加
        var shopOrderResult=await DB.find('shop_order',{"uid":uid,"order_status":{ $not:/2/},"pay_status":0});

        if(shopOrderResult.length>0){/*更新订单*/
                //增加订单主表
                var shop_order_result=await DB.update('shop_order',{"uid":uid,"order_status":{ $not:/2/},"pay_status":0},{
                    total_num:total_num+shopOrderResult[0].total_num,
                    total_price:total_price+shopOrderResult[0].total_price
                })
                for(var i=0;i<order.length;i++){
                    await DB.insert('shop_order_item',{
                        order_id:  shopOrderResult[0]._id.toString(),
                        title:order[i].title,
                        price:order[i].price,
                        num:order[i].num,
                        status:1    /*状态是1 表示已经下厨     状态是2表示退菜*/
                    })
                }

        }else{/*增加订单*/
                //增加订单主表
                var shop_order_result=await DB.insert('shop_order',{
                    uid:uid,
                    p_num:p_num,
                    p_mark,
                    order_id,
                    total_num,
                    total_price,
                    pay_status,
                    order_status,
                    add_time:d.getTime()
                })
                //增加订单二级表
                if(shop_order_result.insertedId){

                    //[{"_id":"5ac2e79b127ca21160ffe32a","shop_id":"5ac079f7b3c2d439307e78fa","cate_id":"5ac089e4a880f20358495509","title":"东鹏特饮2018年世界杯传播","price":"2.8","description":"规格:250ml/瓶","num":2},{"_id":"5ac0f69329debd46cc594b42","shop_id":"5ac080399406da3ebc502238","cate_id":"5ac089e4a880f20358495509","title":"农夫山泉东方树叶茉莉花茶500ml","price":"4.5","description":"规格：500ml/瓶","num":11}]
                    for(var i=0;i<order.length;i++){
                        await DB.insert('shop_order_item',{
                            order_id:  shop_order_result.insertedId.toString(),
                            title:order[i].title,
                            price:order[i].price,
                            num:order[i].num,
                            status:1    /*状态是1 表示已经下厨     状态是2表示退菜*/
                        })
                    }
                }
                ctx.body={"success":'true',result:{  /*返回生成的订单号*/
                    order_id:order_id
                }}



        }

        

        //清空购物车数据
         await DB.remove('cart',{"uid":uid});
        ctx.body={"success":'true',"msg":"增加数据成功"};


    }catch(err){
        ctx.body={"success":'false',"msg":"增加数据失败"};
    }

})
//获取用户的订单信息
router.get('/getOrder',async ctx=>{

    var uid=ctx.query.uid;

   try{
        var orderResult=await  DB.find('shop_order',{"uid":uid,"order_status":{ $not:/2/},"pay_status":0});
        var orderItemResult=await  DB.find('shop_order_item',{"order_id":orderResult[0]._id.toString()});
        orderResult[0]['items']=orderItemResult;
        ctx.body={"success":'true','result':orderResult};

    }catch(e){
        ctx.body={"success":'false','message':'非法请求'};
    }

})

router.get('/affirmPay',async ctx=>{

    var uid=ctx.query.uid;

   try{
        var orderResult=await  DB.find('shop_order',{"uid":uid,"order_status":{ $not:/2/},"pay_status":1});
        var order_id = orderResult[0]._id+"";
        ctx.body={"success":'true','result':orderResult};
        console.log(order_id);
        // await DB.remove('shop_order',{"uid":uid,"order_status":{ $not:/2/},"pay_status":1});
        await DB.remove('peopleinfo',{"uid":uid});
        await DB.remove('shop_order_item',{"order_id":order_id});
        
    }catch(e){
        ctx.body={"success":'false','message':'非法请求'};
    }

})

router.get('/success',async ctx=>{

    var uid=ctx.query.uid;

   try{
        var orderResult=await  DB.find('shop_order',{"uid":uid,"order_status":{ $not:/2/},"pay_status":1});
        ctx.body={"success":'true','result':orderResult};
        await DB.remove('shop_order',{"uid":uid,"order_status":{ $not:/2/},"pay_status":1});
    }catch(e){
        ctx.body={"success":'false','message':'非法请求'};
    }

})
module.exports=router.routes();