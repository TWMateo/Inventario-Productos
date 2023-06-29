const express = require('express')
const { db } = require('../cnn')

const getPrueba = (req, res) => {
    console.log('Funciona')
    res.send('Funciona el metodo de prueba original')
}

const getProductos = async (req, res) => {
    try {
        let response = []
        const productos = await db.any(`
            SELECT pro.pro_id, pro.pro_nombre, pro.pro_descripcion, pro.pro_valor_iva, pro.pro_costo, pro.pro_pvp, pro.pro_imagen, pro.pro_stock,
            cat.cat_id, cat.cat_nombre 
            FROM producto pro 
            LEFT JOIN categoria cat ON pro.cat_id = cat.cat_id 
            WHERE pro.pro_estado=true ORDER BY pro.pro_id;`)

        //calculo de stock
        /* for (let i = 0; i < productos.length; i++) {
            let total = 0
            const ajuste_stock = await ajustesStock(productos[i].pro_id);
            if (ajuste_stock.sum != null)
                total += parseInt(ajuste_stock.sum)
            console.log(total)
            productos[i].pro_stock = total
            productos[i].pro_categoria = {
                cat_id: productos[i].cat_id,
                cat_nombre: productos[i].cat_nombre
            }
        } */

        res.json(productos)
    } catch (error) {
        console.log(error.Mensaje)
        res.json({ Mensaje: error.Mensaje })
    }
}

const getProductosById = async (req, res) => {
    try {
        const pro_id = req.params.pro_id;
        const response = await db.one(
            `SELECT pro.pro_id, pro.pro_nombre, pro.pro_descripcion, pro.pro_valor_iva, pro.pro_costo, pro.pro_pvp, pro.pro_imagen, pro.pro_stock, cat.cat_id, cat.cat_nombre
        FROM producto pro
        INNER JOIN categoria cat ON pro.cat_id = cat.cat_id
        WHERE pro.pro_id = $1 AND pro.pro_estado = true;`,
            [pro_id]
        );
        res.json(response);
    } catch (error) {
        console.log(error.Mensaje);
        res.json({ Mensaje: error.Mensaje });
    }
};

const getProductosByName = async (req, res) => {
    try {
        const pro_nombre = req.params.pro_nombre;
        const response = await db.one(
            `SELECT pro.pro_id, pro.pro_nombre, pro.pro_descripcion, pro.pro_valor_iva, pro.pro_costo, pro.pro_pvp, pro.pro_imagen, pro.pro_stock, cat.cat_id, cat.cat_nombre
        FROM producto pro
        INNER JOIN categoria cat ON pro.cat_id = cat.cat_id
        WHERE pro.pro_nombre = $1 AND pro.pro_estado = true;`,
            [pro_nombre]
        );
        res.json(response);
    } catch (error) {
        console.log(error.message);
        res.json({ message: error.message });
    }
};

const getProductosD = async (req, res) => {
    try {
        let response = []
        const productos = await db.any(`
        SELECT pro.pro_id, pro.pro_nombre, pro.pro_descripcion, pro.pro_valor_iva, pro.pro_costo, pro.pro_pvp, pro.pro_imagen, pro.pro_stock,
        cat.cat_id, cat.cat_nombre 
        FROM producto pro 
        LEFT JOIN categoria cat ON pro.cat_id = cat.cat_id 
        WHERE pro.pro_estado = false ORDER BY pro.pro_id;`)

        //calculo de stock
        /* for (let i = 0; i < productos.length; i++) {
            let total = 0
            const ajuste_stock = await ajustesStock(productos[i].pro_id);
            if (ajuste_stock.sum != null)
                total += parseInt(ajuste_stock.sum)
            console.log(total)
            productos[i].pro_stock = total
            productos[i].pro_categoria = {
                cat_id: productos[i].cat_id,
                cat_nombre: productos[i].cat_nombre
            }
        } */

        res.json(productos)
    } catch (error) {
        console.log(error.Mensaje)
        res.json({ Mensaje: error.Mensaje })
    }
}

const getProductosByIdD = async (req, res) => {
    try {
        const pro_id = req.params.pro_id;
        const response = await db.one(
            `SELECT pro.pro_id, pro.pro_nombre, pro.pro_descripcion, pro.pro_valor_iva, pro.pro_costo, pro.pro_pvp, pro.pro_imagen, pro.pro_stock, cat.cat_id, cat.cat_nombre
        FROM producto pro
        INNER JOIN categoria cat ON pro.cat_id = cat.cat_id
        WHERE pro.pro_id = $1 AND pro.pro_estado = false;`,
            [pro_id]
        );
        res.json(response);
    } catch (error) {
        console.log(error.Mensaje);
        res.json({ Mensaje: error.Mensaje });
    }
};

const getProductosByNameD = async (req, res) => {
    try {
        const pro_nombre = req.params.pro_nombre;
        const response = await db.one(
            `SELECT pro.pro_id, pro.pro_nombre, pro.pro_descripcion, pro.pro_valor_iva, pro.pro_costo, pro.pro_pvp, pro.pro_imagen, pro.pro_stock, cat.cat_id, cat.cat_nombre
        FROM producto pro
        INNER JOIN categoria cat ON pro.cat_id = cat.cat_id
        WHERE pro.pro_nombre = $1 AND pro.pro_estado = false;`,
            [pro_nombre]
        );
        res.json(response);
    } catch (error) {
        console.log(error.message);
        res.json({ message: error.message });
    }
};

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
            if ((valores['campo'] === 'pro_stock' || valores['campo'] === 'pro_valor_iva'
                || valores['campo'] === 'pro_costo' || valores['campo'] === 'pro_pvp')
                && valores['valor'] < 0) {
                return res.json({
                    mensaje: 'Error',
                    response: 'El valor asigando no puede ser menor que 0'
                })
            }
            const response = await db.none('UPDATE PRODUCTO SET ' + valores['campo'] + ' = $2 WHERE pro_id = $1', [pro_id, valores['valor']])
        })
        return res.json({
            mensaje: 'Correcto',
            response: 'Campos actualizados del producto con id ' + pro_id
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

const putUpdateProducto = async (req, res) => {
    try {
        const { pro_id, pro_nombre, pro_descripcion, cat_id, pro_iva, pro_costo, pro_pvp, pro_imagen } = req.body
        const response = await db.one(`UPDATE producto SET pro_nombre=$2, pro_descripcion=$3, cat_id=$4, pro_iva=$5, 
        pro_costo=$6, pro_pvp=$7, pro_imagen=$8 WHERE pro_id=$1 RETURNING*`,
            [pro_id, pro_nombre, pro_descripcion, cat_id, pro_iva, pro_costo, pro_pvp, pro_imagen])
        res.json(
            {
                message: "Producto actualizado con éxito",
                response
            }
        )
    } catch (error) {
        console.log(error.message)
        res.json({ message: error.message })
    }
}



module.exports = {
    getPrueba,
    updateProductoById,
    updateEstadoProductoById,
    getProductos,
    postCreateProducto,
    getProductosById,
    deleteProducto,
    getProductosByName,
    getAtributosProById,
    getProductosD,
    getProductosByIdD,
    getProductosByNameD,
    putUpdateProducto
}