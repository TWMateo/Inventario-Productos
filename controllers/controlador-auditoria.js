const express = require('express')
const { db } = require('../cnn')
const { DateTime } = require('luxon');

const getAuditoria = async (req, res) => {
  try {
    const auditoria = await db.any('SELECT * FROM auditoria');
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

    // Consultar las auditorías dentro del rango de fechas especificado
    const auditorias = await db.any('SELECT * FROM auditoria WHERE aud_fecha >= $1 AND aud_fecha <= $2', [fecha_inicio, fecha_fin]);

    res.json({ mensaje: 'ok', auditorias });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ mensaje: 'Error al obtener las auditorías por rango de fechas' });
  }
};

const postAuditoria = async (accion, modulo, funcionalidad, observacion, usu_id) => {
  try {
    const fecha = DateTime.local().toISO(); // Obtener la fecha y hora actual en formato ISO
    const usu_id = 1; // Usuario fijo con ID 1
    await db.none('INSERT INTO auditoria(aud_fecha, aud_accion, aud_modulo, aud_funcionalidad, aud_observacion, usu_id) VALUES ($1, $2, $3, $4, $5, $6)', [fecha, accion, modulo, funcionalidad, observacion, usu_id]);
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  getAuditoria,
  postAuditoria,
  getAuditoriasFechas
};  
