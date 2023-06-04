const express = require('express')

const getPrueba = (req,res) => {
    console.log('Funciona')
    res.send('Funciona el metodo de prueba original')
}

module.exports = {
    getPrueba
}