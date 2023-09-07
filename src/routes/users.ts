import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { knex } from '../database'

export async function usersRoutes(app: FastifyInstance) {
    app.get('/', async (req, res) => {
        const users = await knex('users').select('*');
        return res.send(users);
      });
    
    app.post('/', async (req, res) => {
        const createUserBodySchema = z.object({
          name: z.string(),
          email: z.string().email(),
        })
    
        const { name, email } = createUserBodySchema.parse(req.body)
    
        let sessionId = req.cookies.sessionId
    
        if (!sessionId) {
          sessionId = randomUUID()
    
          res.cookie('sessionId', sessionId, {
            path: '/',
            maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
          })
        }
    
        const userAlreadyExists = await knex('users').where('email', email).first()
    
        if (userAlreadyExists) {
          return res.status(409).send({ message: 'The user already exists' })
        }
    
        await knex('users').insert({
          id: randomUUID(),
          name,
          email,
          session_id: sessionId
        })
    
        return res.status(201).send()
      })
    }