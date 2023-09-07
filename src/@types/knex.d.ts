import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    meals: {
      id: string
      user_id: string
      name: string
      description: string
      created_at: string
      on_diet: boolean
    }

    users: {
      id: string
      name: string
      email: string
      created_at: string
      session_id?: string
    }
  }
}