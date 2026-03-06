import redisClient from "../config/connectRedis.js";
export const cacheMiddlewareProject = (check, ttl=300)=>{
    return async (req,res, next)=>{
        try{
            const id = req.params?.id;
            const userId = req.user.userId;
            let key;
            if(check === "readProject") key = `project:${projectId}:${check}`;
            else if(check === "listProject") key = `user:${userId}:${check}`;
            
            const cachedData = await redisClient.get(key);
            if(cachedData){
                console.log("cachedHit data");
                return res.status(200).json(JSON.parse(cachedData));
            }
            console.log("cachedMiss data");

            const originalRes = res.json.bind(res);
            res.json = async (data)=>{
                try{
                    if(res.statusCode == 200)
                        await redisClient.set(
                            key,
                            JSON.stringify(data),
                            "EX",
                            7 * 24 * 60 * 60
                        );
                }catch{
                    console.log("error while setting");
                }
                originalRes(data);        
            }
            next();
        }catch(err){
            console.log("error occured",err);
            next();
            
        }
    }
}
