const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const Stripe = require('stripe')

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 8080;

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
app.get("/api", (req, res) => {
  res.send("Server is running");
});

//sign up
app.post("/api/signup", async (req, res) => {
  try{
    const { firstName,lastName,password,confirmPassword,email } = req.body
    // const emailRegex = /\b[A-Za-z0-9._%+-]+@gmail\.com\b/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const user = await userModel.findOne({email})

    console.log("user",req.body)

    if(user){
        throw new Error("Already user exits.")
    }

    if(!firstName){
      throw new Error("Please provide name")
  }
  if(!lastName){
      throw new Error("Please provide lastname")
  }
    if(!email){
       throw new Error("Please provide email")
    }
    if(!emailRegex.test(email)){
       throw new Error("Invalid email format please enter email format.")
    }
    if(!password){
        throw new Error("Please provide password")
    }
    if(!confirmPassword){
        throw new Error("Please provide confirmPassword")
    }
    if (password !== confirmPassword) {
      throw new Error( "Passwords do not match" );
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
    // userModel.findOne({ email: email }, (err, result) => {
    //   // console.log(result);
    //   console.log(err);
    //   if (result) {
    //     res.send({ message: "Email id is already register", isSuccess: false });
    //   } else {
    //     const data = userModel(req.body);
    //     const save = data.save();
    //     res.send({ message: "Successfully sign up", isSuccess: true });
    //   }
    // });
  }
  catch(err){
    res.json({
        message : err.message || err  ,
        error : true,
        success : false,
    })
}
  // console.log(req.body);
  // const {firstName,lastName,password,confirmPassword,email } = req.body;

 
});

//api login
// app.post("/login", (req, res) => {
//   // console.log(req.body);
//   try{
//     const { email, password, confirmPassword } = req.body;
//     const user =  userModel.findOne({ email });
//     if (!user) {
//             return res.status(401).json({ message: "Invalid email or password" });
//           }
      
//           // Check if password matches confirm password
//           if (password !== confirmPassword) {
//             return res.status(401).json({ message: "Password and confirm password do not match" });
//           }
      
//           // Check if password matches user's password
//           if (password !== user.password) {
//             return res.status(401).json({ message: "Invalid password" });
//           }
//           res.status(200).json({ message: "Login successful" });
//   }catch (error) {
//         console.error("Error logging in:", error);
//         res.status(500).json({ message: "Internal server error" });
//       }
//   userModel.findOne({ email: email }, (err, result) => {
//     if (result) {
//       const dataSend = {
//         _id: result._id,
//         firstName: result.firstName,
//         lastName: result.lastName,
//         password: result.passwordcon,
//         confpassword: result.confirmPassword,
//         lastName: result.lastName,
//         email: result.email,
//         image: result.image,
//       };
//       console.log(dataSend);
//       res.send({
//         message: "Login is successfully",
//         isSuccess: true,
//         data: dataSend,
//       });
//     } else {
//       res.send({
//         message: "Email is not available, please sign up",
//         isSuccess: false,
//       });
//     }
//   });
// });





app.post('/api/login', async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    // Find user by email
    const user = await userModel.findOne({ email });
    let responseData = {
      isSuccess: false,
      userData: null,
      errorMessage: []
    };
    // If user not found
    if (!user) {
      responseData.errorMessage.push("User not found ");
    }

    // Check if password and confirm password match
     // Check if password and confirm password match
     if (password !== confirmPassword) {
      responseData.errorMessage.push("Passwords don't match");
    } else if (user && password !== user.password) {
      responseData.errorMessage.push("Password invalid");
    }
    if (responseData.errorMessage.length > 0) {
      return res.status(401).json(responseData);
    }

    // Login successful
    // console.log("User logged in:", user);
    // res.status(200).json({ isSuccess: true, message: "Login successful",user });
    responseData.isSuccess = true;
    responseData.userData = user;
    res.status(200).json(responseData);

  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ isSuccess: false, userData: null, errorMessage: "Internal server error" });
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
