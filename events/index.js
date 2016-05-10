var redis = require('redis');
var each = require('async-each');
var config = require('./../config/'+ process.env.NODE_ENV || 'production' + ".json");
var sub = redis.createClient();
var pub = redis.createClient();
var client = redis.createClient();
var gameData =config.que;
var gameAns = config.ans;
sub.subscribe('quiz');
module.exports = function(io){
    io.on('connection', function(socket) {

        getGames(function(err,games){
                pub.publish('quiz',JSON.stringify(games));
        });
        //events
        socket.on('createGame',createGame);
        socket.on('join',join);
        socket.on('reqGame', reqGame);
        socket.on('rejectGame', rejectGame);
        socket.on('allowGame',allowGame);
        socket.on('joinGame', joinGame);    
        socket.on('gameCounter',gameCounter);
        socket.on('players',players);
        socket.on('checkans',checkans);

        /*
         Use Redis' 'sub' (subscriber) client to listen to any message from Redis to server.
         When a message arrives, send it back to browser using socket.io
         */
        sub.on('message', function(channel, message) {
            socket.emit(channel, message);
        });
    });
}


//functions
var createGame = function(data){
    if(!this.handshake.session.user){
        
        return;
    }

       data = JSON.parse(data);
            sub.subscribe('Game:'+data.gameName);
            getGames(function(err,games){
                pub.publish('quiz',JSON.stringify(games));
            });
            client.set('Game:'+data.gameName+':'+data.user.username,0);
};
var join =function(data) {
                if(!this.handshake.session.user){
                    
                    return;
                }
                getGames(function(err,games){
                pub.publish('quiz',JSON.stringify(games));
            });
}
var reqGame =function(data) {
            if(!this.handshake.session.user){
                    
                    return;
                }
            var data = JSON.parse(data);
            var obj = JSON.stringify({
                user:data.user,
                gameName:data.gameName,
                action:"joinRequest"
            });
            pub.publish('Game:'+data.gameName,obj);
}
var allowGame =function(data) {
            if(!this.handshake.session.user){
                return;
            }    
            var data = JSON.parse(data);
            var obj = JSON.stringify({
                user:data.user,
                gameName:data.gameName,
                action:"allowGame"
            });
            pub.publish('Game:'+data.gameName,obj);
}
var joinGame =function(data) {
            if(!this.handshake.session.user){
                    console.log("joinGame 403 close socket");
                
                return;
            }
            data = JSON.parse(data);
            sub.subscribe('Game:'+data.gameName);
            getUsers(data.gameName,function(err,user){
            if(!err){
                var length =user.length;
                if((length+1)<5){
                    client.set('Game:'+data.gameName+':'+data.user.username,0);
                    getUsers(data.gameName,function(err,players){
                        var obj = JSON.stringify({
                        user:data.user,
                        gameName:data.gameName,
                        players:players,
                        action:"players"
                        });
                        pub.publish('Game:'+data.gameName,obj);
                    });
                }
                else
                {
                    var obj = JSON.stringify({
                    user:data.user,
                    gameName:data.gameName,
                    msg:"Already max players in a game",
                    action:"error"
                    });
                    pub.publish('Game:'+data.gameName,obj);                    
                }
            }
            });
}
var gameCounter = function(data){
            if(!this.handshake.session.user){
                
                return;
            }
            data = JSON.parse(data);
            var i = 5;
            var timer =function(){
                var obj = JSON.stringify({
                    user:data.user,
                    gameName:data.gameName,
                    msg:"Game will start in "+i+" secs",
                    action:"gameCounter"
                });
            pub.publish('Game:'+data.gameName,obj);
            i--;
            if(i>0)
                setTimeout(timer,1000);
            else{
                    var obj = JSON.stringify({
                        user:data.user,
                        gameName:data.gameName,
                        que:gameData[0],
                        index:0,
                        action:"startGame"
                    });
                    pub.publish('Game:'+data.gameName,obj);
                }
            }
            timer();
}
var players = function(data){
            if(!this.handshake.session.user){
                
                return;
            }
            data =JSON.parse(data);
            getUsers(data.gameName,function(err,players){
                var obj = JSON.stringify({
                    gameName:data.gameName,
                    players:players,
                    action:'players'
                });
            pub.publish('Game:'+data.gameName,obj);      

            });
}
var rejectGame = function(data) {
            if(!this.handshake.session.user){
                
                return;
            }
            var data = JSON.parse(data);
            var obj = JSON.stringify({
                user:data.user,
                gameName:data.gameName,
                action:"rejectGame"
            });
            console.log(obj);
            pub.publish('Game:'+data.gameName,obj);
}
var checkans = function(data){
            if(!this.handshake.session.user){
                
                return;
            }
            data = JSON.parse(data);            
            var gameId= data.que.queId;
            var ans = search(gameId,gameAns);
            if(ans.ans === data.option){
                correctAns(data,function(err,value){
                    if(err)return ;
                    var obj = JSON.stringify({
                    user:data.user,
                    gameName:data.gameName,
                    score:value,
                    action:"score"
                    });
                    pub.publish('Game:'+data.gameName,obj);
                    var index = data.que.index;
                    if((index+1) > (gameData.length-1) ){
                        gameResults(data,function(err,results){
                            if(err)return;
                            var obj = JSON.stringify({
                                winner:results,
                                action:"endGame"
                                });
                            pub.publish('Game:'+data.gameName,obj);
                            sub.unsubscribe('Game:'+data.gameName);
                        getGames(function(err,games){
                            pub.publish('quiz',JSON.stringify(games));
                            });
                        });    
                        return; 
                    }
                    var obj = JSON.stringify({
                            user:data.user,
                            gameName:data.gameName,
                            que:gameData[index+1],
                            index:index+1,
                            action:"next"
                        });
                    pub.publish('Game:'+data.gameName,obj);
                });
                return;
            }
            wrongAns(data,function(err,value){
                if(err)return ;
                var obj = JSON.stringify({
                user:data.user,
                gameName:data.gameName,
                score:value,
                action:"score"
                });
                pub.publish('Game:'+data.gameName,obj);
            });


}

