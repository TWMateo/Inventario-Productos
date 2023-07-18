const express = require("express");
const { db } = require("../cnn");
const { postAuditoria } = require('./controlador-auditoria');

const getPrueba = (req, res) => {
  console.log("Funciona");
  res.send("Funciona el metodo de prueba original");
};

/**
 * Calcula el stock de los ajustes realizados a un producto mediante su id
 * @param {number} pro_id Identificador del producto
 * @returns Json con calculo del stock
 */
function ajustesStock(pro_id) {
  try {
    return new Promise((resolve) => {
      let query = 'select ad.aju_det_cantidad, ad.aju_det_estado from producto pro, ajuste_detalle ad where pro.pro_id=ad.pro_id and pro.pro_id=$1';
      db.any(query, [pro_id])
        .then((data) => {
          let suma = 0;
          for(let i = 0; i < data.length; i++){
            if(data[i].aju_det_estado == true || data[i].aju_det_estado == false){ // verifica el estado antes de sumar
              suma += Number(data[i].aju_det_cantidad); // convierte a número antes de sumar
            }
          }
          resolve(suma);
        })
        .catch((error) => {
          console.log('Error en la consulta: ', error);
        });
    });
  } catch (error) {
    console.log('Error en la función: ', error);
  }
}

const axios = require("axios");

const facturasVentasStock = async (idProducto) => {
  try {
    let suma = 0;
    const respuesta = await axios.get(
      "https://facturasapi202307161115.azurewebsites.net/api/FactDetalleFacturas"
    );
    const datos = respuesta.data;
    for (let i = 0; i < datos.length; i++) {
      if (datos[i].idProducto == idProducto) {
        const respuestaFactura = await axios.get(
          `https://facturasapi202307161115.azurewebsites.net/api/FactFacturaCabeceras/${datos[i].idFacturaCabecera}`
        );
        const estadoFactura = respuestaFactura.data.estado;
        if(estadoFactura) {
          suma += datos[i].cantidad;
        }
      }
    }
    return suma;
  } catch (error) {
    console.log(error);
  }
};

const facturasComprasStock = async (idProducto) => {
  try {
    let suma = 0;
    const respuesta = await axios.get(
      "https://gr2compras.000webhostapp.com/facturas"
    );
    const datos = respuesta.data;

    for (let i = 0; i < datos.data.length; i++) {
      // Comprobar si la factura está activa
      if (datos.data[i].estado === "Activo") {
        for (let j = 0; j < datos.data[i].detalles.length; j++) {
          if (datos.data[i].detalles[j].producto_id == idProducto) {
            suma += Number(datos.data[i].detalles[j].cantidad);
          }
        }
      }
    }
    return suma;
  } catch (error) {
    console.log(error);
  }
};

const getProductos = async (req, res) => {
  try {
    let response = [];
    const productos = await db.any(`
            SELECT pro.pro_id, pro.pro_nombre, pro.pro_descripcion, pro.pro_valor_iva, pro.pro_costo, pro.pro_pvp, pro.pro_imagen,
            cat.cat_id, cat.cat_nombre 
            FROM producto pro 
            LEFT JOIN categoria cat ON pro.cat_id = cat.cat_id 
            WHERE pro.pro_estado=true ORDER BY pro.pro_id;`);

    //calculo de stock
    for (let i = 0; i < productos.length; i++) {
      let total = 0;
      const ajuste_stock = await ajustesStock(productos[i].pro_id);
      if (ajuste_stock != null) {
        const ajuste = parseInt(ajuste_stock);
    
        if (ajuste > 0) {
            total += ajuste;
        } else if (ajuste < 0 && total + ajuste >= 0) {
            total += ajuste;
        } else {
          console.log("STOCK INSUFICIENTE")
        }
    }

    const facturas_ventas_stock = await facturasVentasStock(productos[i].pro_id);
    if (facturas_ventas_stock != undefined) {
      total -= facturas_ventas_stock;
    }

    const facturas_compras_stock = await facturasComprasStock(productos[i].pro_id);
    if (facturas_compras_stock != undefined) {
      total += facturas_compras_stock;
    }
    
      productos[i].pro_stock = total;
    }
    res.json(productos);
  } catch (error) {
    console.log(error.Mensaje);
    res.json({ Mensaje: error.Mensaje });
  }
};

