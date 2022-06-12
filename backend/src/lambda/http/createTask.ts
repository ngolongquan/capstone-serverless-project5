import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { CreateTaskRequest } from '../../requests/CreateTaskRequest'
import { createTaskItem } from '../../businessLogic/tasks'
import { createLogger } from '../../utils/logger'

const logger = createLogger('tasks');
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const newTask: CreateTaskRequest = JSON.parse(event.body)
    // TODO: Implement creating a new TASK item
    if(!newTask.name)
    {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'ERROR: The name is empty.'
        })
      };
    }

    const task = await createTaskItem(event, newTask);
    logger.info("Task item has been created");
    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
  
      body: JSON.stringify({
        item: task
      })
    };
  })

handler.use(
  cors({
    credentials: true
  })
)
