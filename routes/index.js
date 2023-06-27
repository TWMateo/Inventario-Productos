//Es la ruta necesaria para ejecutar el programa
//Exportamos los paquetes de la variable 'Router' del paquete de express.
const express = require('express');
const cors = require('cors')
const { Router } = express
const jwt = require('jsonwebtoken')
const { db } = require('../cnn')
//Con esto podemos acceder al uso de las variables de entorno en .env
require('dotenv').config()

const router = Router()
router.use(express.urlencoded({ extended: false }))
router.use(express.json())
router.use(cors())

//Creamos una variable para instanciar una variable para usar 
//el paquete exportado
const { getCategorias, getCategoriaById, getCategoriaByName, updateCategoria, deleteCategoria, postCreateCategoria } = require('../controllers/controlador-categoria')
const { getPrueba, updateProductoById, updateEstadoProductoById, getProductos, postCreateProducto, getProductosById, getProductosByName, deleteProducto, getAtributosProById} = require('../controllers/controlador-producto')
const { getAjuste, postCreateAjuste, updateAjusteDetalleById, postCreateDetalleAjuste} = require('../controllers/controlador-ajuste')
//Rutas
router.get('/pruebaApi', getPrueba)

//CATEGORÍAS
router.get('/categorias',validateAccesToken, getCategorias)
router.get('/categorias/id/:cat_id', validateAccesToken, getCategoriaById)
router.get('/categorias/nombre/:cat_nombre', validateAccesToken, getCategoriaByName)
router.post('/categorias/nuevo', validateAccesToken, postCreateCategoria)
router.put('/updateCategoria/:cat_id', validateAccesToken, updateCategoria) 
router.put('/categorias/delete', validateAccesToken, deleteCategoria) 

//PRODUCTOS
router.get('/productos', validateAccesToken,getProductos)
router.get('/productos/id/:pro_id', validateAccesToken, getProductosById)
router.get('/productos/atributos/:pro_id',getAtributosProById)
router.get('/productos/nombre/:pro_nombre',getProductosByName)
router.post('/productos/nuevo', validateAccesToken, postCreateProducto)
router.put('/updateProducto', validateAccesToken, updateProductoById)
router.put('/productos/delete', validateAccesToken, deleteProducto) 
router.put('/updateEstadoProducto', validateAccesToken, updateEstadoProductoById)
router.put('/updateAjusteDetalle/:aju_det_id', validateAccesToken, updateAjusteDetalleById)

//AJUSTE
router.get('/ajustes', getAjuste)
router.post('/ajustes/nuevo', validateAccesToken, postCreateAjuste)
router.post('/detalles/nuevo', validateAccesToken, postCreateDetalleAjuste)

//Autenticacion y generacion de token
router.get('/auth', async (req, res) => {
    const { username, password } = req.body
    const aut = await db.any('SELECT * FROM usuario WHERE usu_nombre = \'' + username + '\' AND usu_password = \'' + password + '\'')
    if (!aut[0]) return res.json({
        message: 'Usuario o contraseña incorrectas'
    })
    const user = {
        username: username
    }
    const accesToken = generateAccesToken(user)
    res.header('authorization', accesToken).json({
        message: 'Usuario autenticado',
        token: accesToken
    })
})

function validateAccesToken(req, res, next) {
    const accesToken = req.headers['authorization']
    if (!accesToken) res.json({
        message: 'Acceso denegado falta de token'
    })
    jwt.verify(accesToken, process.env.clave, (err, user) => {
        if (err) {
            res.json({
                message: 'Acceso denegado, token invalido o incorrecto'
            })
        } else {
            req.user = user
            next()
        }
    })
}

function generateAccesToken(user) {
    return jwt.sign(user, process.env.clave, { expiresIn: '24h' });
}

module.exports = router

