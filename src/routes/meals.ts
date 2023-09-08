import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'crypto'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function mealsRoutes(app: FastifyInstance) {

  // Faz com que o usuário visualize somente as meals que foram criadas com seu cookies.
  // Fiz esta rota apenas para testes, porque fiz outra rota que estou usando 
  // em users.ts, no qual você coloca o /users/id e além de verificar o cookies igual essa(caso contrário não mostra),
  // ela também verifica se o user existe ou não, então considero a outra rota a correta e está apenas para testes.
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
    async (req, res) => {
      const getMealsParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealsParamsSchema.parse(req.params)

      const { sessionId } = req.cookies;
  
      const user = await knex('users').where({ session_id: sessionId }).first();
      //Caso a sessão não exista, então a refeição não é do usuário, logo ele não tem permissão para visualizar.
      if (!user) {
        return res.status(403).send({
          status: 'error',
          data: 'Session ID does not exist on this device, therefore you do not have permission to visualize this meal',
        });
      }

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


 
  // Cria a refeição e vincula o "id" da tabela "users" ao "user_id" da tabela "meals"
  app.post('/', async (req, res) => {
    const createMealBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      on_diet: z.boolean(),
      user_id: z.string(),
    })


    const { sessionId } = req.cookies

    const user = await knex('users').where('session_id', sessionId).first()
    

    if (!user) {
      return res.status(404).send({ message: 'User not found' })
    }


    const { name, description, on_diet, user_id } =
    createMealBodySchema.parse(req.body)

    const userExists = await knex('users').where('id', user_id).first();

    if (!userExists) {
      return res.status(404).send({ message: 'User_id not found' });
    }


    await knex('meals').insert({
      id: randomUUID(),
      user_id,
      name,
      description,
      on_diet
    })

    res.status(201).send()
  })

  // Deleta um usuário através de seu "id" da tabela "users", também pode ser encontrado como "user_id" da tabela "meals"
  app.delete(
    '/:id',
    {
      preHandler: [checkSessionIdExists]
    },
    async (req, res) => {
      const params = req.params as { id: string };
  
      const { id } = params;
  
      const meal = await knex('meals').where('id', id).first();
  
      if (!meal) {
        return res.status(404).send({ message: 'Meal not found' });
      }
  
      const { sessionId } = req.cookies;
  
      const user = await knex('users').where({ session_id: sessionId }).first();
      //Caso a sessão não exista, então ela não é do usuário, logo ele não tem permissão para deletar.
      if (!user) {
        return res.status(403).send({
          status: 'error',
          data: 'Session ID does not exist on this device, therefore you do not have permission to delete',
        });
      }
  
      await knex('meals').where('id', id).delete();
  
      return res.status(204).send();
    }
  )
  
  // Modifica o campo nome, descrição, Data e hora e se está ou não dentro da dieta
  app.put(
    '/:id',
    {
      preHandler: [checkSessionIdExists]
    },
    async (req, res) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid()
      })

      const regexData = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

      const editMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        created_at: z.string().regex(regexData, { message: "Invalid date format" }),
        //created_at: z.string(), //.datetime(),
        on_diet: z.boolean()
      })

      const { id } = getMealParamsSchema.parse(req.params)

      const { name, description, on_diet, created_at  } =
        editMealBodySchema.parse(req.body)

        const { sessionId } = req.cookies;
  
        const user = await knex('users').where({ session_id: sessionId }).first();
        //Caso a sessão não exista, então ela não é do usuário, logo ele não tem permissão para editar.
        if (!user) {
          return res.status(403).send({
            status: 'error',
            data: 'Session ID does not exist on this device, therefore you do not have permission to delete',
          });
        }

      await knex('meals').where('id', id).update({
        name,
        description,
        created_at,
        on_diet
      })

      return res.status(204).send()
    }
  )
  
  
}