const getProductosById = async (req, res) => {
  try {
    const pro_id = req.params.pro_id;
    const response = await db.one(
      `SELECT pro.pro_id, pro.pro_nombre, pro.pro_descripcion, pro.pro_valor_iva, pro.pro_costo, pro.pro_pvp, pro.pro_imagen, cat.cat_id, cat.cat_nombre
        FROM producto pro
        INNER JOIN categoria cat ON pro.cat_id = cat.cat_id
        WHERE pro.pro_id = $1 AND pro.pro_estado = true;`,
      [pro_id]
    );
    //calculo de stock
    let total = 0;
    const ajuste_stock = await ajustesStock(response.pro_id);
    if (ajuste_stock.sum != null) total += parseInt(ajuste_stock.sum);

    const facturas_ventas_stock = await facturasVentasStock(response.productos.pro_id);
    if (facturas_ventas_stock != undefined) {
      total -= facturas_ventas_stock;
    }

    const facturas_compras_stock = await facturasComprasStock(response.productos.pro_id);
    if (facturas_compras_stock != undefined) {
      total += facturas_compras_stock;
    }

    response.pro_stock = total;
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
      `SELECT pro.pro_id, pro.pro_nombre, pro.pro_descripcion, pro.pro_valor_iva, pro.pro_costo, pro.pro_pvp, pro.pro_imagen, cat.cat_id, cat.cat_nombre
        FROM producto pro
        INNER JOIN categoria cat ON pro.cat_id = cat.cat_id
        WHERE pro.pro_nombre = $1 AND pro.pro_estado = true;`,
      [pro_nombre]
    );
    //calculo de stock
    let total = 0;
    const ajuste_stock = await ajustesStock(response.pro_id);
    if (ajuste_stock.sum != null) total += parseInt(ajuste_stock.sum);

    const facturas_ventas_stock = await facturasVentasStock(response.productos.pro_id);
    if (facturas_ventas_stock != undefined) {
      total -= facturas_ventas_stock;
    }

    const facturas_compras_stock = await facturasComprasStock(response.productos.pro_id);
    if (facturas_compras_stock != undefined) {
      total += facturas_compras_stock;
    }

    response.pro_stock = total;
    res.json(response);
  } catch (error) {
    console.log(error.message);
    res.json({ message: error.message });
  }
};

const getProductosD = async (req, res) => {
  try {
    let response = [];
    const productos = await db.any(`
        SELECT pro.pro_id, pro.pro_nombre, pro.pro_descripcion, pro.pro_valor_iva, pro.pro_costo, pro.pro_pvp, pro.pro_imagen,
        cat.cat_id, cat.cat_nombre 
        FROM producto pro 
        LEFT JOIN categoria cat ON pro.cat_id = cat.cat_id 
        WHERE pro.pro_estado = false ORDER BY pro.pro_id;`);

    //calculo de stock
    let total = 0;
    const ajuste_stock = await ajustesStock(response.pro_id);
    if (ajuste_stock.sum != null) total += parseInt(ajuste_stock.sum);

    const facturas_ventas_stock = await facturasVentasStock(response.productos.pro_id);
    if (facturas_ventas_stock != undefined) {
      total -= facturas_ventas_stock;
    }

    const facturas_compras_stock = await facturasComprasStock(response.productos.pro_id);
    if (facturas_compras_stock != undefined) {
      total += facturas_compras_stock;
    }

    response.pro_stock = total;
    res.json(productos);
  } catch (error) {
    console.log(error.Mensaje);
    res.json({ Mensaje: error.Mensaje });
  }
};

