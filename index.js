//console.log("Hola mundo, hola 2023")
//const {db} = require('./cnn')
//1,Packages
const express=require('express')

//2.Inicializo
const app = express()

//3.Midlewears(permite configurar el paquete --app)
app.use(express.json())//formato que uso
app.use(express.urlencoded({extended:true}))//la direccion de la url esta codificada

//5.Routes-> Rutas que usara
app.use(require('./routes/index.js'))

//4.Server execution
/*
const server = http.createServer(app)
const PORT = process.env.PORT || 4000
app.use(cors())
*/

app.listen(3000)//Puede ser cualquier puerto pero frecuentemente se usa 3000
app.get('/',(req,res)=>{res.send('Welcome to libros API-REST!!')})
console.log('Server running in: http://localhost:3000')

// console.log("Hola mundo, hola 2023")
// Exportamos el objeto que queremos usar y guardamos en un
const {db} = require('./cnn')