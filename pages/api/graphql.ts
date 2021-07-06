import { ApolloServer, gql, IResolvers } from 'apollo-server-micro'
import mysql from 'serverless-mysql'
import { OkPacket } from 'mysql'

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

enum TaskStatus {
  active = 'active',
  complete = 'complete'
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

type TaskDbQueryResult = TaskDbRow[]

const resolvers: IResolvers<any, ApolloContext> = {
  
  Query: {
    async tasks(parent, args: { status?: TaskStatus }, context): Promise<Task[]> {
      const { status }  = args
      
      let query = 'SELECT id, title, task_status FROM tasks'
      const queryParams: string[] = []
      if(status) { 
        query += ' WHERE task_status = ?'
        queryParams.push(status)
      }
      console.log({query, status, queryParams})
      const tasks = await context.db.query<TaskDbQueryResult>(
        query,
        queryParams
      )
      await db. end()
      
      return tasks.map(({ id, title, task_status }) => ({ id, title, status: task_status }))
    },
    task(parent, args, context) {
      return null
    }
  },
  Mutation: {
    async createTask(parent, args: { input: { title: string } }, context):Promise<Task> {

      const result = await context.db.query<OkPacket>('INSERT INTO tasks (title, task_status) VALUES(?, ?)', [args.input.title, TaskStatus.active])

      return {
        id: result.insertId,
        title: args.input.title,
        status: TaskStatus.active
      }
    },
    updateTask(parent, args, context) {
      return null
    },
    deleteTask(parent, args, context) {
      return null
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
