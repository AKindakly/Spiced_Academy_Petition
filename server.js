// express:
const express = require("express");
const app = express();
const PORT = 8080;

// handlebars:
const { engine } = require("express-handlebars");
app.engine("handlebars", engine());
app.set("view engine", "handlebars");

// others:
const db = require("./db");
const path = require("path");
const cookieSession = require("cookie-session");

app.use("/public", express.static(path.join(__dirname, "public"))); // u need to put the path of the css before the static!!

app.use(express.urlencoded({ extended: false }));

app.use(
    cookieSession({
        secret: process.env.SESSION_SECRET,
        // Cookie Options
        maxAge: 24 * 60 * 60 * 24 * 14,
    })
);

//////////////////////////// Default route ////////////////////////////
app.get("/", (req, res) => {
    if (req.session.userId && !req.session.signatureId) {
        res.redirect("/petition");
    } else if (req.session.userId && req.session.signatureId) {
        res.redirect("/petition/thanks");
    } else {
        res.redirect("/login");
    }
});

//////////////////////////// Login route ////////////////////////////
app.get("/login", (req, res) => {
    if (req.session.userId && !req.session.signatureId) {
        res.redirect("/petition");
    } else if (req.session.userId && req.session.signatureId) {
        res.redirect("/petition/thanks");
    } else {
        res.render("login", { title: "Login" });
    }
});

app.post("/login", (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    db.findUserByEmail(email).then((result) => {
        db.authenticate(email, password).then((success) => {
            // console.log(success);

            if (success === true) {
                // console.log("login session: ", result.rows);
                req.session.userId = result.rows[0].id;
                req.session.signatureId = result.rows[0].id;
                res.redirect("/petition");
            } else {
                res.redirect("/login");
            }
        });
    });
});

//////////////////////////// Logout route ////////////////////////////
app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/logIn");
});

//////////////////////////// Register route ////////////////////////////
app.get("/register", (req, res) => {
    if (req.session.userId && !req.session.signatureId) {
        res.redirect("/petition");
    } else if (req.session.userId && req.session.signatureId) {
        res.redirect("/petition/thanks");
    } else {
        res.render("register", { title: "register" });
    }
});

app.post("/register", (req, res) => {
    let first_name = req.body.first_name;
    let last_name = req.body.last_name;
    let email = req.body.email;
    let password = req.body.password;

    db.insertUser(first_name, last_name, email, password)
        .then((rows) => {
            req.session.userId = rows[0].id;
            // console.log("register session: ", rows[0].id);
            res.redirect("/profile");
        })
        .catch((err) => {
            console.log("ERROR in inserting user: ", err);
        });
});

//////////////////////////// Profile route ////////////////////////////
app.get("/profile", (req, res) => {
    if (req.session.userId && req.session.signatureId) {
        res.redirect("/petition/thanks");
    } else {
        res.render("profile", { title: "profile" });
    }
});

app.post("/profile", (req, res) => {
    let age = req.body.age;
    let city = req.body.city;
    let homepage = req.body.homepage;
    let user_id = req.session.userId;

    db.insertProfile(age, city, homepage, user_id)
        .then(() => {
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("ERROR: ", err);
        });
});

//////////////////////////// Profile/edit route ////////////////////////////
app.get("/profile/edit", (req, res) => {
    if (!req.session.userId && !req.session.signatureId) {
        res.redirect("/login");
    } else {
        let user_id = req.session.userId;
        db.getAllUserInfo(user_id)
            .then((rows) => {
                // console.log(rows[0].first_name);
                res.render("edit", {
                    title: "edit your profile",
                    first_name: rows[0].first_name,
                    last_name: rows[0].last_name,
                    email: rows[0].email,
                    age: rows[0].age,
                    city: rows[0].city,
                    homepage: rows[0].homepage,
                });
            })
            .catch((err) => {
                console.log("ERROR in getAllUserInfo: ", err);
            });
    }
});

app.post("/profile/edit", (req, res) => {
    if (!req.session.userId && !req.session.signatureId) {
        res.redirect("/login");
    } else {
        let user_id = req.session.userId;
        let first_name = req.body.first_name;
        let last_name = req.body.last_name;
        let email = req.body.email;
        let password = req.body.password;
        let age = req.body.age;
        let city = req.body.city;
        let homepage = req.body.homepage;
        let userUpdatePromise;

        if (password) {
            userUpdatePromise = db.updateUserDataWithPassword(
                user_id,
                first_name,
                last_name,
                email,
                password
            );
        } else {
            userUpdatePromise = db.updateUserDataWithoutPassword(
                user_id,
                first_name,
                last_name,
                email
            );
        }
        userUpdatePromise
            .then(() => {
                return db.upsertUserProfileData(age, city, homepage, user_id);
            })
            .then(() => {
                res.redirect("/petition");
            })
            .catch((err) => {
                console.log(err);
            });
    }
});

