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

const postAuditoria = async (accion, modulo, funcionalidad, observacion, usu_id) => {
    try {
        const fecha = DateTime.local().toISO(); // Obtener la fecha y hora actual en formato ISO
        const usu_id = 1;
        await db.none('INSERT INTO auditoria(aud_fecha, aud_accion, aud_modulo, aud_funcionalidad, aud_observacion, usu_id) VALUES ($1, $2, $3, $4, $5, $6)', [fecha, accion, modulo, funcionalidad, observacion, usu_id]);
    } catch (error) {
        console.log(error.message);
    }
};

module.exports = {
    getAuditoria,
    postAuditoria
};  