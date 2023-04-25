/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/
import HealthCheck from '@ioc:Adonis/Core/HealthCheck'
import Route from '@ioc:Adonis/Core/Route'
import Database from '@ioc:Adonis/Lucid/Database'
import { schema } from '@ioc:Adonis/Core/Validator'

Route.get('/', async ({  }) => {
  
})

Route.get('health', async ({response}) => {
  // return { status: 'ok' }
  const report = await HealthCheck.getReport()

  return report.healthy ? response.ok(report) : response.badRequest(report)
});

Route.get('/api/customers', async ({ response }) => {
  const customers = await Database
    .rawQuery("SELECT Job.job_id, Job.job_type, Job.making, Job.description, Job.budget, Job.status, Customer.first_name, Customer.last_name, Customer.phone_number, Customer.email_address, Customer.address, Customer.postcode, Customer.state FROM Job INNER JOIN Customer ON Job.customer_id = Customer.customer_id WHERE Job.status = 'Open'")
  response.send(customers.rows);
});

Route.get('/api/products', async ({ response }) => {
  const products = await Database
    .rawQuery("SELECT Job.job_id, Job.job_type, Job.making, Job.description, Job.budget, Job.status, Customer.first_name, Customer.last_name, Customer.phone_number, Customer.email_address, Customer.address, Customer.postcode, Customer.state,Image.image_url FROM Job INNER JOIN Customer ON Job.customer_id = Customer.customer_id LEFT JOIN Image ON Job.job_id = Image.job_id")
  response.send(products.rows);
});

Route.get('/api/listjobs', async ({ response }) => {
  const listjobs = await Database.rawQuery("SELECT j.job_id, j.job_type, j.making, j.status, j.budget, c.address, c.state, COUNT(q.quotation_id) AS quotation_count, i.image_url FROM Job j JOIN Customer c ON j.customer_id = c.customer_id LEFT JOIN Quotation q ON j.job_id = q.job_id LEFT JOIN Image i ON j.job_id = i.job_id GROUP BY j.job_id, j.job_type, j.making, j.status, c.address, c.state, i.image_url ORDER BY j.job_id;")
  response.send(listjobs.rows);
})

Route.get('/api/customer/:job_id', async ({ params, response }) => {
  const customerDetails = await Database.rawQuery(`SELECT c.* FROM Customer c JOIN Job j ON c.customer_id = j.customer_id WHERE j.job_id =${params.job_id};`);
  response.send(customerDetails.rows);
})

Route.get('/api/quotations/:job_id', async ({ params, response }) => {
  const quotations = await Database.rawQuery(`SELECT q.*, m.name AS maker_name, m.email_id as maker_email, m.location as maker_location FROM Quotation q JOIN Maker m ON q.maker_id = m.maker_id WHERE q.job_id = ${params.job_id};`);
  response.send(quotations.rows);
})

Route.get('/api/images/:job_id', async ({ params, response }) => {
  const image = await Database.rawQuery(`SELECT image_url FROM Image WHERE job_id = ${params.job_id};`);
  response.send(image.rows);
})
Route.post('/api/addjob', async ({ request, response }) => {
  const {firstName, lastName, phoneNumber, email, address, postcode, state, typeOfClothing, budget, description} = request.body();
  // request.body().images = images[0];

  // console.log(request.body().images);
  const postSchema = schema.create({
    firstName: schema.string(),
    lastName: schema.string(),
    phoneNumber: schema.string(),
    email: schema.string(),
    typeOfClothing: schema.string(),
    address: schema.string(),
    postcode: schema.string(),
    state: schema.string(),
    description: schema.string(),
    budget: schema.string(),
    images: schema.file({
        size: '2mb',
        extnames: ['jpg', 'gif', 'png', 'jpeg','PNG','JPG','JPEG','GIF'],
      }),
  
  })
  const payload = await request.validate({ schema: postSchema })
  
  let customer_id = await Database.rawQuery(`SELECT customer_id FROM Customer WHERE email_address = '${email}';`);
  if (customer_id.rows.length === 0) {
    await Database.rawQuery(`INSERT INTO Customer (first_name, last_name, phone_number, email_address, address, postcode, state) VALUES ('${firstName}', '${lastName}', '${phoneNumber}', '${email}', '${address}', '${postcode}', '${state}');`);
    customer_id = await Database.rawQuery(`SELECT customer_id FROM Customer WHERE email_address = '${email}';`);
    
  }
  
  await Database.rawQuery(`INSERT INTO Job (job_type, making, description, budget, status, customer_id) VALUES ('${typeOfClothing}', 'Making', '${description.replaceAll("'","''")}', ${budget}, 'Open', ${customer_id.rows[0].customer_id});`);
  const job_id = await Database.rawQuery(`SELECT job_id FROM Job WHERE customer_id = ${customer_id.rows[0].customer_id} ORDER BY job_id DESC LIMIT 1;`);
  

  await payload.images.moveToDisk('images', {
    name: `${job_id.rows[0].job_id}`
  }, 's3')

  await Database.rawQuery(`INSERT INTO Image (job_id, image_url) VALUES (${job_id.rows[0].job_id}, 'https://elasticbeanstalk-us-east-2-685213808672.s3.us-east-2.amazonaws.com/images/${job_id.rows[0].job_id}');`);
  response.send(job_id.rows);
});

Route.post('/api/addQuotations', async ({ request, response }) => {
  const {job_id, price, comments, name, email, location} = request.body();
  let status = "";
  //{ comments:comments.value, job_id: displayForm, name:name.value, email:email.value, price:price.value }
  let maker = await Database.rawQuery(`SELECT maker_id FROM Maker WHERE email_id = '${email}';`);
  if (maker.rows.length === 0) {
    await Database.rawQuery(`INSERT INTO Maker (name, email_id, location) VALUES ('${name}', '${email}', '${location}');`);
    maker = await Database.rawQuery(`SELECT maker_id FROM Maker WHERE email_id = '${email}';`);
    await Database.rawQuery(`INSERT INTO Quotation (job_id, maker_id, price, comments) VALUES (${job_id}, ${maker.rows[0].maker_id}, ${price}, '${comments}');`);
    status = "added";
  }else{
    let quotation = await Database.rawQuery(`SELECT quotation_id FROM Quotation WHERE job_id = ${job_id} AND maker_id = ${maker.rows[0].maker_id};`)
    if(quotation.rows.length === 0){
      await Database.rawQuery(`INSERT INTO Quotation (job_id, maker_id, price, comments) VALUES (${job_id}, ${maker.rows[0].maker_id}, ${price}, '${comments}');`);
      status = "added";
    }else{
      await Database.rawQuery(`UPDATE Quotation SET price = ${price}, comments = '${comments}' WHERE job_id = ${job_id} AND maker_id = ${maker.rows[0].maker_id};`);
      status = "updated";
    }
  }

  response.send({...maker.rows,status});
})
