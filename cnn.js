//Importa el paquete
const pgPromise = require('pg-promise')
const config = {
    host: 'localhost',
    port: '5432',
    database: 'MokApp',
    user: 'postgres',
    password: '0505'
}
//Instancia como objeto
const pgp = pgPromise({})
const db = pgp(config)

// console.log('Conexion ok')
// db.any('Select * from categoria')
//     .then(res => { console.table(res) })

//Permite exportar la variable a otros archivos
exports.db = db