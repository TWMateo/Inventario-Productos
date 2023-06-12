const express = require('express')
const { db } = require('../cnn')

const getPrueba = (req, res) => {
    console.log('Funciona')
    res.send('Funciona el metodo de prueba ajuste')
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

const postCreateAjuste = async (req, res) => {

    try {
        // Genera aju_numero automáticamente
        //const aju_numero = 'AJU-006'
        const { aju_numero, aju_fecha, aju_descripcion, aju_estado } = req.body

        const response = await db.one(`INSERT INTO public.ajuste(aju_numero, aju_fecha, aju_descripcion, aju_estado)
        VALUES ($1,$2,$3,$4) RETURNING*;`, [aju_numero, aju_fecha, aju_descripcion, aju_estado])
        res.json(
            {
                Mensaje: "Ajuste creado con éxito",
                response
            }
        )
    } catch (error) {
        console.log(error.Mensaje)
        res.json({ Mensaje: error.Mensaje })
    }
}


module.exports = {
    getAjuste, postCreateAjuste
}