const getProductosByIdD = async (req, res) => {
  try {
    const pro_id = req.params.pro_id;
    const response = await db.one(
      `SELECT pro.pro_id, pro.pro_nombre, pro.pro_descripcion, pro.pro_valor_iva, pro.pro_costo, pro.pro_pvp, pro.pro_imagen, cat.cat_id, cat.cat_nombre
        FROM producto pro
        INNER JOIN categoria cat ON pro.cat_id = cat.cat_id
        WHERE pro.pro_id = $1 AND pro.pro_estado = false;`,
      [pro_id]
    );
    //calculo de stock
    let total = 0;
    const ajuste_stock = await ajustesStock(response.pro_id);
    if (ajuste_stock.sum != null) total += parseInt(ajuste_stock.sum);

    const facturas_ventas_stock = await facturasVentasStock(response.productos.pro_id);
    if (facturas_ventas_stock != undefined) {
      total -= facturas_ventas_stock;
    }

    const facturas_compras_stock = await facturasComprasStock(response.productos.pro_id);
    if (facturas_compras_stock != undefined) {
      total += facturas_compras_stock;
    }

    response.pro_stock = total;
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
      `SELECT pro.pro_id, pro.pro_nombre, pro.pro_descripcion, pro.pro_valor_iva, pro.pro_costo, pro.pro_pvp, pro.pro_imagen, cat.cat_id, cat.cat_nombre
        FROM producto pro
        INNER JOIN categoria cat ON pro.cat_id = cat.cat_id
        WHERE pro.pro_nombre = $1 AND pro.pro_estado = false;`,
      [pro_nombre]
    );
    //calculo de stock
    let total = 0;
    const ajuste_stock = await ajustesStock(response.pro_id);
    if (ajuste_stock.sum != null) total += parseInt(ajuste_stock.sum);

    const facturas_ventas_stock = await facturasVentasStock(response.productos.pro_id);
    if (facturas_ventas_stock != undefined) {
      total -= facturas_ventas_stock;
    }

    const facturas_compras_stock = await facturasComprasStock(response.productos.pro_id);
    if (facturas_compras_stock != undefined) {
      total += facturas_compras_stock;
    }

    response.pro_stock = total;
    res.json(response);
  } catch (error) {
    console.log(error.message);
    res.json({ message: error.message });
  }
};

const postCreateProducto = async (req, res) => {
  try {
    const {
      pro_nombre,
      pro_descripcion,
      cat_id,
      pro_valor_iva,
      pro_costo,
      pro_pvp,
      pro_imagen,
    } = req.body;
    const response = await db.one(
      `INSERT INTO public.producto(pro_nombre, pro_descripcion, cat_id, pro_valor_iva, pro_costo, 
            pro_pvp, pro_imagen, pro_estado) VALUES ($1,$2,$3,$4,$5,$6,$7,true) RETURNING*;`,
      [
        pro_nombre,
        pro_descripcion,
        cat_id,
        pro_valor_iva,
        pro_costo,
        pro_pvp,
        pro_imagen,
      ]
    );
    await postAuditoria('Creación', 'Inventario', 'postCreateProducto', 'Se ha creado el producto: '+pro_nombre);
    res.json({
      Mensaje: "Producto creado con éxito",
      response: response,
    });
  } catch (error) {
    console.log(error.Mensaje);
    res.json({ Mensaje: error.Mensaje });
  }
};

const updateEstadoProductoById = async (req, res) => {
  const { pro_id, pro_estado } = req.body;
  if (pro_id.length == 0) {
    return res.json({
      mensaje: "Error",
      response: "Revise el parametro pro_id.",
    });
  }
  if (pro_estado.length == 0) {
    return res.json({
      mensaje: "Error",
      response: "Revise el parametro pro_estado.",
    });
  }
  try {
    const response = await db.none(
      "UPDATE PRODUCTO SET pro_estado = $2 WHERE pro_id = $1",
      [pro_id, pro_estado]
    );
    await postAuditoria('Actualización', 'Inventario', 'updateEstadoProductoById', 'Se actualizó el estado del producto con Id: '+pro_id);
    return res.json({
      mensaje: "Correcto",
      response:
        "Estado de producto actualizado a " + pro_estado + " exitosamente.",
    });
  } catch (error) {
    return res.json({
      mensaje: "Error",
      response: "Error con la sentencia SQL " + error.Mensaje + ".",
    });
  }
};

