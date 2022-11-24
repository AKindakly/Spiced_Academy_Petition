// loads all variables that are found in the .env file,
// and adds them to process.env! Now you can use them in your script below.
require("dotenv").config();

const spicedPg = require("spiced-pg");
const DATABASE_URL = process.env.DATABASE_URL;

// create a db object. it can talk to the database: use db.query(...)
const db = spicedPg(DATABASE_URL);

// bcryptjs magic
const bcrypt = require("bcryptjs");

module.exports.hash = (password) => {
    return bcrypt.genSalt().then((salt) => {
        return bcrypt.hash(password, salt);
    });
};

//////////////////////////////// Login ////////////////////////////////
module.exports.findUserByEmail = function (email) {
    const sql = `SELECT id, email, password FROM users WHERE email = $1;`;
    // console.log(email);
    return db.query(sql, [email]);
};

module.exports.authenticate = function (email, password) {
    return this.findUserByEmail(email).then((result) => {
        // first find user by email
        // then  check hashed password
        // console.log(result.rows[0].password);
        return bcrypt
            .compare(password, result.rows[0].password)
            .then((success) => {
                return success;
            });
    });
};

//////////////////////////////// Register ////////////////////////////////
module.exports.insertUser = function (first_name, last_name, email, password) {
    const sql = `
        INSERT INTO users (first_name, last_name, email, password)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;
    return this.hash(password).then((hpassword) => {
        return db
            .query(sql, [first_name, last_name, email, hpassword])
            .then((result) => result.rows)
            .catch((error) => console.log("error inserting signature", error));
    });
};

//////////////////////////////// Profile ////////////////////////////////
module.exports.insertProfile = function (age, city, homepage, user_id) {
    const sql = `
        INSERT INTO profiles (age, city, homepage, user_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;
    return db
        .query(sql, [age, city, homepage, user_id])
        .then((result) => result.rows)
        .catch((error) => console.log("error inserting signature", error));
};
//////////////////////////////// Profile/edit ////////////////////////////////
module.exports.getAllUserInfo = function (user_id) {
    const sql =
        "SELECT users.id, first_name, last_name, email, password, age, city, homepage FROM users LEFT JOIN profiles ON users.id = profiles.user_id WHERE users.id = $1;";
    return db
        .query(sql, [user_id])
        .then((result) => {
            return result.rows;
        })
        .catch((error) => {
            console.log("ERROR", error);
        });
};

// importnat:
// The main difference between INSERT and UPDATE in SQL is that
// INSERT is used to add new records to the table
// while UPDATE is used to modify the existing records in the table.

module.exports.updateUserDataWithPassword = function (
    user_id,
    first_name,
    last_name,
    email,
    password
) {
    const sql =
        "UPDATE users SET first_name = $1, last_name = $2, email = $3, password = $4 WHERE id = $5;";

    return this.hash(password).then((hpassword) => {
        return db
            .query(sql, [first_name, last_name, email, hpassword, user_id])
            .then((result) => {
                return result.rows;
            })
            .catch((error) => {
                console.log("ERROR", error);
            });
    });
};

module.exports.updateUserDataWithoutPassword = function (
    user_id,
    first_name,
    last_name,
    email
) {
    const sql =
        "UPDATE users SET first_name = $1, last_name = $2, email = $3 WHERE id = $4;";

    // console.log("withoutPassword", [first_name, last_name, email, user_id]);

    return db
        .query(sql, [first_name, last_name, email, user_id])
        .then((result) => {
            return result.rows;
        })
        .catch((error) => {
            console.log("ERROR", error);
        });
};

module.exports.upsertUserProfileData = function (user_id, age, city, homepage) {
    const sql = `
    INSERT INTO profiles (age, city, homepage, user_id)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id)
    DO UPDATE SET age = $1, city = $2, homepage = $3, user_id = $4;`;

    console.log([user_id, age, city, homepage]);

    return db.query(sql, [user_id, age, city, homepage]);
    // .then((result) => {
    //     return result.rows;
    // })
    // .catch((error) => {
    //     console.log("ERROR", error);
    // });
};

//////////////////////////////// Petition ////////////////////////////////
module.exports.findFirstNameById = function (id) {
    const sql = "SELECT first_name FROM users WHERE id = $1;";
    return db
        .query(sql, [id])
        .then((result) => {
            return result.rows;
        })
        .catch((error) => {
            console.log("ERROR in finding signature", error);
        });
};

module.exports.insertSignature = function (signature, user_id) {
    const sql = `
        INSERT INTO signatures (signature, user_id)
        VALUES ($1, $2)
        RETURNING *;
    `;
    return db
        .query(sql, [signature, user_id])
        .then((result) => result.rows)
        .catch((error) => console.log("error inserting signature", error));
};

//////////////////////////////// Petition/thanks ////////////////////////////////
module.exports.findSignatureById = function (id) {
    const sql = "SELECT signature FROM signatures WHERE user_id = $1;";
    return db
        .query(sql, [id])
        .then((result) => {
            return result.rows;
        })
        .catch((error) => {
            console.log("ERROR in finding signature", error);
        });
};

module.exports.getSignersNumber = function () {
    const sql = "SELECT COUNT(*) FROM signatures;";
    return db.query(sql).catch((error) => {
        console.log("ERROR in finding signature", error);
    });
};

//////////////////////////// DeleteSignature route ////////////////////////////
module.exports.deleteSignature = function (user_id) {
    const sql = "DELETE FROM signatures WHERE user_id = $1;";
    return db.query(sql, [user_id]).catch((error) => {
        console.log("ERROR in finding signature", error);
    });
};

//////////////////////////////// Petition/signatures ////////////////////////////////
module.exports.getAllSignatures = function () {
    const sql =
        "SELECT users.id, first_name, last_name, age, city, homepage FROM users LEFT JOIN profiles ON users.id = profiles.user_id ORDER BY id ASC;";
    // NB! remember to RETURN the promise!
    return db
        .query(sql)
        .then((result) => {
            return result.rows;
        })
        .catch((error) => {
            console.log("error selecting signatures", error);
        });
};

module.exports.getAllSignersByCity = function (city) {
    const sql =
        "SELECT first_name, last_name, age, city, homepage FROM users LEFT JOIN profiles ON users.id = profiles.user_id WHERE city = $1;";
    // NB! remember to RETURN the promise!
    return db
        .query(sql, [city])
        .then((result) => {
            return result.rows;
        })
        .catch((error) => {
            console.log("error selecting signatures", error);
        });
};