//////////////////////////// Petition route ////////////////////////////
app.get("/petition", (req, res) => {
    if (!req.session.userId && !req.session.signatureId) {
        res.redirect("/login");
    } else if (req.session.userId && req.session.signatureId) {
        res.redirect("/petition/thanks");
    } else {
        let user_id = req.session.userId;
        db.findFirstNameById(user_id)
            .then((rows) => {
                // console.log(rows[0].first_name);
                res.render("petition", {
                    title: "petition",
                    first_name: rows[0].first_name,
                });
            })
            .catch((err) => {
                console.log("ERROR in findFirstNamebyId: ", err);
            });
    }
});

app.post("/petition", (req, res) => {
    let url = req.body.signature;
    let username = req.session.userId;
    let title = req.session.userId;

    let destination = req.session.userId;

    db.insertSignature(url, username, title, destination)
        .then((sign) => {
            // console.log(sign[0].user_id);
            req.session.signatureId = sign[0].user_id;
            res.redirect("/petition/thanks");
        })
        .catch((err) => {
            console.log("ERROR in inserting Signature: ", err);
        });
});

//////////////////////////// Petition/Thanks route ////////////////////////////
app.get("/petition/thanks", (req, res) => {
    if (!req.session.userId && !req.session.signatureId) {
        res.redirect("/login");
    } else if (req.session.userId && !req.session.signatureId) {
        res.redirect("/petition");
    } else {
        let id = req.session.userId;
        // console.log(id);
        Promise.all([
            db.getSignersNumber(),
            db.findSignatureById(id),
            db.findFirstNameById(id),
        ])
            .then((rows) => {
                if (rows) {
                    console.log("rows", rows);
                    res.render("thanks", {
                        title: "Thank you",
                        signature: rows[1][0].signature,
                        signersNumber: rows[0].rows[0].count,
                        first_name: rows[2][0].first_name,
                    });
                } else {
                    req.session.signatureId = null;
                    res.redirect("/petition");
                }
            })
            .catch((err) => {
                console.log("ERROR in Promisess: ", err);
            });
    }
});

//////////////////////////// DeleteSignature route ////////////////////////////
app.get("/deleteSignature", (req, res) => {
    let user_id = req.session.userId;
    db.deleteSignature(user_id).then(() => {
        req.session.signatureId = null;
        res.redirect("/petition");
    });
});

//////////////////////////// Petition/Signatures route ////////////////////////////
app.get("/petition/signatures", (req, res) => {
    if (!req.session.userId && !req.session.signatureId) {
        res.redirect("/login");
    } else if (req.session.userId && !req.session.signatureId) {
        res.redirect("/petition");
    } else {
        db.getAllSignatures()
            .then((rows) => {
                // console.log("Here are all the signatures");
                // console.log(rows);
                res.render("signatures", { title: "Signatures", rows });
            })
            .catch((err) => {
                console.log("ERROR in getAllSignatures: ", err);
            });
    }
});

//////////////////////////// Petition/Signatures/:city route ////////////////////////////
app.get("/petition/signatures/:city", (req, res) => {
    if (!req.session.userId && !req.session.signatureId) {
        res.redirect("/login");
    } else if (req.session.userId && !req.session.signatureId) {
        res.redirect("/petition");
    } else {
        let city = req.params.city;
        db.getAllSignersByCity(city)
            .then((rows) => {
                // console.log(rows);
                res.render("signaturescity", {
                    title: "Signatures by City",
                    rows,
                    city,
                });
            })
            .catch((err) => {
                console.log("ERROR", err);
            });
    }
});

if (process.env.NODE_ENV == "production") {
    app.use((req, res, next) => {
        if (req.headers["x-forwarded-proto"].startsWith("https")) {
            return next();
        }
        res.redirect(`https://${req.hostname}${req.url}`);
    });
}

// to get my server running
app.listen(process.env.PORT || PORT, () => {
    console.log(`Petition project listeneing on port:${PORT}`);
});
