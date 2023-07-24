const express = require('express')
const { db } = require('../cnn')
const { DateTime } = require('luxon');
const { format, parseISO } = require('date-fns');

const getAuditoria = async (req, res) => {
  try {
    const auditoria = await db.any('SELECT * FROM auditoria');
    await postAuditoriaE('Usuario: Rivaldo Sanchez','Inicio de sesión', 'getAuditoria', 'Se ingresó a revisión de tabla de auditoria');
    res.json(auditoria);
  } catch (error) {
    console.log(error.message);
    res.json({ mensaje: error.message });
  }
};

const getAuditoriasFechas = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.body;

    // Validar que se proporcionen las fechas de inicio y fin
    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ mensaje: 'Falta la fecha de inicio o fin' });
    }

    // Convertir las fechas de inicio y fin al formato de fecha ISO
    const fechaInicioISO = format(parseISO(fecha_inicio), 'yyyy-MM-dd');
    const fechaFinISO = format(parseISO(fecha_fin), 'yyyy-MM-dd');

    // Consultar las auditorías dentro del rango de fechas especificado
    const auditorias = await db.any('SELECT * FROM auditoria WHERE aud_fecha::date BETWEEN $1 AND $2', [fechaInicioISO, fechaFinISO]);

    res.json({ mensaje: 'ok', auditorias });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ mensaje: 'Error al obtener las auditorías por rango de fechas' });
  }
};

const postAuditoria = async (accion, modulo, funcionalidad, observacion, usu_id) => {
  try {
    const fecha = DateTime.local().toISO(); // Obtener la fecha y hora actual en formato ISO
    await db.none('INSERT INTO auditoria(aud_fecha, aud_accion, aud_modulo, aud_funcionalidad, aud_observacion, usu_id) VALUES ($1, $2, $3, $4, $5, $6)', [fecha, accion, modulo, funcionalidad, observacion, usu_id]);
  } catch (error) {
    console.log(error.message);
  }
};

const postAuditoriaE = async (aud_usuario, accion, funcionalidad, observacion) => {
  try {
    /*let {
      aud_usuario,
    } = req.body;*/

    // Obtener la fecha y hora actual en formato ISO
    const fecha = DateTime.local().toISO();

    const response = await db.one(
      `INSERT INTO public.auditoria(aud_usuario, aud_fecha, aud_accion, aud_modulo, aud_funcionalidad, aud_observacion) 
       VALUES ($1, $2, $3, 'Inventario', $4, $5) RETURNING *;`,
      [
        aud_usuario,
        fecha,
        accion,
        funcionalidad,
        observacion 
      ]
    );

  } catch (error) {
    console.log(error.message);
  }
};


module.exports = {
  getAuditoria,
  postAuditoria,
  getAuditoriasFechas,
  postAuditoriaE
};  
