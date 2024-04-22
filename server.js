const express = require('express')
const app = express()
const pg = require('pg')
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_hr_directory')
const port = process.env.PORT || 3000

app.use(express.json())
app.use(require('morgan')('dev'))

app.get('/api/employees', async (req, res, next) => { 
    try {
        const SQL = `
            SELECT * from employees
        `
        const response = await client.query(SQL)
        res.send(response.rows)
    } catch (error) {
        next(error)
    }})
app.get('/api/departments', async (req, res, next) => {
     try {
        const SQL = `
        SELECT * from departments
    `
    const response = await client.query(SQL)
    res.send(response.rows)
    } catch (error) {
        next(error)
    }})
app.post('/api/employees', async (req, res, next) => { 
    try {
        const SQL = `
            INSERT INTO employees(name, department_id)
            VALUES($1, $2)
            RETURNING *
        `
        const response = await client.query(SQL, [req.body.name, req.body.department_id])
        res.send(response.rows[0])
    } catch (error) {
        next(error)
    }})
app.put('/api/employees/:id', async (req, res, next) => { 
    try {
        const SQL = `
            UPDATE employees
            SET name=$1, department_id=$2, updated_at= now()
            WHERE id=$3 RETURNING *
        `
        const response = await client.query(SQL, [
            req.body.name,
            req.body.department_id,
            req.params.id
        ])
        res.send(response[0])
    } catch (error) {
        next(error)
    }})
app.delete('/api/employees/:id', async (req, res, next) => { 
    try {
        const SQL = `
            DELETE from employees
            WHERE id = $1
        `
        const response = await client.query(SQL, [req.params.id])
        res.sendStatus(204)
    } catch (error) {
        next(error)
    }})

const init = async () => {
    await client.connect()
    let SQL = ` 
    DROP TABLE IF EXISTS employees;
    DROP TABLE IF EXISTS departments;
    CREATE TABLE departments(
        id SERIAL PRIMARY KEY,
        name VARCHAR(255)
    );
    CREATE TABLE employees(
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        department_id INTEGER REFERENCES departments(id) NOT NULL
    );
    `
    await client.query(SQL)
    console.log('tables created')
    SQL = `
    INSERT INTO departments(name) VALUES('Toons');
    INSERT INTO departments(name) VALUES('Managers');
    INSERT INTO departments(name) VALUES('Artists');
    INSERT INTO departments(name) VALUES('Fish');
    INSERT INTO employees(name, department_id) VALUES('Bugs', (SELECT id FROM departments WHERE name='Toons'));
    INSERT INTO employees(name, department_id) VALUES('Daffy', (SELECT id FROM departments WHERE name='Toons'));
    INSERT INTO employees(name, department_id) VALUES('Disney', (SELECT id FROM departments WHERE name='Managers'));
    INSERT INTO employees(name, department_id) VALUES('Walt', (SELECT id FROM departments WHERE name='Artists'));
    INSERT INTO employees(name, department_id) VALUES('Banksy', (SELECT id FROM departments WHERE name='Artists'));
    INSERT INTO employees(name, department_id) VALUES('Kevin', (SELECT id FROM departments WHERE name='Managers'));
    INSERT INTO employees(name, department_id) VALUES('Nemo', (SELECT id FROM departments WHERE name='Fish'));
    INSERT INTO employees(name, department_id) VALUES('Dory', (SELECT id FROM departments WHERE name='Fish'));
    `
    await client.query(SQL)
    console.log('data seeded')
    app.listen(port, () => console.log(`listening on port ${port}`))
}

init()