var getGames = function(callback){
    client.send_command('pubsub',['channels','Game:*'],function(err,data){
        if(err) return callback(err);
        callback(null,data);
    });
}
var getUsers = function(game,callback){
    client.keys('Game:'+game+':*',function(err,data){
        if(err) return callback(err);
        callback(null,data);
    });
}
var correctAns = function(data,callback){
    var key = 'Game:'+data.gameName+':'+data.user.username;
    client.get(key,function(err,value){
        if(value){
            value = parseInt(value);
            value += 3;
            callback(null,value);
        client.set('Game:'+data.gameName+':'+data.user.username,value);
        }
    });
};

var wrongAns = function(data,callback){
    var key = 'Game:'+data.gameName+':'+data.user.username;
    client.get(key,function(err,value){
        if(err)return callback(err);
        if(value){
            value = parseInt(value);
            value -= 3;
            callback(null,value);
        client.set('Game:'+data.gameName+':'+data.user.username,value);
        }
    });
};

var gameResults = function(data,callback){
    var key = 'Game:'+data.gameName+':*';
    client.keys(key,function(err,keys){
        if(err)return callback(err);
        each(keys,function(item,cb){
            var username = item.replace('Game:'+data.gameName+':','');
            client.get(item,function(err,value){
                if(err)return cb(err);
                var obj = {username:username,score:parseInt(value)};
                cb(null,obj);
            })
        },
        function(err,content){
            var highest =Number.NEGATIVE_INFINITY;
            var winner = "";
            for(var i=0;i<content.length;i++){
                    if(content[i].score>highest){
                        highest = content[i].score;
                        winner  = content[i];
                    }
            }
            console.log(winner);
            callback(null,winner);
            delKeys(data);
        });
    });
};

var delKeys = function(data){
    var key = 'Game:'+data.gameName+':*';
    client.keys(key,function(err,keys){
        if(err)return console.log(err);
        for(var i=0;i<keys.length;i++){
            client.del(keys[i]);
        }
    });
}
var search = function(nameKey, myArray){
    for (var i=0; i < myArray.length; i++) {
        if (myArray[i].queId === nameKey) {
            return myArray[i];
        }
    }
}