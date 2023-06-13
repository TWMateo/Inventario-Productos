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
    // Obtén la última secuencia de aju_numero utilizada
    const lastAjuNumero = await db.one('SELECT aju_numero FROM public.ajuste ORDER BY aju_numero DESC LIMIT 1');
    let newAjuNumero;

    if (lastAjuNumero) {
      // Extrae el número de la secuencia
      const lastAjuNumeroParts = lastAjuNumero.aju_numero.split('-');
      const lastAjuNumeroValue = parseInt(lastAjuNumeroParts[1]);

      // Incrementa el número de la secuencia
      const newAjuNumeroValue = lastAjuNumeroValue + 1;
      newAjuNumero = `AJUS-${newAjuNumeroValue.toString().padStart(4, '0')}`;
    } else {
      // Si no hay registros anteriores, establece el valor inicial
      newAjuNumero = 'AJUS-0001';
    }

    const { aju_fecha, aju_descripcion, aju_estado } = req.body;

    const response = await db.one(`INSERT INTO public.ajuste(aju_numero, aju_fecha, aju_descripcion, aju_estado)
      VALUES ($1, $2, $3, $4) RETURNING *;`, [newAjuNumero, aju_fecha, aju_descripcion, aju_estado]);

    res.json({
      Mensaje: 'Ajuste creado con éxito',
      response
    });
  } catch (error) {
    console.log(error.Mensaje);
    res.json({ Mensaje: error.Mensaje });
  }
};

const postCreateDetalleAjuste = async (req, res) => {
  try {
      const { aju_numero, pro_id, aju_det_cantidad, aju_det_modificable, aju_det_estado } = req.body
      const response = await db.one(`INSERT INTO public.ajuste_detalle(aju_numero, pro_id, aju_det_cantidad, aju_det_modificable, aju_det_estado)
              VALUES ($1,$2,$3,$4,$5) RETURNING*;`,[aju_numero, pro_id, aju_det_cantidad, aju_det_modificable, aju_det_estado])
      res.json(
          {
              Mensaje: "Detalle creado con éxito",
              response
          }
      )
  } catch (error) {
      console.log(error.Mensaje)
      res.json({ Mensaje: error.Mensaje })
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
    getAjuste, postCreateAjuste, updateAjusteDetalleById, postCreateDetalleAjuste
}