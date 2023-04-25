# SQL Queries
## Table creation
```
CREATE TABLE Customer (
    customer_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email_address VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    postcode VARCHAR(20) NOT NULL,
    state VARCHAR(50) NOT NULL
);

CREATE TABLE Job (
    job_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    job_type VARCHAR(50) NOT NULL,
    making VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    budget NUMERIC(10,2),
    status VARCHAR(20) NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
);

CREATE TABLE Image (
    image_id SERIAL PRIMARY KEY,
    job_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    FOREIGN KEY (job_id) REFERENCES Job(job_id) ON DELETE CASCADE
);

CREATE TABLE Quotation (
    quotation_id SERIAL PRIMARY KEY,
    job_id INT NOT NULL,
    maker_id INT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    comments TEXT,
    FOREIGN KEY (job_id) REFERENCES Job(job_id) ON DELETE CASCADE,
    FOREIGN KEY (maker_id) REFERENCES Maker(maker_id)
);

CREATE TABLE Maker (
    maker_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL
);
```

## insertion
```
INSERT INTO Customer (first_name, last_name, phone_number, email_address, address, postcode, state) 
VALUES ('John', 'Doe', '1234567890', 'john.doe@example.com', '123 Main Street', '12345', 'CA');
```

Inserting a new customer into the Customer table:
```
INSERT INTO Customer (first_name, last_name, phone_number, email_address, address, postcode, state) 
VALUES ('John', 'Doe', '1234567890', 'john.doe@example.com', '123 Main Street', '12345', 'CA');
```
Inserting a new job into the Job table:
```
INSERT INTO Job (customer_id, job_type, making, description, budget, status)
VALUES (1, 'Dress', 'Custom-made', 'Looking for a formal dress for a wedding', 500, 'Open');
```
Inserting images for a job into the Image table:
```
INSERT INTO Image (job_id, image_url) 
VALUES (1, 'https://example.com/image1.jpg'), (1, 'https://example.com/image2.jpg');
```
Inserting into Maker
```
INSERT INTO maker (name,location)
values ('Henry','Atlanta');
```
Inserting into Quoatation
```
INSERT INTO quoatation (job_id, maker_id, price, comments)
VALUES (1,1,450,'I can do it');
```

Retrieving all available jobs with their corresponding customer details:
```
SELECT Job.job_id, Job.job_type, Job.making, Job.description, Job.budget, Job.status, 
       Customer.first_name, Customer.last_name, Customer.phone_number, Customer.email_address, Customer.address, Customer.postcode, Customer.state
FROM Job
INNER JOIN Customer ON Job.customer_id = Customer.customer_id
WHERE Job.status = 'Open';
```
Retrieving a specific job with its corresponding customer details and uploaded images:
```
SELECT Job.job_id, Job.job_type, Job.making, Job.description, Job.budget, Job.status,
       Customer.first_name, Customer.last_name, Customer.phone_number, Customer.email_address, Customer.address, Customer.postcode, Customer.state,
       Image.image_url
FROM Job
INNER JOIN Customer ON Job.customer_id = Customer.customer_id
LEFT JOIN Image ON Job.job_id = Image.job_id
WHERE Job.job_id = 1;
```
Retrieving all quotations for a specific job with their corresponding maker details:
```
SELECT Quotation.quotation_id, Quotation.price, Quotation.comments, 
       Maker.name, Maker.location
FROM Quotation
INNER JOIN Maker ON Quotation.maker_id = Maker.maker_id
WHERE Quotation.job_id = 1;
```
Inserting a new quotation for a specific job:
```
INSERT INTO Quotation (job_id, maker_id, price, comments)
VALUES (1, 1, 600, 'I can complete this job in 3 weeks.');
```

list all jobs and view information such as job type, making, status, count of quotations, location, etc
```
SELECT j.job_id, j.job_type, j.making, j.status, COUNT(q.quotation_id) AS quotation_count, c.address
FROM Job j
JOIN Customer c ON j.customer_id = c.customer_id
LEFT JOIN Quotation q ON j.job_id = q.job_id
GROUP BY j.job_id, j.job_type, j.making, j.status, c.address;
```

Get corresponding customer details with job id
```
SELECT c.*
FROM Customer c
JOIN Job j ON c.customer_id = j.customer_id
WHERE j.job_id = <job_id_value>;
```
Get all quotations of the corresponding job id
```
SELECT q.*
FROM Quotation q
WHERE q.job_id = <job_id_value>;
```
get quotes with job id and their corresponding maker name 
```
SELECT q.*, m.name AS maker_name
FROM Quotation q
JOIN Maker m ON q.maker_id = m.maker_id
WHERE q.job_id = <job_id_value>;
```

while submitting a new job
```
BEGIN; -- Start the transaction

-- Insert job information into Job table
INSERT INTO Job (customer_id, job_type, making, description, budget, status)
VALUES (customer_id_value, 'job_type_value', 'making_value', 'description_value', budget_value, 'status_value')
RETURNING job_id INTO job_id_variable; -- Store the generated job_id into a variable

-- Insert images into Image table
INSERT INTO Image (job_id, image_url)
VALUES (job_id_variable, 'image_url1_value'), (job_id_variable, 'image_url2_value'); -- Use the generated job_id

COMMIT; -- Commit the transaction
```