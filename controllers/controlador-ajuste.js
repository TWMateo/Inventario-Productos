const express = require('express')
const { db } = require('../cnn')
const { postAuditoria, postAuditoriaE } = require('./controlador-auditoria');

const getPrueba = (req, res) => {
  console.log('Funciona')
  res.send('Funciona el metodo de prueba ajuste')
}

const getAjuste = async (req, res) => {
  try {
    let response = []
    const ajustes = await db.any(`SELECT aju_numero, aju_fecha, aju_descripcion, aju_estado FROM ajuste ORDER BY aju_numero;`)
    for (let i = 0; i < ajustes.length; i++) {
      const detalles = await db.any(`SELECT aju_det_id, pro_id, aju_det_cantidad, aju_det_modificable, aju_det_estado 
                FROM ajuste_detalle WHERE aju_numero = $1;`, [ajustes[i].aju_numero])
      for (let j = 0; j < detalles.length; j++) {
        const producto = await db.one(`SELECT pro_id, pro_nombre, pro_descripcion, cat_id, pro_valor_iva, pro_costo, 
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

    const {aud_usuario, aju_fecha, aju_descripcion, aju_estado } = req.body;

    const response = await db.one(`INSERT INTO public.ajuste(aju_numero, aju_fecha, aju_descripcion, aju_estado)
      VALUES ($1, $2, $3, $4) RETURNING *;`, [newAjuNumero, aju_fecha, aju_descripcion, aju_estado]);
      await postAuditoriaE(aud_usuario, 'Creación', 'postCreateAjuste', 'Se ha creado el ajuste: '+newAjuNumero);

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
    const {aud_usuario, aju_numero, pro_id, aju_det_cantidad, aju_det_modificable, aju_det_estado } = req.body
    const response = await db.one(`INSERT INTO public.ajuste_detalle(aju_numero, pro_id, aju_det_cantidad, aju_det_modificable, aju_det_estado)
              VALUES ($1,$2,$3,$4,$5) RETURNING*;`, [aju_numero, pro_id, aju_det_cantidad, aju_det_modificable, aju_det_estado])
    await postAuditoriaE(aud_usuario, 'Creación', 'postCreateDetalleAjuste', 'Se ha creado el detalle del ajuste: '+aju_numero);
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

const updateAjuste = async (req, res) => {
  const {aud_usuario, aju_numero, aju_fecha, aju_descripcion, aju_estado} = req.body
  try {
    const response = db.none('UPDATE ajuste SET aju_fecha = $2, aju_descripcion = $3, aju_estado = $4 WHERE aju_numero = $1', 
    [aju_numero, aju_fecha, aju_descripcion, aju_estado])
    const resp = db.none('UPDATE ajuste_detalle SET aju_det_estado=$2 WHERE aju_numero=$1',[aju_numero,aju_estado])
    await postAuditoriaE(aud_usuario, 'Actualización', 'updateAjuste', 'Se actualizó el ajuste: '+aju_numero);
    res.json({
      message: 'Ajuste con aju_numero:'+aju_numero+' actualizado'
    })
  } catch (error) {
    res.json({
      message: error.message
    })
  }
}

const updateAjusteDetalleById = async (req, res) => {
  const { aud_usuario, aju_det_id, aju_det_cantidad, aju_det_modificable, aju_det_estado } = req.body;

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

    const values = [aju_det_cantidad, aju_det_modificable, aju_det_estado, aju_det_id];

    await db.query(updateQuery, values);
    await postAuditoriaE(aud_usuario, 'Actualización', 'updateAjusteDetalleById', 'Se actualizó el detalle de ajuste con id: '+aju_det_id);
    res.status(200).json({ message: 'Tabla ajuste_detalle actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar la tabla ajuste_detalle', error);
    res.status(500).json({ error: 'Error al actualizar la tabla ajuste_detalle' });
  }
};

const putUpdateAjuste = async (req, res) => {
  const { aud_usuario, aju_numero, aju_fecha, aju_descripcion, detalles } = req.body
  try {
    //Insercion del ajuste
    const ajuste = await db.one(`UPDATE public.ajuste SET   aju_fecha=$1, aju_descripcion=$2, aju_estado=true
              WHERE aju_numero=$3 RETURNING*;`, [aju_fecha, aju_descripcion, aju_numero])
    await db.none(`DELETE FROM public.ajuste_detalle WHERE aju_numero=$1;`, [aju_numero])
    //Insercion del detalle
    let response = [];
    for (let i = 0; i < detalles.length; i++) {
      const detalle = await db.one(`INSERT INTO public.ajuste_detalle(aju_numero, pro_id, aju_det_cantidad, 
                  aju_det_modificable, aju_det_estado) VALUES ($1, $2, $3, true, true) returning*;`,
        [ajuste.aju_numero, detalles[i].pro_id, detalles[i].aju_det_cantidad])
      response.push(detalle)
    }
    ajuste.aju_detalle = response
    res.json(ajuste)
  } catch (error) {
    console.log(error.message)
    res.json({ message: error.message })
  }
}

const updateAjusteDetalle = async (req, res) => {
  const { aju_numero } = req.params;
  console.log("Valor de aju_numero recibido en el backend:", aju_numero);
  try {
    // Actualiza el campo aju_det_modificable a false para cada ajuste de detalle relacionado con el ajuste específico
    await db.none(`UPDATE public.ajuste_detalle SET aju_det_modificable=false WHERE aju_numero=$1;`, [aju_numero]);
    
    // Obtenemos el ajuste con los detalles actualizados para enviar en la respuesta
    const ajuste = await db.one('SELECT * FROM public.ajuste WHERE aju_numero = $1;', [aju_numero]);
    const detalles = await db.any('SELECT * FROM public.ajuste_detalle WHERE aju_numero = $1;', [aju_numero]);
    ajuste.detalles = detalles;
    
    res.json(ajuste);
  } catch (error) {
    console.log(error.message);
    res.json({ message: error.message });
  }
};

const postCreateAjustecompleto = async (req, res) => {
  const { aud_usuario, aju_fecha, aju_descripcion, detalles } = req.body;
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

    // Inserción del ajuste
    const ajuste = await db.one(`INSERT INTO public.ajuste(aju_numero, aju_fecha, aju_descripcion, aju_estado)
        VALUES ($1, $2, $3, true) RETURNING *;`, [newAjuNumero, aju_fecha, aju_descripcion]);

    // Inserción del detalle
    let detalle = [];
    for (let i = 0; i < detalles.length; i++) {
      const response = await db.one(`INSERT INTO public.ajuste_detalle(aju_numero, pro_id, aju_det_cantidad, 
                aju_det_modificable, aju_det_estado) VALUES ($1, $2, $3, true, true) RETURNING *;`,
        [ajuste.aju_numero, detalles[i].pro_id, detalles[i].aju_det_cantidad]);
      detalle.push(response);
    }
    ajuste.aju_detalle = detalle;
    await postAuditoriaE(aud_usuario, 'Creación', 'postCreateAjustecompleto', 'Se creó el ajuste: '+newAjuNumero+' con el detalle:'+aju_detalle.aju_det_id);
    res.json(ajuste);
  } catch (error) {
    console.log(error);
    res.json({
      message: 'Valores incorrectos'
    });
  }
};

module.exports = {
  getAjuste, postCreateAjuste,
  updateAjusteDetalleById, 
  postCreateDetalleAjuste, 
  putUpdateAjuste, postCreateAjustecompleto,
  updateAjuste, updateAjusteDetalle
}