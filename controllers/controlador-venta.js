const { db } = require("../cnn")

const getVentaById = async (req, res) => {
    try {
        const { ven_id } = req.params
        const response = await db.one("SELECT * FROM venta WHERE ven_id=$1;", [ven_id])
        return res.json({
            message: 'Ok',
            response: { response }
        })
    } catch (error) {
        console.log(error)
        return res.json({
            message: { error }
        })
    }
}

const postVenta = async (req, res) => {
    const {
        cli_id,
        pro_id,
        ven_fecha,
        ven_cantidad,
        ven_total,
        ven_estado
    } = req.body
    try {
        const response = await db.one("INSERT INTO venta(cli_id, pro_id, ven_fecha, ven_cantidad, ven_total, ven_estado) VALUES($1, $2, $3, $4, $5, $6) RETURNING ven_id", [cli_id, pro_id, ven_fecha, ven_cantidad, ven_total, ven_estado])
        return res.json({
            message: "Ok",
            response: response
        })
    } catch (error) {
        console.log(error);
        return res.json({ message: "Error" })
    }
}

const putVenta = async (req, res) => {
    try {
        const {
            ven_id,
            cli_id,
            pro_id,
            ven_fecha,
            ven_cantidad,
            ven_total,
            ven_estado } = req.body

        let query = "UPDATE venta SET "
        cli_id && `${query += "cli_id=" + `'` + cli_id + `'` + ","}`
        pro_id && `${query += "pro_id=" + `'` + pro_id + `'` + ","}`
        ven_fecha && `${query += "ven_fecha=" + `'` + ven_fecha + `'` + ","}`
        ven_cantidad && `${query += "ven_cantidad=" + `'` + ven_cantidad + `'` + ","}`
        ven_total && `${query += "ven_total=" + ven_total + ","}`
        ven_estado && `${query += "ven_estado=" + ven_estado + ","}`

        query[query.length - 1] == "," && `${query = query.slice(0, query.length - 1)}`
        const response = db.none(query + " WHERE ven_id=$1", [ven_id]);
        return res.json({
            message: "Ok!! la venta fue actualizado correctamente."
        })
    } catch (error) {
        console.log(error)
        return res.json({
            message: error
        })
    }
}

const deleteVenta = async (req, res) => {
    try {
        const { ven_id } = req.params
        const response = db.none("DELETE FROM venta WHERE ven_id=$1", [ven_id])

        return res.json({
            message: `Ok!! Cliente con id ${ven_id} eliminado con exito`,
        })
    } catch (error) {
        console.log(error)
        return res.json({
            message: error
        })
    }
}

module.exports = {
    getVentaById,
    postVenta,
    putVenta,
    deleteVenta
}