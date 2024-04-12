const express = require("express");
// const dotenv = require('dotenv')
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const Stripe = require('stripe')

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const PORT = process.env.PORT || 8080;
const options = {
  swaggerDefinition: {
   
    info: {
      title: 'Priyaranjan ',
      version: '1.0.0',
      description: 'This api user authentication uses',
      paths:"Dog",
      contact: {
        name: 'JSONPlaceholder',
        url: 'https://jsonplaceholder.typicode.com',
      },
      license: {
        name: 'Licensed Under MIT',
        url: 'https://spdx.org/licenses/MIT.html',
      },

    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server'
      }
    ],
  },
  
  apis: ['index.js'] // Path to your main file
};

const specs = swaggerJsdoc(options);
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(specs));

//mongodb connection
mongoose.set("strictQuery", false);
mongoose
  .connect("mongodb://localhost:27017")
  .then(() => console.log("Connect to Databse"))
  .catch((err) => console.log(err));

//schema
const userSchema = mongoose.Schema({
  firstName: String,
  lastName: String,
  email: {
    type: String,
    unique: true,
  },
  password: String,
  confirmPassword: String,
  image: String,
});

//
const userModel = mongoose.model("userData", userSchema);

//api
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Define signup route
/**
 * @swagger
 * /api/signup:
 *   post:
 *     summary: Create a new user
 *     description: Endpoint for user signup
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: user
 *         description: User object
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *             password:
 *               type: string
 *             confirmPassword:
 *               type: string
 *     responses:
 *       201:
 *         description: User created successfully
 */
//sign up
app.post("/api/signup", async (req, res) => {
  try{
    const { firstName,lastName,password,confirmPassword,email } = req.body
    // const emailRegex = /\b[A-Za-z0-9._%+-]+@gmail\.com\b/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const user = await userModel.findOne({email})
    console.log("user",req.body)

    if(user){
        throw new Error("User Already Exist.")
    }

    if(!firstName){
      throw new Error("Please Enter firstname")
  }
  if(!lastName){
      throw new Error("Please Enter lastname")
  }
    if(!email){
       throw new Error("Please Enter email")
    }
    if(!emailRegex.test(email)){
       throw new Error("Invalid email format please enter email format.")
    }
    if(!password){
        throw new Error("Please Enter password")
    }
    if(!confirmPassword){
        throw new Error("Please Enter confirmPassword")
    }
    if (password !== confirmPassword) {
      throw new Error( "Passwords do't  match" );
    }
    
    const payload = {
      ...req.body,
      role : "GENERAL",
      password : password
  }
    const userData = new userModel(payload)
    const saveUser = await userData.save()

    res.status(201).json({
        data : saveUser,
        issuccess : true,
        error : false,
        message : "User created Successfully!"
    })
  }
  catch(err){
    res.json({
        message : err.message || err  ,
        error : true,
        success : false,
    })
}
});

// Define login route
/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Login to the application
 *     description: Endpoint for user login
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: credentials
 *         description: User credentials
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             userName:
 *               type: string
 *             password:
 *               type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid email or password
 */

app.post('/api/login', async (req, res) => {
  try {
    const { userName, password} = req.body;

    // Find user by email
    const user = await userModel.findOne({ email: userName });
    let responseData = {
      isSuccess: false,
      data: null,
      errorMessage: []
    };
    // If user not found
      // If user not found
      if (!user) {
        responseData.errorMessage.push("User not found");
      } else {
        // If password is correct
        if (user.password === password) {
          const userData = { username: user.email };
          responseData.isSuccess = true;
          responseData.data = user;
        } else {
          responseData.errorMessage.push("Invalid password");
        }
      }
  
      res.status(200).json(responseData);
      console.log("userAfetrLogin",user)

  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ isSuccess: false, data: null, errorMessage: "Internal server error" });
  }
});


// all User
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 */
app.get('/api/users', async (req, res) => {
  try {
    const users = await userModel.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//product section

const schemaProduct = mongoose.Schema({
  name: String,
  category:String,
  image: String,
  price: String,
  description: String,
});
const productModel = mongoose.model("product",schemaProduct)



//save product in data 
//api
app.post("/uploadProduct",async(req,res)=>{
    // console.log(req.body)
    const data = await productModel(req.body)
    const datasave = await data.save()
    res.send({message : "Upload successfully"})
})

//
app.get("/product",async(req,res)=>{
  const data = await productModel.find({})
  res.send(JSON.stringify(data))
})
 
/*****payment getWay */
console.log(process.env.STRIPE_SECRET_KEY)


const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY)

app.post("/create-checkout-session",async(req,res)=>{

     try{
      const params = {
          submit_type : 'pay',
          mode : "payment",
          payment_method_types : ['card'],
          billing_address_collection : "auto",
          shipping_options : [{shipping_rate : "shr_1N0qDnSAq8kJSdzMvlVkJdua"}],

          line_items : req.body.map((item)=>{
            return{
              price_data : {
                currency : "inr",
                product_data : {
                  name : item.name,
                  // images : [item.image]
                },
                unit_amount : item.price * 100,
              },
              adjustable_quantity : {
                enabled : true,
                minimum : 1,
              },
              quantity : item.qty
            }
          }),

          success_url : `${process.env.FRONTEND_URL}/success`,
          cancel_url : `${process.env.FRONTEND_URL}/cancel`,

      }

      
      const session = await stripe.checkout.sessions.create(params)
      // console.log(session)
      res.status(200).json(session.id)
     }
     catch (err){
        res.status(err.statusCode || 500).json(err.message)
     }

})




//server is ruuning
app.listen(PORT, () => console.log("server is running at port : " + PORT));
