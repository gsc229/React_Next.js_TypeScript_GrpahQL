import { ApolloServer, gql, IResolvers } from 'apollo-server-micro'

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

const resolvers: IResolvers<{ hello: "World" }, { name: "Hello" }> = {
  Query: {
    tasks(parent, args, context) {
      return []
    },
    task(parent, args, context) {
      return null
    }
  },
  Mutation: {
    createTask(parent, args, context) {
      return null
    },
    updateTask(parent, args, context) {
      return null
    },
    deleteTask(parent, args, context) {
      return null
    }
  }
}

const apolloServer = new ApolloServer({ typeDefs, resolvers })

export const config = {
  api: {
    bodyParser: false,
  },
}

export default apolloServer.createHandler({ path: '/api/graphql' })
