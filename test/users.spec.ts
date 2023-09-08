import { afterAll, beforeEach, beforeAll, describe, it, expect } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from '../src/app'

describe('Users routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })
  
  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:unlock')
    execSync('npm run knex migrate:latest')
  })


  it('should be able to create a new user', async () => {
    await request(app.server)
      .post('/users')
      .send({ name: 'john doe', email: 'johndoe@gmail.com' })
      .expect(201)
  })

  it('should be possible to retrieve user metrics', async () => {
    const createUsersResponse = await request(app.server)
      .post('/users')
      .send({ name: 'john doe', email: 'johndoe@gmail.com' })
      

      const cookies = createUsersResponse.get('Set-Cookie')

      const listUsersReponse = await request(app.server)
      .get('/users')
      .set('Cookie', cookies)
      

        // Pega o ID do usuário criado
      const user_id = listUsersReponse.body[0].id;

      

      await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({ name: "Comida da manha", description: "Sanduiche com suco de laranja", on_diet: true, user_id: user_id })
      

      await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({ name: "Comida da tarde", description: "Cookies com Coca cola", on_diet: false, user_id: user_id })
      

      await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({ name: "Comida da noite", description: "Legumes e peixes", on_diet: true, user_id: user_id })
      

      await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({ name: "Comida da madrugada", description: "Melancia e banana", on_diet: true, user_id: user_id })
      

      

      // Requisição para pegar métricas
    const listMetricsResponse = await request(app.server)
    .get(`/users/${user_id}/metrics`)
    .set('Cookie', cookies)
    


    // Verificação das métricas
    expect(listMetricsResponse.body.metrics).toEqual({
      "totalMealsCount": 4,
      "mealsOnDietCount": 3,
      "mealsOffDietCount": 1,
      "bestSequenceOfMealsOnDiet": 2
    });
});


it('should be possible to list all of a users meals', async () => {
  const createUsersResponse = await request(app.server)
    .post('/users')
    .send({ name: 'john doe', email: 'johndoe@gmail.com' })
    

    const cookies = createUsersResponse.get('Set-Cookie')

    const listUsersReponse = await request(app.server)
    .get('/users')
    .set('Cookie', cookies)
    

      // Pega o ID do usuário criado
    const user_id = listUsersReponse.body[0].id;

    

    await request(app.server)
    .post('/meals')
    .set('Cookie', cookies)
    .send({ name: "Comida da manha", description: "Sanduiche com suco de laranja", on_diet: true, user_id: user_id })
    

    await request(app.server)
    .post('/meals')
    .set('Cookie', cookies)
    .send({ name: "Comida da tarde", description: "Cookies com Coca cola", on_diet: false, user_id: user_id })
    

    await request(app.server)
    .post('/meals')
    .set('Cookie', cookies)
    .send({ name: "Comida da noite", description: "Legumes e peixes", on_diet: true, user_id: user_id })
    

    await request(app.server)
    .post('/meals')
    .set('Cookie', cookies)
    .send({ name: "Comida da madrugada", description: "Melancia e banana", on_diet: true, user_id: user_id })
    

    
    const listAllMealsResponse = await request(app.server)
    .get(`/users/${user_id}`)
    .set('Cookie', cookies)
    .expect(200)

    expect(listAllMealsResponse.body).length(4)
  
});



  })
