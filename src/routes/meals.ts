import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'crypto'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function mealsRoutes(app: FastifyInstance) {

  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists]
    },
    async (req, res) => {
      const { sessionId } = req.cookies

      const user = await knex('users').where('session_id', sessionId).first()

      if (!user) {
        return res.status(404).send({ message: 'User not found' })
      }

      const meals = await knex('meals').where('user_id', user.id).select()

      return { meals }
    }
  )

  //Você coloca o id da comida e pode ver uma refeição espefícica
  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const getMealsParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealsParamsSchema.parse(request.params)

      const { sessionId } = request.cookies

      const meal = await knex('meals')
        .where({
          id,
        })
        .first()

      return {
        meal,
      }
    },
  )


 

  app.post('/', async (req, res) => {
    const createMealBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      on_diet: z.boolean(),
      user_id: z.string(),
    })

    const { sessionId } = req.cookies

    //const user = await knex('users').where('session_id', sessionId).first()
    //console.log(user)

    //if (!user) {
    //  return res.status(404).send({ message: 'User not found' })
    //}

    const { name, description, on_diet, user_id } =
      createMealBodySchema.parse(req.body)

    await knex('meals').insert({
      id: randomUUID(),
      user_id,
      name,
      description,
      on_diet
    })

    res.status(201).send()
  })

}
