
DROP TABLE IF EXISTS signatures;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS profiles;

CREATE TABLE users (
    id SERIAL primary key,
    first_name VARCHAR(255) NOT NULL CHECK(first_name != ''),
    last_name VARCHAR(255) NOT NULL CHECK(last_name != ''),
    email VARCHAR(255) NOT NULL UNIQUE CHECK(email != ''),
    password VARCHAR(255) NOT NULL CHECK(password != ''),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE signatures (
    id SERIAL primary key,
    signature TEXT NOT NULL,
    user_id INT NOT NULL references users (id)
);

CREATE TABLE profiles (
    id SERIAL PRIMARY KEY, 
    age INT,
    city VARCHAR(255),
    homepage VARCHAR(255),
    user_id INT NOT NULL UNIQUE references users (id)
);

