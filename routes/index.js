//Es la ruta necesaria para ejecutar el programa
//Exportamos los paquetes de la variable 'Router' del paquete de express.
const {Router}=require('express')
//Creamos una variable para instanciar una variable para usar 
//el paquete exportado
const router =Router()
const {getPrueba} = require('../controllers/controlador-producto')
//Rutas
router.get('/pruebaApi',getPrueba)

//Paquetes a exportar
module.exports = router

