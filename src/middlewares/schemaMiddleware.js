export function  schemaMiddleware(schema){
    return (req,res,next)=>{
        const {error} = schema.validate(req.body);
        if(error){
            return res.status(400).json({message:"not validated", details:error.details[0]});
        }
        next();
    }
}