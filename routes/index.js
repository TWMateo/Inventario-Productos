//Es la ruta necesaria para ejecutar el programa
//Exportamos los paquetes de la variable 'Router' del paquete de express.
const express = require('express');
const {Router}=express
//Creamos una variable para instanciar una variable para usar 
//el paquete exportado
const router =Router()
const {getPrueba,updateProductoById,updateEstadoProductoById,getProductos, postCreateProducto,getProductosById} = require('../controllers/controlador-producto')
const {getAjuste, postCreateAjuste, updateAjusteDetalleById, postCreateDetalleAjuste} = require('../controllers/controlador-ajuste')
//Rutas
router.get('/pruebaApi',getPrueba)
//PRODUCTOS
router.get('/productos',getProductos)
router.get('/productos/id/:pro_id',getProductosById)
router.post('/productos/nuevo', postCreateProducto)
router.put('/updateProducto',updateProductoById)
router.put('/updateEstadoProducto',updateEstadoProductoById)
router.put('/updateAjusteDetalle/:aju_det_id',updateAjusteDetalleById )

//AJUSTE
router.get('/ajustes',getAjuste)
router.post('/ajustes/nuevo', postCreateAjuste)
router.post('/detalles/nuevo',postCreateDetalleAjuste )


//Paquetes a exportar
module.exports = router

