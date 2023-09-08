import { afterAll, beforeEach, beforeAll, describe, it, expect } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from '../src/app'

describe('Meals routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })
  
  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })


  it.only('should be able to create a new meal', async () => {

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
      .expect(201)



    
  })
})
