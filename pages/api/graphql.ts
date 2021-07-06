import { ApolloServer, gql, IResolvers, UserInputError } from 'apollo-server-micro'
import mysql from 'serverless-mysql'
import { OkPacket } from 'mysql'
import { Resolvers, TaskStatus } from '../../generated/graphql-backend'

const typeDefs = gql`

  enum TaskStatus {
    active
    completed
  }

  type Task {
    id: Int!
    title: String!
    status: TaskStatus!
  }

  type Query {
    tasks(status: TaskStatus): [Task!]!
    task(id: Int!): Task
  }

  input CreateTaskInput {
    title: String!
  }

  input UpdateTaskInput {
    id: Int!
    title: String
    status: TaskStatus
  }
  
  type Mutation {
    createTask(input: CreateTaskInput!): Task
    updateTask(input: UpdateTaskInput!): Task
    deleteTask(id: Int!): Task
  }
`

interface ApolloContext {
  db: mysql.ServerlessMysql
}

interface Task {
  id: number
  title: string
  status: TaskStatus
}

type TaskDbRow = {
  id:number
  title: string
  task_status: TaskStatus
}

type TasksDbQueryResult = TaskDbRow[]
type TaskDbQueryResult = TaskDbRow[]

const getTaskById = async (id: number, context:ApolloContext) => {
      const query = 'SELECT id, title, task_status FROM tasks WHERE id= ?'
      
      const tasks = await context.db.query<TaskDbQueryResult>(
        query,
        [id]
      )

      await db.end()

     return tasks.length ? { id: tasks[0].id, title: tasks[0].title, status: tasks[0].task_status}: null
}

const resolvers: Resolvers<ApolloContext> = {
  Query: {
    async tasks(parent, args, context){
      const { status }  = args
      
      let query = 'SELECT id, title, task_status FROM tasks'
      const queryParams: string[] = []
      if(status) { 
        query += ' WHERE task_status = ?'
        queryParams.push(status)
      }

      const tasks = await context.db.query<TasksDbQueryResult>(
        query,
        queryParams
      )
      await db. end()
      
      return tasks.map(({ id, title, task_status }) => ({ id, title, status: task_status }))
    },
    async task(parent, { id }, context) {
      return await getTaskById(id, context)
    }
  },
  Mutation: {
    async createTask(parent, args, context):Promise<Task> {

      const result = await context.db.query<OkPacket>('INSERT INTO tasks (title, task_status) VALUES(?, ?)', [args.input.title, TaskStatus.Active])

      return {
        id: result.insertId,
        title: args.input.title,
        status: TaskStatus.Active
      }
    },
    async updateTask(parent, { input: { id, title, status} }, context) {

      let query = 'UPDATE tasks SET'
      const queryParams: (string|number)[] = []

      if(title){
        query += ' title= ?,'
        queryParams.push(title)
      }

      if(status){
        query += ' task_status= ?'
        queryParams.push(status)
      }
      query += ' WHERE id= ?'
      queryParams.push(id)
      
      await context.db.query<OkPacket>(
        query,
        queryParams
      )
      
      db.end()

      return await getTaskById(id, context) 

    },
    async deleteTask(parent, { id }, context) {

      const task = await getTaskById(id, context)

      if(!task) {
        throw new UserInputError('Could not find a task with that id.')
      }

      db.query(
        'DELETE FROM tasks WHERE id= ?',
        [id]
      )

      db.end()

      return task

    }
  }
}

const db = mysql({
  config: {
    host: process.env.MYSQL_HOST,
    database: process.env.MYSQL_DATABASE,
    password: process.env.MYSQL_PASSWORD,
    user: process.env.MYSQL_USER
  }
})



const apolloServer = new ApolloServer({ typeDefs, resolvers, context: { db } })

export const config = {
  api: {
    bodyParser: false,
  },
}

export default apolloServer.createHandler({ path: '/api/graphql' })
