const express = require('express')
const { db } = require('../cnn')

const getPrueba = (req, res) => {
    console.log('Funciona')
    res.send('Funciona el metodo de prueba original')
}

const getProductos = async (req, res) => {
    try {
        let response = []
        const productos = await db.any(`select pro_id, pro_nombre, pro_descripcion, pro_iva, pro_costo, pro_pvp, pro_imagen 
            from producto where pro_estado=true ORDER BY pro_id;`)
        for (let i = 0; i < productos.length; i++) {
            const categoria = await db.one(`select cat.cat_id, cat.cat_nombre from categoria cat, producto pro 
                where pro.cat_id=cat.cat_id and pro.pro_id=$1;`, [productos[i].pro_id])
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
        const response = await db.one(`select pro_id, pro_nombre, pro_descripcion, pro_iva, pro_costo, pro_pvp, pro_imagen 
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

const postCreateProducto = async (req, res) => {
    try {
        const { pro_nombre, pro_descripcion, cat_id, pro_iva, pro_costo, pro_pvp, pro_imagen } = req.body
        const response = await db.one(`INSERT INTO public.producto(pro_nombre, pro_descripcion, cat_id, pro_iva, pro_costo, 
            pro_pvp, pro_imagen, pro_estado) VALUES ($1,$2,$3,$4,$5,$6,$7,true) RETURNING*;`,
            [pro_nombre, pro_descripcion, cat_id, pro_iva, pro_costo, pro_pvp, pro_imagen])
        res.json(
            {
                Mensaje: "Producto creado con éxito",
                response
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
                Error: '9997',
                Mensaje: 'Revise el parametro pro_id.'
            })
    }
    if(pro_estado.length == 0){
        return res.json({
            Error: '9997',
            Mensaje: 'Revise el parametro pro_estado.' 
        })
    }
    try {
        const response = await db.none('UPDATE PRODUCTO SET pro_estado = $2 WHERE pro_id = $1', [pro_id, pro_estado])
        return res.json(
            {
                Error: '0',
                Mensaje: 'Estado de producto acutalizado a ' + pro_estado + ' exitosamente.'
            }
        )
    } catch (error) {
        return res.json(
            {
                Error: '9998',
                Mensaje: 'Error con la sentencia SQL ' + error.Mensaje + '.'
            }
        )
    }
}

const updateProductoById = async(req, res) => {
    const { pro_id, pro_campo, pro_nuevo_valor } = req.body
    if (pro_id.length == 0|| pro_nuevo_valor.length == 0) {
        return res.json({
                Error: '9997',
                Mensaje: 'Revise el parametro pro_id.'
            })
    }
    if (pro_campo.length == 0){
        return res.json({
            Error: "9997",
            Mensaje: "Revise el parametro pro_campo."
        })
    }
    if(pro_nuevo_valor.length == 0){
        return res.json({
            Error: "9997",
            Mensaje: "Revise el parametro pro_nuevo_valor."
        })
    }
    try {
        const response = await db.none('UPDATE PRODUCTO SET '+pro_campo+' = $2 WHERE pro_id = $1',[pro_id,pro_nuevo_valor])
        return  res.json({
            Error: '0',
            Mensaje: 'Producto con id '+pro_id+' actualizo el campo '+pro_campo+' con el valor '+pro_nuevo_valor
        })
    } catch (error) {
        return  res.json({
            Error: '9998',
            Mensaje: 'Error con la consulta SQL '+error.Mensaje+'.'
        })
    }
}

const getAjuste = async (req, res) => {
    try {
        let response = []
        const ajustes = await db.any(`SELECT aju_numero, aju_fecha, aju_descripcion, aju_estado FROM ajuste WHERE aju_estado = true ORDER BY aju_numero;`)
        for (let i = 0; i < ajustes.length; i++) {
            const detalles = await db.any(`SELECT aju_det_id, pro_id, aju_det_cantidad, aju_det_modificable, aju_det_estado 
                FROM ajuste_detalle WHERE aju_numero = $1 AND aju_det_estado = true;`, [ajustes[i].aju_numero])
            for(let j = 0; j < detalles.length; j++){
                const producto = await db.one(`SELECT pro_id, pro_nombre, pro_descripcion, cat_id, pro_iva, pro_costo, 
                    pro_pvp, pro_imagen FROM producto WHERE pro_id=$1;`, [detalles[j].pro_id])
                detalles[j].producto = producto
            }
            ajustes[i].detalles = detalles
            response.push(ajustes[i])
        }
        res.json(response)
    } catch (error) {
        console.log(error.message)
        res.json({ Mensaje: error.message })
    }
}

const updateAjusteDetalleById = async (req, res) => {
    const ajuDetId = req.params.aju_det_id;
    const { aju_det_cantidad, aju_det_modificable, aju_det_estado } = req.body;

    if (!aju_det_cantidad) {
        return res.status(400).json({
          Error: '9997',
          Mensaje: 'Revise aju_det_cantidad.'
        });
      }

      if (typeof aju_det_modificable !== 'boolean') {
        return res.status(400).json({
          Error: '9997',
          Mensaje: 'Revise aju_det_modificable.'
        });
      }

      if (typeof aju_det_estado !== 'boolean') {
        return res.status(400).json({
          Error: '9997',
          Mensaje: 'Revise aju_det_estado.'
        });
      }
         
    try {
      const updateQuery = `UPDATE ajuste_detalle SET aju_det_cantidad = $1, aju_det_modificable = $2, aju_det_estado = $3
        WHERE aju_det_id = $4`;
  
      const values = [aju_det_cantidad, aju_det_modificable, aju_det_estado, ajuDetId];
  
      await db.query(updateQuery, values);
  
      res.status(200).json({ message: 'Tabla ajuste_detalle actualizada correctamente' });
    } catch (error) {
      console.error('Error al actualizar la tabla ajuste_detalle', error);
      res.status(500).json({ error: 'Error al actualizar la tabla ajuste_detalle' });
    }
  };

module.exports = {
    getPrueba, updateProductoById, updateEstadoProductoById, getProductos, postCreateProducto, getProductosById, getAjuste, updateAjusteDetalleById
}