//Importa el paquete
const pgPromise = require('pg-promise')
const config = {
    host: 'dpg-chubg1t269vccp3hrhd0-a.ohio-postgres.render.com',
    port: '5432',
    database: 'inventario_rhxq',
    user: 'admin',
    password: 'HbDZkPO0xthkUOFJ0BJmZe7PyEGOGxFM',
    ssl: {
        rejectUnauthorized: false
    }
}
//Instancia como objeto
const pgp = pgPromise({})
const db = pgp(config)

console.log('Conexion ok')
//const result=db.any('Select * from pizzas;')
//console.log(result)
//'Then' me permite esperar a que el promise se cumpla
//.any se usa debido a que me devuelve multiples resultados
db.any('Select * from categoria')
    .then(res => { console.table(res) })

//Permite exportar la variable a otros archivos
exports.db = db