const updateProductoById = async (req, res) => {
  const { pro_id, pro_campo } = req.body;
  let respuesta = "";
  if (pro_id.length == 0) {
    return res.json({
      mensaje: "Error",
      response: "Revise el parametro pro_id.",
    });
  }
  if (pro_campo.length == 0) {
    return res.json({
      mensaje: "Error",
      response: "Revise el parametro pro_campo.",
    });
  }
  try {
    const sentencia = pro_campo.forEach(async (valores) => {
      if (
        (valores["campo"] === "pro_valor_iva" ||
          valores["campo"] === "pro_costo" ||
          valores["campo"] === "pro_pvp") &&
        valores["valor"] < 0
      ) {
        return res.json({
          mensaje: "Error",
          response: "El valor asigando no puede ser menor que 0",
        });
      }
      const response = await db.none(
        "UPDATE PRODUCTO SET " + valores["campo"] + " = $2 WHERE pro_id = $1",
        [pro_id, valores["valor"]]
      );
      await postAuditoria('Actualización', 'Inventario', 'updateProductoById', 'Se actualizó el producto con Id: '+pro_id);
    });
    return res.json({
      mensaje: "Correcto",
      response: "Campos actualizados del producto con id " + pro_id,
    });
  } catch (error) {
    return res.json({
      mensaje: "Error",
      response: "Error con la sentencia SQL " + error.Mensaje + ".",
    });
  }
};

const deleteProducto = async (req, res) => {
  try {
    const { pro_id } = req.body;
    const response = await db.one(
      "UPDATE producto SET pro_estado=false WHERE pro_id=$1 RETURNING*;",
      [pro_id]
    );
    res.json({
      message: "Producto desactivado con éxito",
      response,
    });
  } catch (error) {
    console.log(error.message);
    res.json({ message: error.message });
  }
};

const getAtributosProById = async (req, res) => {
  try {
    const pro_id = req.params.pro_id;
    const response = await db.one(
      `SELECT  pro.pro_valor_iva, pro.pro_pvp 
        FROM producto pro 
        WHERE pro_id = $1 AND pro.pro_estado= true;`,
      [pro_id]
    );
    //calculo de stock
    let total = 0;
    const ajuste_stock = await ajustesStock(response.pro_id);
    if (ajuste_stock.sum != null) total += parseInt(ajuste_stock.sum);
    response.pro_stock = total;
    res.json(response);
  } catch (error) {
    console.log(error.Mensaje);
    res.json({ Mensaje: error.Mensaje });
  }
};

const putUpdateProducto = async (req, res) => {
  try {
    const {
      pro_id,
      pro_nombre,
      pro_descripcion,
      cat_id,
      pro_valor_iva,
      pro_costo,
      pro_pvp,
      pro_imagen,
      pro_estado,
    } = req.body;
    const response = await db.one(
      `UPDATE producto SET pro_nombre=$2, pro_descripcion=$3, cat_id=$4, pro_valor_iva=$5, 
        pro_costo=$6, pro_pvp=$7, pro_imagen=$8, pro_estado=$9 WHERE pro_id=$1 RETURNING*`,
      [
        pro_id,
        pro_nombre,
        pro_descripcion,
        cat_id,
        pro_valor_iva,
        pro_costo,
        pro_pvp,
        pro_imagen,
        pro_estado,
      ]
    );
    await postAuditoria('Actualización', 'Inventario', 'putUpdateProduct', 'Se actualizó el producto con id:'+pro_id+' Nombre:'+pro_nombre);
    res.json({
      message: "Producto actualizado con éxito",
      response,
    });
  } catch (error) {
    console.log(error.message);
    res.json({ message: error.message });
  }
};

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
  putUpdateProducto,
};
