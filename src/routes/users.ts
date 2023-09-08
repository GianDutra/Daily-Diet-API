import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

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


         //Você coloca o id do usuário e pode ver todas as suas refeições
         app.get(
          '/:id',
          {
            preHandler: [checkSessionIdExists],
          },
          async (req, res) => {
            const createUserBodySchema = z.object({
              id: z.string(),
            })  

            const { id } = createUserBodySchema.parse(req.params)
            const { sessionId } = req.cookies;
        
            // Verificar se o usuário com o ID fornecido existe
            const user = await knex('users').where('id', id).first();
        
            if (!user) {
              return res.status(404).send({ message: 'User not found' });
            }
        
            // Verificar se a session_id é a mesma, pois ele só pode visualizar as refeições dele mesmo.
            if (user.session_id !== sessionId) {
              return res.status(403).send({
                status: 'error',
                data: 'Session ID does not match',
              });
            }
        
            // Obter as refeições do usuário
            const meals = await knex('meals').where('user_id', id);
        
            return res.status(200).send(meals);
          }
        );



        app.get('/:id/metrics', async (req, res) => {
          const getUserParamsSchema = z.object({
            id: z.string().uuid()
          });
        
          const { id } = getUserParamsSchema.parse(req.params);
        
          const meals = await knex('meals')
            .where('user_id', id)
            .orderBy('created_at')
            .select();
        
          let mealsOnDietCount = 0;
          let mealsOffDietCount = 0;
          let currentSequence = 0;
          let maxSequence = 0;
        
          meals.forEach((meal, index) => {
            if (meal.on_diet) {
              mealsOnDietCount++;
              currentSequence = index > 0 && meals[index - 1].on_diet ? currentSequence + 1 : 1;
              maxSequence = Math.max(maxSequence, currentSequence);
            } else {
              mealsOffDietCount++;
              currentSequence = 0;
            }
          });
        
          const totalMealsCount = meals.length;
        
          const metrics = {
            totalMealsCount,
            mealsOnDietCount,
            mealsOffDietCount,
            bestSequenceOfMealsOnDiet: maxSequence
          };
        
          return res.status(200).send({ metrics });
        });
      
    }


    