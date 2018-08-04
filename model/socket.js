/**
 * Created by wanghuapeng on 2018/3/19 0019.
 */
const IO = require( 'koa-socket' );
const url=require('url');
const io = new IO();

var socketIo={


    init:function(app) {
        io.attach(app);
        /*注册启动*/

        app._io.on('connection', socket => {

            console.log('连接成功');
            var requestUrl = socket.request.url;
            var roomid = url.parse(requestUrl, true).query.roomid; // 获取房间ID


		    socket.join(roomid);
            //加入购物车
            socket.on('addcart', function (data) {

                console.log('addcart');
                //对房间内的用户发送消息
                socket.broadcast.to(roomid).emit('addcart', 'addcart');//不包括自己
            });

        })
    }



}


module.exports=socketIo;