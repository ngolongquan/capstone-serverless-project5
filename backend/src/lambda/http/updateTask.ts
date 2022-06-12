import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors} from 'middy/middlewares'
import { updateTaskItem } from '../../businessLogic/tasks'
import { UpdateTaskRequest } from '../../requests/UpdateTaskRequest'
import { createLogger } from '../../utils/logger'

const logger = createLogger('tasks');
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {    
    const updatedTask: UpdateTaskRequest = JSON.parse(event.body)
    // TODO: Update a TASK item with the provided id using values in the "updatedTask" object
    const isExist = await updateTaskItem(event, updatedTask);
    console.log("Check existing" + isExist);
    logger.info("Check existing" + isExist);
    // check task item is existing or not first
    if (!isExist) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'ERROR, this task item not found'
        })
      };
    }
    logger.info("Task item has been updated");
    // then update it
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({})
    }
  })


  handler  
  .use(
    cors({
      credentials: true
    })
  )

