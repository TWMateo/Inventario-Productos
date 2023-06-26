const express = require('express')
const { db } = require('../cnn')

const getPrueba = (req, res) => {
    console.log('Funciona')
    res.send('Funciona el metodo de prueba original')
}

const getProductos = async (req, res) => {
    try {
        let response = []
        const productos = await db.any(`select pro_id, pro_nombre, pro_descripcion, pro_valor_iva, pro_costo, pro_pvp, pro_imagen, pro_stock 
            from producto where pro_estado=true ORDER BY pro_id;`)
        for (let i = 0; i < productos.length; i++) {
            const categoria = await db.one(`select cat.cat_id, cat.cat_nombre from categoria cat, producto pro 
                where pro.cat_id=cat.cat_id and pro.pro_id=$1;`, [productos[i].pro_id])

            //calculo de stock
            /* let total = 0
             const ajuste_stock = await ajustesStock(productos[i].pro_id);
             if (ajuste_stock.sum != null)
                 total += parseInt(ajuste_stock.sum)
             console.log(total)
             productos[i].pro_stock = total*/
            productos[i].pro_categoria = categoria
            response.push(productos[i])
        }
        res.json(response)
    } catch (error) {
        console.log(error.Mensaje)
        res.json({ Mensaje: error.Mensaje })
    }
}

const getProductosById = async (req, res) => {
    try {
        const pro_id = req.params.pro_id
        const response = await db.one(`select pro_id, pro_nombre, pro_descripcion, pro_valor_iva, pro_costo, pro_pvp, pro_imagen, pro_stock 
            from producto where pro_id=$1 and pro_estado=true;`, [pro_id])
        const categoria = await db.one(`select cat.cat_id, cat.cat_nombre from categoria cat, producto pro 
            where pro.cat_id=cat.cat_id and pro.pro_id=$1;`, [pro_id])

        response.pro_categoria = categoria
        res.json(response)
    } catch (error) {
        console.log(error.Mensaje)
        res.json({ Mensaje: error.Mensaje })
    }
}

const getProductosByName = async (req, res) => {
    try {
        const pro_nombre = req.params.pro_nombre
        const response = await db.one(`select pro_id, pro_nombre, pro_descripcion, pro_valor_iva, pro_costo, pro_pvp, pro_imagen, pro_stock 
            from producto where pro_nombre=$1 and pro_estado=true`, [pro_nombre])
        const categoria = await db.one(`select cat.cat_id, cat.cat_nombre from categoria cat, producto pro 
            where pro.cat_id=cat.cat_id and pro.pro_id=$1;`, [response.pro_id])
        response.pro_categoria = categoria
        res.json(response)
    } catch (error) {
        console.log(error.message)
        res.json({ message: error.message })
    }
}

const postCreateProducto = async (req, res) => {
    try {
        const { pro_nombre, pro_descripcion, cat_id, pro_valor_iva, pro_costo, pro_pvp, pro_imagen } = req.body
        const response = await db.one(`INSERT INTO public.producto(pro_nombre, pro_descripcion, cat_id, pro_valor_iva, pro_costo, 
            pro_pvp, pro_imagen, pro_estado, pro_stock) VALUES ($1,$2,$3,$4,$5,$6,$7,true, null) RETURNING*;`,
            [pro_nombre, pro_descripcion, cat_id, pro_valor_iva, pro_costo, pro_pvp, pro_imagen])
        res.json(
            {
                Mensaje: "Producto creado con éxito",
                response: response
            }
        )
    } catch (error) {
        console.log(error.Mensaje)
        res.json({ Mensaje: error.Mensaje })
    }
}

const updateEstadoProductoById = async (req, res) => {
    const { pro_id, pro_estado } = req.body
    if (pro_id.length == 0) {
        return res.json({
            mensaje: 'Error',
            response: 'Revise el parametro pro_id.'
        })
    }
    if (pro_estado.length == 0) {
        return res.json({
            mensaje: 'Error',
            response: 'Revise el parametro pro_estado.'
        })
    }
    try {
        const response = await db.none('UPDATE PRODUCTO SET pro_estado = $2 WHERE pro_id = $1', [pro_id, pro_estado])
        return res.json(
            {
                mensaje: 'Correcto',
                response: 'Estado de producto actualizado a ' + pro_estado + ' exitosamente.'
            }
        )
    } catch (error) {
        return res.json(
            {
                mensaje: 'Error',
                response: 'Error con la sentencia SQL ' + error.Mensaje + '.'
            }
        )
    }
}

const updateProductoById = async (req, res) => {
    const { pro_id, pro_campo } = req.body
    let respuesta = ''
    if (pro_id.length == 0) {
        return res.json({
            mensaje: 'Error',
            response: 'Revise el parametro pro_id.'
        })
    }
    if (pro_campo.length == 0) {
        return res.json({
            mensaje: 'Error',
            response: 'Revise el parametro pro_campo.'
        })
    }
    try {
        const sentencia = pro_campo.forEach(async valores => {
            const response = await db.none('UPDATE PRODUCTO SET ' + valores['campo'] + ' = $2 WHERE pro_id = $1', [pro_id, valores['valor']])
            //respuesta+='Producto con id ' + pro_id + ' actualizo el campo ' + valores['campo'] + ' con el valor ' + valores['valor']+'\n'
        })
        return res.json({
            mensaje: 'Correcto',
            response: 'Campos actualizados del producto con id '+pro_id
        })
    } catch (error) {
        return res.json({
            mensaje: 'Error',
            response: 'Error con la sentencia SQL ' + error.Mensaje + '.'
        })
    }
}

const deleteProducto = async (req, res) => {
    try {
        const { pro_id } = req.body
        const response = await db.one('UPDATE producto SET pro_estado=false WHERE pro_id=$1 RETURNING*;', [pro_id])
        res.json(
            {
                message: "Producto desactivado con éxito",
                response
            }
        )
    } catch (error) {
        console.log(error.message)
        res.json({ message: error.message })
    }
}

const getAtributosProById = async (req, res) => {
    try {
        const pro_id = req.params.pro_id
        const response = await db.one(`select  pro_valor_iva, pro_pvp, pro_stock from producto where pro_id = $1;`, [pro_id])
        res.json(response)
    } catch (error) {
        console.log(error.Mensaje)
        res.json({ Mensaje: error.Mensaje })
    }
}

module.exports = {
    getPrueba, updateProductoById, updateEstadoProductoById, getProductos, postCreateProducto, getProductosById, deleteProducto, getProductosByName, getAtributosProById
}