import jwt from "jsonwebtoken";
import "dotenv/config";

const jwtAcessSecret = process.env.jwtAcessSecret;
const jwtRefreshSecret =  process.env.jwtRefreshSecret;

export function generateAccessToken(obj){
    return jwt.sign(obj,jwtAcessSecret,{expiresIn:'15d'});
}

export function generateRefreshToken(obj){
    return jwt.sign(obj,jwtRefreshSecret,{expiresIn:'15d'});
}
export function verifyAccessToken(token) {
    try{
        const decoded = jwt.verify(token, jwtAcessSecret);
        return decoded;
    }catch(err){
        return null;
    }
}

export function verifyRefreshToken(token){
    try{
        const decoded = jwt.verify(token,jwtRefreshSecret);
        return decoded;
    }catch{
        return null;
    }
}
