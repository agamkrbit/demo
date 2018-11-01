var Router = require('express-promise-router');
var db = require('../db/db');
var bcrypt = require('bcrypt');
var jsonwebtoken = require('jsonwebtoken');
var secretKey = 'demo';
const saltRounds = 10;
const router = new Router();

const tokenValidator = async(req, res, next) => {
    let token = req.headers.authorization || '';
    if(token && token.trim()){
        try{
            var decode = await jsonwebtoken.verify(token, secretKey);
            if(decode){
                req.user = decode;
                next();
            }else{
                throw error('unauthorized');
            }
        }catch(error){
            res.status(200).json({
                status : 'error',
                message : 'unauthorized'
            })
        }
    }else{
        res.status(200).json({
            status : 'error',
            message : 'unauthorized'
        })
    }
};

router.post('/register',async (req, res) => {
    const { fullname , email, password } = req.body;
    //checking for all the required parameters
    if(fullname && fullname.trim() && email && email.trim() && password && password.trim()){
        //validating email pattern
        if(/^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/.test(email)){
            try{
                //cheking for existing email;
                var {rows} = await db.query('SELECT * FROM "users" WHERE "email"=$1', [email]);
                if(rows.length !== 0){
                    res.status(200).json({
                        status : 'error',
                        message : 'email already exists'
                    })
                }else{
                    const hashed_password = bcrypt.hashSync(password, saltRounds);
                    const insertQuery = 'INSERT INTO "users"("fullname", "email", "password") VALUES($1, $2, $3)';
                    let values = [fullname, email, hashed_password];
                    var {rowCount} = await db.query(insertQuery, values);
                    if(rowCount === 1){
                        var {rows } = await db.query('SELECT "user_id" FROM "users" WHERE "email"=$1', [email]);
                        if(rows.length !== 0){
                            res.status(200).json({
                                status : 'success',
                                message : 'registered successfully',
                                user_id : rows[0].user_id
                            })
                        }else{
                            throw error('db error');
                        }
                    }else{
                        throw error('db error');
                    }
                }
            }catch(error){
                console.log(error);
                res.status(200).json({
                    status : 'error',
                    message : 'internal error'
                })
            }
        }else{
            res.status(200).json({
                status : 'error',
                message : 'invalid email'
            })
        }
    }else{
        res.status(200).json({
            status : 'error',
            message : 'missing parameters'
        })
    }
});

router.post('/log', async (req, res) => {
    const { email, password} = req.body;
    if(email && email.trim() && password && password.trim()){
        try{
                //getting user data
                var {rows} = await db.query('SELECT * FROM "users" WHERE "email"=$1', [email]);
                if(rows.length > 0){
                    const user = rows[0];
                    var check = bcrypt.compareSync(password, user.password);
                    if(check){
                        const token  = await jsonwebtoken.sign(user, secretKey);
                        res.status(200).json({
                            status : 'success',
                            message : 'successfully logged in',
                            token : token
                        })
                    }else{
                        res.status(200).json({
                            status : 'error',
                            message : 'invalid email or password'
                        })
                    }
                }else{
                    res.status(200).json({
                        status : 'error',
                        message : 'email is not registered'
                    })
                }        
        }catch(error){
            res.status(200).json({
                status : 'error',
                message : 'internal error'
            })
        }
    }else{
        res.status(200).json({
            status : 'error',
            message : 'missing parameters'
        })
    }
})

router.put('/profile', tokenValidator, async(req, res) => {
    const { fullname } = req.body;
    if(fullname && fullname.trim()){
        try{
            const updateQuery = 'UPDATE "users" SET "fullname" = $1 where "email"=$2';
            var values = [fullname, req.user.email];
            var {rowCount} = await db.query(updateQuery, values);
            if(rowCount === 1){
                res.status(200).json({
                    status : 'success',
                    message : 'successfully updated user'
                })
            }else{
                res.status(200).json({
                    status : 'error',
                    message : 'email is not registered'
                })
            }
        }catch(error){
            res.status(200).json({
                status : 'error',
                message : 'internal error'
            })
        }
    }else{
        res.status(200).json({
            status : 'error',
            message : 'missing paramter'
        })
    }
})
router.get('/profile',tokenValidator, async (req, res) => {
    try{
        var {rows} = await db.query('SELECT * FROM "users" WHERE "email"=$1', [req.user.email]);
        if(rows.length){
            const user = rows[0];
            res.status(200).json({
                status : 'success',
                message : 'successfull get profile',
                profile : {
                    fullname : user.fullname,
                    email : user.email
                }
            });
        }else{
            res.status(200).json({
                status : 'error',
                message : 'user not exist'
            })
        }        
    }catch(error){
        res.status(200).json({
            status : 'error',
            message : 'internal error'
        })
    }
})
module.exports = router;