//Es la ruta necesaria para ejecutar el programa
//Exportamos los paquetes de la variable 'Router' del paquete de express.
const {Router}=require('express')
//Creamos una variable para instanciar una variable para usar 
//el paquete exportado
const router =Router()
const {getPrueba,updateProductoById,updateEstadoProductoById,getProductos, postCreateProducto,getProductosById} = require('../controllers/controlador-producto')
//Rutas
router.get('/pruebaApi',getPrueba)
//PRODUCTOS
router.get('/productos',getProductos)
router.get('/productos/id/:pro_id',getProductosById)
router.post('/productos/', postCreateProducto)
router.put('/updateProducto',updateProductoById)
router.put('/updateEstadoProducto',updateEstadoProductoById)
//Paquetes a exportar
module.exports = router

